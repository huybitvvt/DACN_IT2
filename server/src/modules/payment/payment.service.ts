import { randomBytes } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { env } from '../../config/env.js';
import { prisma } from '../../db/prisma.js';
import { AppError } from '../../utils/AppError.js';
import { createNotification } from '../notification/notification.service.js';

const PENDING_CHECKOUT_EXPIRES_MINUTES = 30;

function createPaymentCode() {
  return `CL${randomBytes(5).toString('hex').toUpperCase()}`;
}

function getPendingCheckoutExpiresAt(updatedAt: Date) {
  return new Date(updatedAt.getTime() + PENDING_CHECKOUT_EXPIRES_MINUTES * 60 * 1000);
}

function isPendingCheckoutExpired(updatedAt: Date) {
  return getPendingCheckoutExpiresAt(updatedAt).getTime() < Date.now();
}

function toCheckoutPurchase(purchase: {
  id: string;
  status: 'PENDING' | 'PAID';
  amountVnd: number;
  paymentCode: string;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    ...purchase,
    pendingExpiresAt:
      purchase.status === 'PENDING' ? getPendingCheckoutExpiresAt(purchase.updatedAt).toISOString() : null,
    isExpired: purchase.status === 'PENDING' && isPendingCheckoutExpired(purchase.updatedAt),
  };
}

function createVietQrUrl(params: { amountVnd: number; paymentCode: string }) {
  if (!env.vietqrBankId || !env.vietqrAccountNo || !env.vietqrAccountName) {
    throw AppError.internal('Chưa cấu hình tài khoản VietQR.');
  }

  const base = `https://img.vietqr.io/image/${env.vietqrBankId}-${env.vietqrAccountNo}-${env.vietqrTemplate}.png`;
  const url = new URL(base);
  url.searchParams.set('amount', String(params.amountVnd));
  url.searchParams.set('addInfo', params.paymentCode);
  url.searchParams.set('accountName', env.vietqrAccountName);
  return url.toString();
}

function extractPaymentCode(payload: SepayWebhookPayload) {
  const directCode = payload.code?.trim();
  if (directCode) return directCode.toUpperCase();

  const rawText = `${payload.content ?? ''} ${payload.description ?? ''}`;
  const match = rawText.match(/\bCL[A-Z0-9]{6,}\b/i);
  return match?.[0].toUpperCase() ?? null;
}

function isDuplicateWebhookError(error: unknown) {
  return error instanceof PrismaClientKnownRequestError && error.code === 'P2002';
}

export type SepayWebhookPayload = {
  id: number;
  transferType: string;
  transferAmount: number;
  code?: string | null;
  content?: string | null;
  description?: string | null;
};

export type SepayPaymentGatewayIpnPayload = {
  timestamp: number;
  notification_type: string;
  order: {
    order_status: string;
    order_amount: string;
    order_invoice_number: string;
  };
  transaction: {
    id?: string | null;
    transaction_id: string;
    transaction_status: string;
    transaction_amount: string;
  };
};

export async function createCourseCheckout(userId: string, slug: string) {
  const course = await prisma.course.findUnique({
    where: { slug },
    select: { id: true, slug: true, title: true, priceVnd: true },
  });
  if (!course) throw AppError.notFound('Không tìm thấy khoá học.');

  const existing = await prisma.coursePurchase.findUnique({
    where: { userId_courseId: { userId, courseId: course.id } },
  });

  const purchase =
    existing && existing.status === 'PENDING' && isPendingCheckoutExpired(existing.updatedAt)
      ? await prisma.coursePurchase.update({
          where: { id: existing.id },
          data: {
            amountVnd: course.priceVnd,
            paymentCode: createPaymentCode(),
          },
        })
      : existing && existing.status === 'PENDING' && existing.amountVnd !== course.priceVnd
      ? await prisma.coursePurchase.update({
          where: { id: existing.id },
          data: { amountVnd: course.priceVnd },
        })
      : existing ??
        (await prisma.coursePurchase.create({
          data: {
            userId,
            courseId: course.id,
            amountVnd: course.priceVnd,
            paymentCode: createPaymentCode(),
          },
        }));

  return {
    course,
    purchase: toCheckoutPurchase(purchase),
    demoPaymentEnabled: env.paymentDemoEnabled,
    qrUrl: createVietQrUrl({
      amountVnd: purchase.amountVnd,
      paymentCode: purchase.paymentCode,
    }),
    bank: {
      bankId: env.vietqrBankId,
      accountNo: env.vietqrAccountNo,
      accountName: env.vietqrAccountName,
    },
  };
}

export async function confirmDemoPayment(userId: string, slug: string) {
  if (!env.paymentDemoEnabled) {
    throw AppError.notFound('Chế độ thanh toán demo không được bật.');
  }
  const course = await prisma.course.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (!course) throw AppError.notFound('Không tìm thấy khoá học.');
  const purchase = await prisma.coursePurchase.findUnique({
    where: { userId_courseId: { userId, courseId: course.id } },
  });
  if (!purchase) throw AppError.badRequest('Bạn cần tạo mã thanh toán trước.');

  const updated =
    purchase.status === 'PAID'
      ? purchase
      : await prisma.coursePurchase.update({
          where: { id: purchase.id },
          data: { status: 'PAID', paidAt: new Date() },
        });
  await notifyPaidPurchase(updated.paymentCode);
  return toCheckoutPurchase(updated);
}

export async function getCourseCheckoutStatus(userId: string, slug: string) {
  const course = await prisma.course.findUnique({ where: { slug }, select: { id: true } });
  if (!course) throw AppError.notFound('Không tìm thấy khoá học.');

  const purchase = await prisma.coursePurchase.findUnique({
    where: { userId_courseId: { userId, courseId: course.id } },
  });
  if (!purchase) throw AppError.badRequest('Bạn cần tạo mã thanh toán trước.');

  return { purchase: toCheckoutPurchase(purchase) };
}

export async function listUserPurchases(userId: string) {
  const purchases = await prisma.coursePurchase.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    include: {
      course: {
        select: {
          id: true,
          slug: true,
          title: true,
          language: true,
          priceVnd: true,
        },
      },
    },
  });

  return purchases.map((purchase) => ({
    ...toCheckoutPurchase(purchase),
    course: purchase.course,
  }));
}

function parseVndAmount(value: string) {
  const amount = Number(value);
  return Number.isFinite(amount) ? Math.floor(amount) : 0;
}

async function notifyPaidPurchase(paymentCode: string | null) {
  if (!paymentCode) return;
  const purchase = await prisma.coursePurchase.findUnique({
    where: { paymentCode },
    include: {
      course: { select: { slug: true, title: true } },
    },
  });
  if (!purchase || purchase.status !== 'PAID') return;
  await createNotification({
    userId: purchase.userId,
    type: 'PAYMENT',
    title: 'Thanh toán thành công',
    message: `Khoá học ${purchase.course.title} đã được mở. Bạn có thể bắt đầu học ngay.`,
    href: `/courses/${purchase.course.slug}`,
    dedupeKey: `payment-paid-${purchase.id}`,
    sendEmail: true,
  });
}

export async function handleSepayWebhook(payload: SepayWebhookPayload) {
  const paymentCode = extractPaymentCode(payload);

  try {
    await prisma.$transaction(async (tx) => {
      await tx.sepayWebhookEvent.create({
        data: {
          sepayId: payload.id,
          paymentCode,
          payload: payload as Prisma.InputJsonValue,
        },
      });

      if (payload.transferType !== 'in' || !paymentCode) return;

      const purchase = await tx.coursePurchase.findUnique({
        where: { paymentCode },
        select: { id: true, amountVnd: true, status: true },
      });
      if (!purchase || purchase.status === 'PAID') return;
      if (payload.transferAmount < purchase.amountVnd) return;

      await tx.coursePurchase.update({
        where: { id: purchase.id },
        data: { status: 'PAID', paidAt: new Date() },
      });
    });
  } catch (error) {
    if (!isDuplicateWebhookError(error)) throw error;
  }

  await notifyPaidPurchase(paymentCode);
  return { success: true };
}

export async function handleSepayPaymentGatewayIpn(payload: SepayPaymentGatewayIpnPayload) {
  const invoiceNumber = payload.order.order_invoice_number.trim().toUpperCase();
  const transactionId = payload.transaction.transaction_id;
  const paidAmount = parseVndAmount(payload.transaction.transaction_amount || payload.order.order_amount);

  try {
    await prisma.$transaction(async (tx) => {
      await tx.sepayPaymentGatewayIpnEvent.create({
        data: {
          transactionId,
          invoiceNumber,
          payload: payload as Prisma.InputJsonValue,
        },
      });

      const isPaid =
        payload.notification_type === 'ORDER_PAID' &&
        payload.order.order_status === 'CAPTURED' &&
        payload.transaction.transaction_status === 'APPROVED';
      if (!isPaid || !invoiceNumber) return;

      const purchase = await tx.coursePurchase.findUnique({
        where: { paymentCode: invoiceNumber },
        select: { id: true, amountVnd: true, status: true },
      });
      if (!purchase || purchase.status === 'PAID') return;
      if (paidAmount < purchase.amountVnd) return;

      await tx.coursePurchase.update({
        where: { id: purchase.id },
        data: { status: 'PAID', paidAt: new Date() },
      });
    });
  } catch (error) {
    if (!isDuplicateWebhookError(error)) throw error;
  }

  await notifyPaidPurchase(invoiceNumber);
  return { success: true };
}
