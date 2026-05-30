import { createApp } from './app.js';
import { env } from './config/env.js';

const app = createApp();

const server = app.listen(env.port, () => {
  console.log(`[server] đang chạy tại http://localhost:${env.port} (môi trường: ${env.nodeEnv})`);
  console.log(`[server] health-check: http://localhost:${env.port}/api/health`);
});

// Tắt server an toàn khi nhận tín hiệu dừng.
function shutdown(signal: string) {
  console.log(`[server] nhận tín hiệu ${signal}, đang đóng...`);
  server.close(() => {
    console.log('[server] đã đóng.');
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
