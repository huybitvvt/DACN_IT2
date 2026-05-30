import type { Request, Response, NextFunction, RequestHandler } from 'express';

// Bọc handler async để mọi lỗi (kể cả Promise reject) được chuyển tới
// middleware xử lý lỗi tập trung, tránh phải try/catch lặp lại.
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
