import { randomBytes } from 'node:crypto';
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
