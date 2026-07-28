import rateLimit from 'express-rate-limit';
import type { Request } from 'express';

function learnerAwareKey(req: Request) {
  return req.user?.sub ? `user:${req.user.sub}` : `ip:${req.ip}`;
}

// Giới hạn chung cho toàn bộ API: tránh lạm dụng cơ bản.
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: learnerAwareKey,
  message: {
    error: { code: 'TOO_MANY_REQUESTS', message: 'Quá nhiều yêu cầu, vui lòng thử lại sau.' },
  },
});

// Giới hạn chặt cho các route tốn tài nguyên (chạy code, chấm bài, AI).
export const heavyLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 phút
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: learnerAwareKey,
  message: {
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Bạn đang thao tác quá nhanh. Vui lòng chờ một chút rồi thử lại.',
    },
  },
});

// Giới hạn cho các route xác thực để giảm dò mật khẩu.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: learnerAwareKey,
  message: {
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Quá nhiều lần thử. Vui lòng thử lại sau ít phút.',
    },
  },
});
