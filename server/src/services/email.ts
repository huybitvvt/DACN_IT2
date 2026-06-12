import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

function isSmtpConfigured() {
  return Boolean(env.smtpHost && env.smtpUser && env.smtpPass && env.smtpFrom);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export async function sendRegistrationCodeEmail(params: {
  to: string;
  displayName: string;
  code: string;
  expiresInMinutes: number;
}) {
  if (!isSmtpConfigured()) {
    if (env.isProduction) {
      throw AppError.internal('Chưa cấu hình SMTP để gửi email xác thực.');
    }
    console.info(`[email-dev] Mã xác thực cho ${params.to}: ${params.code}`);
    return;
  }

  const transporter = nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpSecure,
    auth: {
      user: env.smtpUser,
      pass: env.smtpPass,
    },
  });

  const safeName = escapeHtml(params.displayName);
  const safeCode = escapeHtml(params.code);

  await transporter.sendMail({
    from: env.smtpFrom,
    to: params.to,
    subject: 'Mã xác thực đăng ký CodeLearn',
    text: `Xin chào ${params.displayName}, mã xác thực đăng ký CodeLearn của bạn là ${params.code}. Mã hết hạn sau ${params.expiresInMinutes} phút.`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
        <p>Xin chào ${safeName},</p>
        <p>Mã xác thực đăng ký CodeLearn của bạn là:</p>
        <p style="font-size:28px;font-weight:700;letter-spacing:6px;margin:16px 0">${safeCode}</p>
        <p>Mã sẽ hết hạn sau ${params.expiresInMinutes} phút. Nếu bạn không đăng ký tài khoản, vui lòng bỏ qua email này.</p>
      </div>
    `,
  });
}
