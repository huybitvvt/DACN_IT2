import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { AppError } from '../../utils/AppError.js';
import { AUTH_COOKIE, authCookieOptions, signToken } from '../../utils/jwt.js';
import { loginSchema, registerSchema, verifyRegistrationSchema } from './auth.schema.js';
import {
  authenticate,
  getUserById,
  requestRegistrationCode,
  toPublicUser,
  verifyRegistrationCode,
} from './auth.service.js';

// POST /api/auth/register
export const register = asyncHandler(async (req: Request, res: Response) => {
  const input = registerSchema.parse(req.body);
  const result = await requestRegistrationCode(input);

  res.status(202).json({
    message: 'Mã xác thực đã được gửi đến email của bạn.',
    expiresInMinutes: result.expiresInMinutes,
  });
});

// POST /api/auth/register/verify
export const verifyRegister = asyncHandler(async (req: Request, res: Response) => {
  const input = verifyRegistrationSchema.parse(req.body);
  const user = await verifyRegistrationCode(input);

  // Xác thực xong tự đăng nhập luôn cho tiện.
  const token = signToken({ sub: user.id, role: user.role });
  res.cookie(AUTH_COOKIE, token, authCookieOptions());

  res.status(201).json({ user });
});

// POST /api/auth/login
export const login = asyncHandler(async (req: Request, res: Response) => {
  const input = loginSchema.parse(req.body);
  const user = await authenticate(input);

  const token = signToken({ sub: user.id, role: user.role });
  res.cookie(AUTH_COOKIE, token, authCookieOptions());

  res.json({ user: toPublicUser(user) });
});

// POST /api/auth/logout
export const logout = asyncHandler(async (_req: Request, res: Response) => {
  res.clearCookie(AUTH_COOKIE, { ...authCookieOptions(), maxAge: undefined });
  res.json({ success: true });
});

// GET /api/auth/me
export const me = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw AppError.unauthorized();
  }
  const user = await getUserById(req.user.sub);
  if (!user) {
    throw AppError.unauthorized();
  }
  res.json({ user });
});
