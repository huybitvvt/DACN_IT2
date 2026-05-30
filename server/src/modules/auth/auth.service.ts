import type { User } from '@prisma/client';
import { prisma } from '../../db/prisma.js';
import { AppError } from '../../utils/AppError.js';
import { hashPassword, verifyPassword } from '../../utils/password.js';
import type { LoginInput, RegisterInput } from './auth.schema.js';

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
