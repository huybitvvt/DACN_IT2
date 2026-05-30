import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { generalLimiter } from './middleware/rateLimit.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import apiRouter from './routes/index.js';

// Tạo và cấu hình ứng dụng Express. Tách khỏi index.ts để dễ viết test.
export function createApp() {
  const app = express();

  // Tin tưởng proxy (cần khi deploy sau reverse proxy) để rate limit theo IP đúng.
  app.set('trust proxy', 1);

  // Header bảo mật (CSP tắt vì API thuần JSON, frontend phục vụ riêng).
  app.use(helmet({ contentSecurityPolicy: false }));

  // CORS: chỉ cho phép frontend đã cấu hình, kèm cookie.
  app.use(
    cors({
      origin: env.clientOrigin,
      credentials: true,
    }),
  );

  // Parser
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // Rate limit chung cho mọi route /api
  app.use('/api', generalLimiter);

  // Logger gọn nhẹ cho môi trường dev.
  if (!env.isProduction) {
    app.use((req, _res, next) => {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
      next();
    });
  }

  // Gắn router API
  app.use('/api', apiRouter);

  // 404 cho route không khớp + xử lý lỗi tập trung (đặt cuối cùng).
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
