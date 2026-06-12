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
  verifyUrl: string;
  expiresInMinutes: number;
}) {
  const safeName = escapeHtml(params.displayName);
  const safeVerifyUrl = escapeHtml(params.verifyUrl);

  return {
    subject: 'Xác thực tài khoản CodeLearn',
    text: `Xin chào ${params.displayName}, bấm link sau để xác thực tài khoản CodeLearn: ${params.verifyUrl}. Link hết hạn sau ${params.expiresInMinutes} phút.`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
        <p>Xin chào ${safeName},</p>
        <p>Bấm nút bên dưới để xác thực tài khoản CodeLearn của bạn:</p>
        <p style="margin:24px 0">
          <a href="${safeVerifyUrl}" style="display:inline-block;background:#059669;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:700">
            Xác thực tài khoản
          </a>
        </p>
        <p>Nếu nút không hoạt động, hãy mở link này:</p>
        <p><a href="${safeVerifyUrl}">${safeVerifyUrl}</a></p>
        <p>Link sẽ hết hạn sau ${params.expiresInMinutes} phút. Nếu bạn không đăng ký tài khoản, vui lòng bỏ qua email này.</p>
      </div>
    `,
  };
}

function extractResendErrorMessage(body: string) {
  try {
    const parsed = JSON.parse(body) as { message?: string; error?: string };
    return parsed.message ?? parsed.error ?? body;
  } catch {
    return body;
  }
}

async function sendViaResend(params: {
  to: string;
  displayName: string;
  verifyUrl: string;
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
    const message = extractResendErrorMessage(body);
    console.error('[email] Resend API trả lỗi:', res.status, body);
    if (res.status === 403 && message.includes('You can only send testing emails')) {
      throw AppError.badGateway(
        'Resend đang dùng domain test nên chỉ gửi được tới email của tài khoản Resend. Hãy verify domain trong Resend hoặc thử bằng đúng email tài khoản Resend.',
      );
    }
    throw AppError.badGateway(`Không gửi được email xác thực qua Resend: ${message}`);
  }
}

async function sendViaSmtp(params: {
  to: string;
  displayName: string;
  verifyUrl: string;
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

export async function sendRegistrationVerificationEmail(params: {
  to: string;
  displayName: string;
  verifyUrl: string;
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

  console.info(`[email-dev] Link xác thực cho ${params.to}: ${params.verifyUrl}`);
}
