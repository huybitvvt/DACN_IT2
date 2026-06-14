import type { Request, Response } from 'express';
import { randomBytes } from 'node:crypto';
import { env } from '../../config/env.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { AppError } from '../../utils/AppError.js';
import { AUTH_COOKIE, authCookieOptions, signToken } from '../../utils/jwt.js';
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  verifyRegistrationSchema,
} from './auth.schema.js';
import {
  authenticate,
  authenticateWithGoogle,
  createGoogleAuthUrl,
  getUserById,
  requestPasswordReset,
  requestRegistrationCode,
  resetPassword,
  toPublicUser,
  verifyRegistrationCode,
} from './auth.service.js';

const GOOGLE_STATE_COOKIE = 'lpp_google_oauth_state';

function setAuthCookie(res: Response, user: { id: string; role: 'LEARNER' | 'ADMIN' }) {
  const token = signToken({ sub: user.id, role: user.role });
  res.cookie(AUTH_COOKIE, token, authCookieOptions());
}

// POST /api/auth/register
export const register = asyncHandler(async (req: Request, res: Response) => {
  const input = registerSchema.parse(req.body);
  const result = await requestRegistrationCode(input);

  res.status(202).json({
    message: 'Link xác thực đã được gửi đến email của bạn.',
    expiresInMinutes: result.expiresInMinutes,
  });
});

// POST /api/auth/register/verify
export const verifyRegister = asyncHandler(async (req: Request, res: Response) => {
  const input = verifyRegistrationSchema.parse(req.body);
  const user = await verifyRegistrationCode(input);

  // Xác thực xong tự đăng nhập luôn cho tiện.
  setAuthCookie(res, user);

  res.status(201).json({ user });
});

// GET /api/auth/register/verify-link
export const verifyRegisterLink = asyncHandler(async (req: Request, res: Response) => {
  const input = verifyRegistrationSchema.parse(req.query);
  const user = await verifyRegistrationCode(input);

  setAuthCookie(res, user);

  const redirectUrl = new URL('/', env.clientOrigin);
  redirectUrl.searchParams.set('verified', '1');
  res.redirect(302, redirectUrl.toString());
});

// POST /api/auth/forgot-password
export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const input = forgotPasswordSchema.parse(req.body);
  await requestPasswordReset(input);
  res.json({
    message: 'Nếu email tồn tại, link đặt lại mật khẩu đã được gửi đến hộp thư của bạn.',
  });
});

// POST /api/auth/reset-password
export const resetPasswordController = asyncHandler(async (req: Request, res: Response) => {
  const input = resetPasswordSchema.parse(req.body);
  await resetPassword(input);
  res.json({ success: true });
});

// GET /api/auth/google
export const googleLogin = asyncHandler(async (_req: Request, res: Response) => {
  const state = randomBytes(24).toString('base64url');
  res.cookie(GOOGLE_STATE_COOKIE, state, {
    ...authCookieOptions(),
    httpOnly: true,
    maxAge: 10 * 60 * 1000,
  });
  res.redirect(302, createGoogleAuthUrl(state));
});

// GET /api/auth/google/callback
export const googleCallback = asyncHandler(async (req: Request, res: Response) => {
  const code = typeof req.query.code === 'string' ? req.query.code : '';
  const state = typeof req.query.state === 'string' ? req.query.state : '';
  const expectedState = req.cookies?.[GOOGLE_STATE_COOKIE];

  res.clearCookie(GOOGLE_STATE_COOKIE, { ...authCookieOptions(), maxAge: undefined });

  if (!code || !state || !expectedState || state !== expectedState) {
    throw AppError.badRequest('Phiên đăng nhập Google không hợp lệ.');
  }

  const user = await authenticateWithGoogle(code);
  setAuthCookie(res, user);

  const redirectUrl = new URL('/', env.clientOrigin);
  redirectUrl.searchParams.set('google', '1');
  res.redirect(302, redirectUrl.toString());
});

// POST /api/auth/login
export const login = asyncHandler(async (req: Request, res: Response) => {
  const input = loginSchema.parse(req.body);
  const user = await authenticate(input);

  setAuthCookie(res, user);

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
