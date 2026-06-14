import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

function isSmtpConfigured() {
  return Boolean(env.smtpHost && env.smtpUser && env.smtpPass && env.smtpFrom);
}

function isEmailJsConfigured(templateId: string) {
  return Boolean(env.emailjsServiceId && templateId && env.emailjsPublicKey);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function buildButtonEmail(params: {
  displayName: string;
  actionUrl: string;
  subject: string;
  intro: string;
  buttonText: string;
  fallbackText: string;
  expiresInMinutes: number;
}) {
  const safeName = escapeHtml(params.displayName);
  const safeActionUrl = escapeHtml(params.actionUrl);
  const safeIntro = escapeHtml(params.intro);
  const safeButtonText = escapeHtml(params.buttonText);
  const safeFallbackText = escapeHtml(params.fallbackText);

  return {
    subject: params.subject,
    text: `Xin chào ${params.displayName}, ${params.intro}: ${params.actionUrl}. Link hết hạn sau ${params.expiresInMinutes} phút.`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
        <p>Xin chào ${safeName},</p>
        <p>${safeIntro}</p>
        <p style="margin:24px 0">
          <a href="${safeActionUrl}" style="display:inline-block;background:#059669;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:700">
            ${safeButtonText}
          </a>
        </p>
        <p>${safeFallbackText}</p>
        <p><a href="${safeActionUrl}">${safeActionUrl}</a></p>
        <p>Link sẽ hết hạn sau ${params.expiresInMinutes} phút. Nếu bạn không đăng ký tài khoản, vui lòng bỏ qua email này.</p>
      </div>
    `,
  };
}

async function sendViaEmailJs(params: {
  to: string;
  displayName: string;
  templateId: string;
  templateParams: Record<string, string | number>;
}) {
  const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      service_id: env.emailjsServiceId,
      template_id: params.templateId,
      user_id: env.emailjsPublicKey,
      accessToken: env.emailjsPrivateKey || undefined,
      template_params: {
        to_email: params.to,
        to_name: params.displayName,
        ...params.templateParams,
      },
    }),
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    console.error('[email] Không gửi được email qua EmailJS:', response.status, detail);
    throw AppError.badGateway('Không gửi được email qua EmailJS. Vui lòng kiểm tra cấu hình EmailJS.');
  }
}

async function sendViaSmtp(params: {
  to: string;
  displayName: string;
  actionUrl: string;
  subject: string;
  intro: string;
  buttonText: string;
  fallbackText: string;
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

  const message = buildButtonEmail(params);

  try {
    await transporter.sendMail({
      from: env.smtpFrom,
      to: params.to,
      subject: message.subject,
      text: message.text,
      html: message.html,
    });
  } catch (err) {
    console.error('[email] Không gửi được link xác thực qua SMTP:', err);
    throw AppError.badGateway(
      'Không gửi được email xác thực. Vui lòng kiểm tra cấu hình Gmail SMTP/App Password.',
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
  if (isEmailJsConfigured(env.emailjsTemplateVerifyId)) {
    await sendViaEmailJs({
      to: params.to,
      displayName: params.displayName,
      templateId: env.emailjsTemplateVerifyId,
      templateParams: {
        verify_url: params.verifyUrl,
        expires_in_minutes: params.expiresInMinutes,
      },
    });
    return;
  }

  if (isSmtpConfigured()) {
    await sendViaSmtp({
      to: params.to,
      displayName: params.displayName,
      actionUrl: params.verifyUrl,
      subject: 'Xác thực tài khoản CodeLearn',
      intro: 'Bấm nút bên dưới để xác thực tài khoản CodeLearn của bạn',
      buttonText: 'Xác thực tài khoản',
      fallbackText: 'Nếu nút không hoạt động, hãy mở link này:',
      expiresInMinutes: params.expiresInMinutes,
    });
    return;
  }

  if (env.isProduction) {
    throw AppError.internal('Chưa cấu hình EmailJS hoặc SMTP để gửi email xác thực.');
  }

  console.info(`[email-dev] Link xác thực cho ${params.to}: ${params.verifyUrl}`);
}

export async function sendPasswordResetEmail(params: {
  to: string;
  displayName: string;
  resetUrl: string;
  expiresInMinutes: number;
}) {
  if (isEmailJsConfigured(env.emailjsTemplateResetId)) {
    await sendViaEmailJs({
      to: params.to,
      displayName: params.displayName,
      templateId: env.emailjsTemplateResetId,
      templateParams: {
        reset_url: params.resetUrl,
        expires_in_minutes: params.expiresInMinutes,
      },
    });
    return;
  }

  if (isSmtpConfigured()) {
    await sendViaSmtp({
      to: params.to,
      displayName: params.displayName,
      actionUrl: params.resetUrl,
      subject: 'Đặt lại mật khẩu CodeLearn',
      intro: 'Bấm nút bên dưới để đặt lại mật khẩu CodeLearn của bạn',
      buttonText: 'Đặt lại mật khẩu',
      fallbackText: 'Nếu nút không hoạt động, hãy mở link này:',
      expiresInMinutes: params.expiresInMinutes,
    });
    return;
  }

  if (env.isProduction) {
    throw AppError.internal('Chưa cấu hình EmailJS hoặc SMTP để gửi email đặt lại mật khẩu.');
  }

  console.info(`[email-dev] Link đặt lại mật khẩu cho ${params.to}: ${params.resetUrl}`);
}
