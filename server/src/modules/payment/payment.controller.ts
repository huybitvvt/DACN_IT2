import type { Request, Response } from 'express';
import { z } from 'zod';
import { env } from '../../config/env.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { AppError } from '../../utils/AppError.js';
import { confirmCoursePaymentDemo, createCourseCheckout, handleSepayWebhook } from './payment.service.js';

const slugSchema = z.string().min(1);
const sepayWebhookSchema = z
  .object({
    id: z.number().int(),
    transferType: z.string(),
    transferAmount: z.number(),
    code: z.string().nullable().optional(),
    content: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
  })
  .passthrough();

export const checkoutCourse = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw AppError.unauthorized();
  const slug = slugSchema.parse(req.params.slug);
  const checkout = await createCourseCheckout(req.user.sub, slug);
  res.json({ checkout });
});

export const confirmCourseDemo = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw AppError.unauthorized();
  const slug = slugSchema.parse(req.params.slug);
  const result = await confirmCoursePaymentDemo(req.user.sub, slug);
  res.json(result);
});

export const sepayWebhook = asyncHandler(async (req: Request, res: Response) => {
  if (!env.sepayWebhookApiKey) {
    throw AppError.internal('Chưa cấu hình SEPAY_WEBHOOK_API_KEY.');
  }

  const authorization = req.header('authorization') ?? '';
  if (authorization !== `Apikey ${env.sepayWebhookApiKey}`) {
    throw AppError.unauthorized('Sai API key webhook SePay.');
  }

  const payload = sepayWebhookSchema.parse(req.body);
  await handleSepayWebhook(payload);
  res.status(200).json({ success: true });
});
