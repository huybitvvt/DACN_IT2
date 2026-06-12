import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

function isSmtpConfigured() {
  return Boolean(env.smtpHost && env.smtpUser && env.smtpPass && env.smtpFrom);
}

function isResendConfigured() {
  return Boolean(env.resendApiKey && env.resendFrom);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function buildRegistrationEmail(params: {
  displayName: string;
  code: string;
  expiresInMinutes: number;
}) {
  const safeName = escapeHtml(params.displayName);
  const safeCode = escapeHtml(params.code);

  return {
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
  };
}

async function sendViaResend(params: {
  to: string;
  displayName: string;
  code: string;
  expiresInMinutes: number;
}) {
  const message = buildRegistrationEmail(params);
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.resendFrom,
      to: [params.to],
      subject: message.subject,
      text: message.text,
      html: message.html,
    }),
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error('[email] Resend API trả lỗi:', res.status, body);
    throw AppError.badGateway('Không gửi được email xác thực qua Resend.');
  }
}

async function sendViaSmtp(params: {
  to: string;
  displayName: string;
  code: string;
  expiresInMinutes: number;
}) {
  const transporter = nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpSecure,
    auth: {
      user: env.smtpUser,
      pass: env.smtpPass,
    },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  });

  const message = buildRegistrationEmail(params);

  try {
    await transporter.sendMail({
      from: env.smtpFrom,
      to: params.to,
      subject: message.subject,
      text: message.text,
      html: message.html,
    });
  } catch (err) {
    console.error('[email] Không gửi được mã xác thực qua SMTP:', err);
    throw AppError.badGateway(
      'Không gửi được email xác thực. Vui lòng kiểm tra cấu hình dịch vụ gửi email.',
    );
  } finally {
    transporter.close();
  }
}

export async function sendRegistrationCodeEmail(params: {
  to: string;
  displayName: string;
  code: string;
  expiresInMinutes: number;
}) {
  if (isResendConfigured()) {
    try {
      await sendViaResend(params);
      return;
    } catch (err) {
      if (err instanceof AppError) throw err;
      console.error('[email] Không gửi được mã xác thực qua Resend:', err);
      throw AppError.badGateway('Không gửi được email xác thực qua Resend.');
    }
  }

  if (isSmtpConfigured()) {
    await sendViaSmtp(params);
    return;
  }

  if (env.isProduction) {
    throw AppError.internal('Chưa cấu hình dịch vụ gửi email xác thực.');
  }

  console.info(`[email-dev] Mã xác thực cho ${params.to}: ${params.code}`);
}
