import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Nạp biến môi trường từ file .env ở thư mục gốc dự án.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === '') {
    throw new Error(`Thiếu biến môi trường bắt buộc: ${name}`);
  }
  return value;
}

function optional(name: string, fallback = ''): string {
  return process.env[name] ?? fallback;
}

export const env = {
  nodeEnv: optional('NODE_ENV', 'development'),
  port: Number(optional('PORT', '4000')),
  clientOrigin: optional('CLIENT_ORIGIN', 'http://localhost:5173'),

  databaseUrl: required('DATABASE_URL'),

  jwtSecret: required('JWT_SECRET', 'dev-only-insecure-secret-change-me'),
  jwtExpiresIn: optional('JWT_EXPIRES_IN', '7d'),

  groqApiKey: optional('GROQ_API_KEY'),
  groqModel: optional('GROQ_MODEL', 'llama-3.3-70b-versatile'),
  enableSemanticRag: optional('ENABLE_SEMANTIC_RAG', 'false') === 'true',

  // Đặt 'true' nếu deploy frontend và backend ở 2 domain khác nhau
  // (cookie cần SameSite=None; Secure để gửi cross-site).
  crossSiteCookie: optional('CROSS_SITE_COOKIE', 'false') === 'true',

  // Trình chạy code C/C++ qua Wandbox (miễn phí, không cần key).
  wandboxUrl: optional('WANDBOX_URL', 'https://wandbox.org'),

  get isProduction() {
    return this.nodeEnv === 'production';
  },
} as const;
