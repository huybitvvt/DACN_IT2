import type { User } from '@prisma/client';
import { createHash, randomInt } from 'node:crypto';
import { prisma } from '../../db/prisma.js';
import { sendRegistrationCodeEmail } from '../../services/email.js';
import { AppError } from '../../utils/AppError.js';
import { hashPassword, verifyPassword } from '../../utils/password.js';
import type { LoginInput, RegisterInput, VerifyRegistrationInput } from './auth.schema.js';

const REGISTRATION_CODE_EXPIRES_MINUTES = 10;
const MAX_REGISTRATION_CODE_ATTEMPTS = 5;

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

function createNumericCode() {
  return String(randomInt(100000, 1000000));
}

function hashRegistrationCode(email: string, code: string) {
  return createHash('sha256').update(`${email}:${code}`).digest('hex');
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

  const code = createNumericCode();
  const passwordHash = await hashPassword(input.password);
  const expiresAt = new Date(Date.now() + REGISTRATION_CODE_EXPIRES_MINUTES * 60 * 1000);

  await prisma.registrationVerification.upsert({
    where: { email: input.email },
    create: {
      email: input.email,
      displayName: input.displayName,
      passwordHash,
      codeHash: hashRegistrationCode(input.email, code),
      expiresAt,
    },
    update: {
      displayName: input.displayName,
      passwordHash,
      codeHash: hashRegistrationCode(input.email, code),
      attempts: 0,
      expiresAt,
    },
  });

  await sendRegistrationCodeEmail({
    to: input.email,
    displayName: input.displayName,
    code,
    expiresInMinutes: REGISTRATION_CODE_EXPIRES_MINUTES,
  });

  return { expiresInMinutes: REGISTRATION_CODE_EXPIRES_MINUTES };
}

export async function verifyRegistrationCode(input: VerifyRegistrationInput): Promise<PublicUser> {
  const pending = await prisma.registrationVerification.findUnique({
    where: { email: input.email },
  });

  if (!pending) {
    throw AppError.badRequest('Vui lòng đăng ký lại để nhận mã xác thực.');
  }

  if (pending.expiresAt.getTime() < Date.now()) {
    await prisma.registrationVerification.delete({ where: { email: input.email } });
    throw AppError.badRequest('Mã xác thực đã hết hạn. Vui lòng yêu cầu mã mới.');
  }

  if (pending.attempts >= MAX_REGISTRATION_CODE_ATTEMPTS) {
    throw AppError.badRequest('Bạn đã nhập sai quá nhiều lần. Vui lòng yêu cầu mã mới.');
  }

  const expectedHash = hashRegistrationCode(input.email, input.code);
  if (pending.codeHash !== expectedHash) {
    await prisma.registrationVerification.update({
      where: { email: input.email },
      data: { attempts: { increment: 1 } },
    });
    throw AppError.badRequest('Mã xác thực không đúng.');
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
