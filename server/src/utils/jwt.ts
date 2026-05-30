import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export interface JwtPayload {
  sub: string; // user id
  role: 'LEARNER' | 'ADMIN';
}

// Ký JWT chứa id và vai trò người dùng.
export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn as jwt.SignOptions['expiresIn'],
  });
}

// Xác thực và giải mã JWT. Ném lỗi nếu token không hợp lệ/hết hạn.
export function verifyToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, env.jwtSecret);
  if (typeof decoded === 'string') {
    throw new Error('Token không hợp lệ.');
  }
  return decoded as JwtPayload;
}

// Tên cookie chứa access token.
export const AUTH_COOKIE = 'lpp_token';

// Tuỳ chọn cookie thống nhất cho set/clear.
export function authCookieOptions() {
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  // Khi deploy tách domain: SameSite=None + Secure để cookie gửi cross-site.
  // Khi cùng domain (hoặc dev): SameSite=Lax.
  const crossSite = env.crossSiteCookie;
  return {
    httpOnly: true,
    secure: env.isProduction || crossSite,
    sameSite: (crossSite ? 'none' : 'lax') as 'none' | 'lax',
    maxAge: sevenDaysMs,
    path: '/',
  };
}
