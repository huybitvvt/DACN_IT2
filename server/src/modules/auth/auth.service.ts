import type { User } from '@prisma/client';
import { createHash, randomBytes } from 'node:crypto';
import { env } from '../../config/env.js';
import { prisma } from '../../db/prisma.js';
import { sendRegistrationVerificationEmail } from '../../services/email.js';
import { AppError } from '../../utils/AppError.js';
import { hashPassword, verifyPassword } from '../../utils/password.js';
import type { LoginInput, RegisterInput, VerifyRegistrationInput } from './auth.schema.js';

const REGISTRATION_LINK_EXPIRES_MINUTES = 30;

// Dạng dữ liệu người dùng an toàn để trả ra ngoài (không có passwordHash).
export interface PublicUser {
  id: string;
  email: string;
  displayName: string;
  role: User['role'];
  streakCount: number;
}

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    streakCount: user.streakCount,
  };
}

function createVerificationToken() {
  return randomBytes(32).toString('base64url');
}

function hashRegistrationToken(email: string, token: string) {
  return createHash('sha256').update(`${email}:${token}`).digest('hex');
}

function createRegistrationVerifyUrl(email: string, token: string) {
  const baseUrl = env.publicApiUrl || env.clientOrigin;
  const url = new URL('/api/auth/register/verify-link', baseUrl);
  url.searchParams.set('email', email);
  url.searchParams.set('token', token);
  return url.toString();
}

// Đăng ký người dùng mới. Ném lỗi nếu email đã tồn tại (Yêu cầu 1.2).
export async function registerUser(input: RegisterInput): Promise<PublicUser> {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw AppError.badRequest('Email này đã được đăng ký.');
  }

  const passwordHash = await hashPassword(input.password);
  const user = await prisma.user.create({
    data: {
      email: input.email,
      displayName: input.displayName,
      passwordHash,
    },
  });

  return toPublicUser(user);
}

export async function requestRegistrationCode(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw AppError.badRequest('Email này đã được đăng ký.');
  }

  const token = createVerificationToken();
  const passwordHash = await hashPassword(input.password);
  const expiresAt = new Date(Date.now() + REGISTRATION_LINK_EXPIRES_MINUTES * 60 * 1000);

  await prisma.registrationVerification.upsert({
    where: { email: input.email },
    create: {
      email: input.email,
      displayName: input.displayName,
      passwordHash,
      codeHash: hashRegistrationToken(input.email, token),
      expiresAt,
    },
    update: {
      displayName: input.displayName,
      passwordHash,
      codeHash: hashRegistrationToken(input.email, token),
      attempts: 0,
      expiresAt,
    },
  });

  await sendRegistrationVerificationEmail({
    to: input.email,
    displayName: input.displayName,
    verifyUrl: createRegistrationVerifyUrl(input.email, token),
    expiresInMinutes: REGISTRATION_LINK_EXPIRES_MINUTES,
  });

  return { expiresInMinutes: REGISTRATION_LINK_EXPIRES_MINUTES };
}

export async function verifyRegistrationCode(input: VerifyRegistrationInput): Promise<PublicUser> {
  const pending = await prisma.registrationVerification.findUnique({
    where: { email: input.email },
  });

  if (!pending) {
    throw AppError.badRequest('Vui lòng đăng ký lại để nhận link xác thực.');
  }

  if (pending.expiresAt.getTime() < Date.now()) {
    await prisma.registrationVerification.delete({ where: { email: input.email } });
    throw AppError.badRequest('Link xác thực đã hết hạn. Vui lòng đăng ký lại.');
  }

  const expectedHash = hashRegistrationToken(input.email, input.token);
  if (pending.codeHash !== expectedHash) {
    throw AppError.badRequest('Link xác thực không hợp lệ.');
  }

  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    await prisma.registrationVerification.delete({ where: { email: input.email } });
    throw AppError.badRequest('Email này đã được đăng ký.');
  }

  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        email: pending.email,
        displayName: pending.displayName,
        passwordHash: pending.passwordHash,
      },
    });
    await tx.registrationVerification.delete({ where: { email: pending.email } });
    return created;
  });

  return toPublicUser(user);
}

// Xác thực đăng nhập. Trả về user nếu đúng, ném 401 chung nếu sai
// (không tiết lộ email hay mật khẩu sai - Yêu cầu 1.4).
export async function authenticate(input: LoginInput): Promise<User> {
  const invalid = AppError.unauthorized('Email hoặc mật khẩu không đúng.');

  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) {
    // Vẫn băm một lần để giảm rò rỉ thời gian (timing attack) - tuỳ chọn nhẹ.
    await verifyPassword(
      '$argon2id$v=19$m=65536,t=3,p=4$0000000000000000$0000000000000000000000000000000000000000000',
      input.password,
    );
    throw invalid;
  }

  const ok = await verifyPassword(user.passwordHash, input.password);
  if (!ok) {
    throw invalid;
  }

  return user;
}

// Lấy người dùng theo id (cho /me).
export async function getUserById(id: string): Promise<PublicUser | null> {
  const user = await prisma.user.findUnique({ where: { id } });
  return user ? toPublicUser(user) : null;
}
