import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError.js';
import { AUTH_COOKIE, verifyToken } from '../utils/jwt.js';

// Đọc token từ cookie (nếu có) và gắn req.user. Không ném lỗi nếu thiếu token.
export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies?.[AUTH_COOKIE];
  if (token) {
    try {
      req.user = verifyToken(token);
    } catch {
      // Token hỏng/hết hạn -> coi như khách.
      req.user = undefined;
    }
  }
  next();
}

// Bắt buộc đăng nhập. Trả 401 nếu không có/không hợp lệ token.
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies?.[AUTH_COOKIE];
  if (!token) {
    throw AppError.unauthorized();
  }
  try {
    req.user = verifyToken(token);
    next();
  } catch {
    throw AppError.unauthorized('Phiên đăng nhập không hợp lệ hoặc đã hết hạn.');
  }
}

// Bắt buộc có vai trò cụ thể (ví dụ ADMIN). Dùng sau requireAuth.
export function requireRole(role: 'ADMIN' | 'LEARNER') {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw AppError.unauthorized();
    }
    if (req.user.role !== role) {
      throw AppError.forbidden();
    }
    next();
  };
}
