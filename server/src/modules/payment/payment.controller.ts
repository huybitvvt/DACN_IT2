import type { Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { AppError } from '../../utils/AppError.js';
import { confirmCoursePaymentDemo, createCourseCheckout } from './payment.service.js';

const slugSchema = z.string().min(1);

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
