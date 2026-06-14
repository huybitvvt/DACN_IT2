import type { User } from '@prisma/client';
import { createHash, randomBytes } from 'node:crypto';
import { env } from '../../config/env.js';
import { prisma } from '../../db/prisma.js';
import { sendPasswordResetEmail, sendRegistrationVerificationEmail } from '../../services/email.js';
import { AppError } from '../../utils/AppError.js';
import { hashPassword, verifyPassword } from '../../utils/password.js';
import type {
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
  VerifyRegistrationInput,
} from './auth.schema.js';

const REGISTRATION_LINK_EXPIRES_MINUTES = 30;
const PASSWORD_RESET_LINK_EXPIRES_MINUTES = 30;
const GOOGLE_SCOPE = 'openid email profile';

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

function hashResetToken(userId: string, token: string) {
  return createHash('sha256').update(`${userId}:${token}`).digest('hex');
}

function createRegistrationVerifyUrl(email: string, token: string) {
  const baseUrl = env.publicApiUrl || env.clientOrigin;
  const url = new URL('/api/auth/register/verify-link', baseUrl);
  url.searchParams.set('email', email);
  url.searchParams.set('token', token);
  return url.toString();
}

function createPasswordResetUrl(email: string, token: string) {
  const url = new URL('/reset-password', env.clientOrigin);
  url.searchParams.set('email', email);
  url.searchParams.set('token', token);
  return url.toString();
}

function getGoogleCallbackUrl() {
  if (env.googleCallbackUrl) return env.googleCallbackUrl;
  const baseUrl = env.publicApiUrl || env.clientOrigin;
  return new URL('/api/auth/google/callback', baseUrl).toString();
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

export async function requestPasswordReset(input: ForgotPasswordInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) {
    console.info(`[auth] Bỏ qua gửi reset password vì email chưa có tài khoản: ${input.email}`);
    return { sent: true };
  }

  const token = createVerificationToken();
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_LINK_EXPIRES_MINUTES * 60 * 1000);

  await prisma.passwordResetToken.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      tokenHash: hashResetToken(user.id, token),
      expiresAt,
    },
    update: {
      tokenHash: hashResetToken(user.id, token),
      expiresAt,
    },
  });

  await sendPasswordResetEmail({
    to: user.email,
    displayName: user.displayName,
    resetUrl: createPasswordResetUrl(user.email, token),
    expiresInMinutes: PASSWORD_RESET_LINK_EXPIRES_MINUTES,
  });

  return { sent: true };
}

export async function resetPassword(input: ResetPasswordInput) {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    include: { passwordReset: true },
  });

  if (!user?.passwordReset) {
    throw AppError.badRequest('Link đặt lại mật khẩu không hợp lệ.');
  }

  if (user.passwordReset.expiresAt.getTime() < Date.now()) {
    await prisma.passwordResetToken.delete({ where: { userId: user.id } });
    throw AppError.badRequest('Link đặt lại mật khẩu đã hết hạn.');
  }

  const expectedHash = hashResetToken(user.id, input.token);
  if (user.passwordReset.tokenHash !== expectedHash) {
    throw AppError.badRequest('Link đặt lại mật khẩu không hợp lệ.');
  }

  const passwordHash = await hashPassword(input.password);
  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.delete({ where: { userId: user.id } }),
  ]);

  return { success: true };
}

export function createGoogleAuthUrl(state: string) {
  if (!env.googleClientId || !env.googleClientSecret) {
    throw AppError.internal('Chưa cấu hình Google OAuth.');
  }

  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.set('client_id', env.googleClientId);
  url.searchParams.set('redirect_uri', getGoogleCallbackUrl());
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', GOOGLE_SCOPE);
  url.searchParams.set('state', state);
  url.searchParams.set('prompt', 'select_account');
  return url.toString();
}

interface GoogleTokenResponse {
  access_token?: string;
  error?: string;
  error_description?: string;
}

interface GoogleUserInfo {
  sub: string;
  email: string;
  email_verified?: boolean;
  name?: string;
}

async function exchangeGoogleCode(code: string): Promise<string> {
  if (!env.googleClientId || !env.googleClientSecret) {
    throw AppError.internal('Chưa cấu hình Google OAuth.');
  }

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: env.googleClientId,
      client_secret: env.googleClientSecret,
      redirect_uri: getGoogleCallbackUrl(),
      grant_type: 'authorization_code',
    }),
  });
  const data = (await res.json()) as GoogleTokenResponse;
  if (!res.ok || !data.access_token) {
    throw AppError.badGateway(data.error_description ?? data.error ?? 'Không xác thực được với Google.');
  }
  return data.access_token;
}

async function fetchGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  const res = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw AppError.badGateway('Không lấy được thông tin tài khoản Google.');
  }
  return (await res.json()) as GoogleUserInfo;
}

export async function authenticateWithGoogle(code: string): Promise<PublicUser> {
  const accessToken = await exchangeGoogleCode(code);
  const profile = await fetchGoogleUserInfo(accessToken);

  if (!profile.email || !profile.sub || !profile.email_verified) {
    throw AppError.badRequest('Tài khoản Google chưa xác thực email.');
  }

  const email = profile.email.toLowerCase();
  const existingByGoogleId = await prisma.user.findUnique({ where: { googleId: profile.sub } });
  if (existingByGoogleId) return toPublicUser(existingByGoogleId);

  const existingByEmail = await prisma.user.findUnique({ where: { email } });
  if (existingByEmail) {
    const updated = await prisma.user.update({
      where: { id: existingByEmail.id },
      data: { googleId: profile.sub },
    });
    return toPublicUser(updated);
  }

  const passwordHash = await hashPassword(randomBytes(32).toString('hex'));
  const user = await prisma.user.create({
    data: {
      email,
      googleId: profile.sub,
      displayName: profile.name?.trim() || email.split('@')[0],
      passwordHash,
    },
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
