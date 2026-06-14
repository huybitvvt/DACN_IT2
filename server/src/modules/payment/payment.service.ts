import { randomBytes } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { env } from '../../config/env.js';
import { prisma } from '../../db/prisma.js';
import { AppError } from '../../utils/AppError.js';

function createPaymentCode() {
  return `CL${randomBytes(5).toString('hex').toUpperCase()}`;
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
    existing ??
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
    purchase,
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

export async function confirmCoursePaymentDemo(userId: string, slug: string) {
  const course = await prisma.course.findUnique({ where: { slug }, select: { id: true } });
  if (!course) throw AppError.notFound('Không tìm thấy khoá học.');

  const purchase = await prisma.coursePurchase.findUnique({
    where: { userId_courseId: { userId, courseId: course.id } },
  });
  if (!purchase) throw AppError.badRequest('Bạn cần tạo mã thanh toán trước.');

  await prisma.coursePurchase.update({
    where: { id: purchase.id },
    data: { status: 'PAID', paidAt: new Date() },
  });

  return { success: true };
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

  return { success: true };
}
