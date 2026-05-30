import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/AppError.js';
import { env } from '../config/env.js';

// Middleware xử lý lỗi tập trung. Chuẩn hoá mọi lỗi về cấu trúc chung:
// { error: { code, message, details? } }
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
) {
  // Lỗi validation từ Zod -> 400 với chi tiết các trường.
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Dữ liệu gửi lên không hợp lệ.',
        details: err.issues.map((i) => ({
          path: i.path.join('.'),
          message: i.message,
        })),
      },
    });
  }

  // Lỗi ứng dụng đã biết.
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err.details ? { details: err.details } : {}),
      },
    });
  }

  // Lỗi không lường trước -> 500, ghi log, không lộ chi tiết nhạy cảm.
  console.error('[unhandled error]', err);
  return res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Đã xảy ra lỗi máy chủ. Vui lòng thử lại sau.',
      ...(env.isProduction ? {} : { details: String(err) }),
    },
  });
}

// Middleware cho route không tồn tại.
export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({
    error: { code: 'NOT_FOUND', message: 'Không tìm thấy đường dẫn yêu cầu.' },
  });
}
