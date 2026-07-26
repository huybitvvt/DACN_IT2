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
  publicApiUrl: optional('PUBLIC_API_URL'),

  databaseUrl: required('DATABASE_URL'),

  jwtSecret: required('JWT_SECRET', 'dev-only-insecure-secret-change-me'),
  jwtExpiresIn: optional('JWT_EXPIRES_IN', '7d'),

  localLlmBaseUrl: optional('LOCAL_LLM_BASE_URL', 'http://localhost:8080/v1'),
  localLlmApiKey: optional('LOCAL_LLM_API_KEY'),
  localLlmModel: optional('LOCAL_LLM_MODEL', 'local-llama'),
  enableSemanticRag: optional('ENABLE_SEMANTIC_RAG', 'false') === 'true',

  // Đặt 'true' nếu deploy frontend và backend ở 2 domain khác nhau
  // (cookie cần SameSite=None; Secure để gửi cross-site).
  crossSiteCookie: optional('CROSS_SITE_COOKIE', 'false') === 'true',

  // Trình chạy code C/C++ qua Judge0 CE tự host local.
  judge0Url: optional('JUDGE0_URL', 'http://localhost:2358'),

  smtpHost: optional('SMTP_HOST'),
  smtpPort: Number(optional('SMTP_PORT', '465')),
  smtpSecure: optional('SMTP_SECURE', 'true') === 'true',
  smtpUser: optional('SMTP_USER'),
  smtpPass: optional('SMTP_PASS'),
  smtpFrom: optional('SMTP_FROM', optional('SMTP_USER')),

  emailjsServiceId: optional('EMAILJS_SERVICE_ID'),
  emailjsTemplateVerifyId: optional('EMAILJS_TEMPLATE_VERIFY_ID'),
  emailjsTemplateResetId: optional('EMAILJS_TEMPLATE_RESET_ID'),
  emailjsTemplateNotificationId: optional('EMAILJS_TEMPLATE_NOTIFICATION_ID'),
  emailjsPublicKey: optional('EMAILJS_PUBLIC_KEY'),
  emailjsPrivateKey: optional('EMAILJS_PRIVATE_KEY'),

  googleClientId: optional('GOOGLE_CLIENT_ID'),
  googleClientSecret: optional('GOOGLE_CLIENT_SECRET'),
  googleCallbackUrl: optional('GOOGLE_CALLBACK_URL'),

  vietqrBankId: optional('VIETQR_BANK_ID'),
  vietqrAccountNo: optional('VIETQR_ACCOUNT_NO'),
  vietqrAccountName: optional('VIETQR_ACCOUNT_NAME'),
  vietqrTemplate: optional('VIETQR_TEMPLATE', 'compact2'),
  sepayWebhookApiKey: optional('SEPAY_WEBHOOK_API_KEY'),
  sepayPgMerchantId: optional('SEPAY_PG_MERCHANT_ID'),
  sepayPgSecretKey: optional('SEPAY_PG_SECRET_KEY'),
  sepayPgEnv: optional('SEPAY_PG_ENV', 'sandbox'),
  paymentDemoEnabled:
    optional('PAYMENT_DEMO_ENABLED', 'false') === 'true' &&
    optional('NODE_ENV', 'development') !== 'production',

  get isProduction() {
    return this.nodeEnv === 'production';
  },
} as const;
