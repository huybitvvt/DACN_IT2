import { describe, it, expect, vi } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { requireAuth, requireRole, optionalAuth } from './auth.js';
import { signToken, AUTH_COOKIE } from '../utils/jwt.js';
import { AppError } from '../utils/AppError.js';

function mockReqRes(cookies: Record<string, string> = {}, user?: never) {
  const req = { cookies, user } as unknown as Request;
  const res = {} as Response;
  const next = vi.fn() as unknown as NextFunction;
  return { req, res, next };
}

describe('auth middleware', () => {
  describe('requireAuth', () => {
    it('ném 401 khi không có token', () => {
      const { req, res, next } = mockReqRes();
      expect(() => requireAuth(req, res, next)).toThrow(AppError);
    });

    it('gắn req.user và gọi next với token hợp lệ', () => {
      const token = signToken({ sub: 'u1', role: 'LEARNER' });
      const { req, res, next } = mockReqRes({ [AUTH_COOKIE]: token });
      requireAuth(req, res, next);
      expect(req.user?.sub).toBe('u1');
      expect(next).toHaveBeenCalled();
    });
  });

  describe('requireRole', () => {
    it('cho phép đúng vai trò', () => {
      const { req, res, next } = mockReqRes();
      req.user = { sub: 'u1', role: 'ADMIN' };
      requireRole('ADMIN')(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('ném 403 khi sai vai trò (Property 4)', () => {
      const { req, res, next } = mockReqRes();
      req.user = { sub: 'u1', role: 'LEARNER' };
      expect(() => requireRole('ADMIN')(req, res, next)).toThrow(AppError);
    });

    it('ném 401 khi chưa đăng nhập', () => {
      const { req, res, next } = mockReqRes();
      expect(() => requireRole('ADMIN')(req, res, next)).toThrow(AppError);
    });
  });

  describe('optionalAuth', () => {
    it('coi là khách khi token hỏng', () => {
      const { req, res, next } = mockReqRes({ [AUTH_COOKIE]: 'token-hong' });
      optionalAuth(req, res, next);
      expect(req.user).toBeUndefined();
      expect(next).toHaveBeenCalled();
    });
  });
});
