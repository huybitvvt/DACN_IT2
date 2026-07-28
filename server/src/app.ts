import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import { env } from './config/env.js';
import { generalLimiter } from './middleware/rateLimit.js';
import { optionalAuth } from './middleware/auth.js';
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

  // Gắn user trước rate limit để nhiều học viên chung NAT trường học không dùng
  // chung một quota IP.
  app.use(optionalAuth);

  // Rate limit chung cho mọi route /api.
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

  // ===== Phục vụ frontend đã build (deploy 1 service, cùng domain) =====
  // Khi build client, output nằm ở client/dist. Nếu thư mục tồn tại thì phục vụ
  // file tĩnh + trả index.html cho mọi route không phải /api (SPA fallback).
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const clientDist = path.resolve(__dirname, '../../client/dist');
  if (fs.existsSync(clientDist)) {
    app.use(
      express.static(clientDist, {
        setHeaders(res, filePath) {
          if (filePath.endsWith('index.html')) {
            res.setHeader('Cache-Control', 'no-store');
            return;
          }
          if (filePath.includes(`${path.sep}assets${path.sep}`)) {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          }
        },
      }),
    );
    app.get(/^(?!\/api).*/, (_req, res) => {
      res.setHeader('Cache-Control', 'no-store');
      res.sendFile(path.join(clientDist, 'index.html'));
    });
  }

  // 404 cho route không khớp + xử lý lỗi tập trung (đặt cuối cùng).
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
