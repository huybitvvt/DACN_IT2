import type { Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../utils/asyncHandler.js';
import {
  getNotificationPreferences,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  updateNotificationPreferences,
} from './notification.service.js';

const preferenceSchema = z.object({
  emailPayments: z.boolean(),
  emailRewards: z.boolean(),
  emailContests: z.boolean(),
  emailRetention: z.boolean(),
  emailBadges: z.boolean(),
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const limit = z.coerce.number().int().min(1).max(100).default(30).parse(req.query.limit);
  res.json(await listNotifications(req.user!.sub, limit));
});

export const markRead = asyncHandler(async (req: Request, res: Response) => {
  const id = z.string().min(1).parse(req.params.id);
  res.json({ notification: await markNotificationRead(req.user!.sub, id) });
});

export const markAllRead = asyncHandler(async (req: Request, res: Response) => {
  res.json(await markAllNotificationsRead(req.user!.sub));
});

export const preferences = asyncHandler(async (req: Request, res: Response) => {
  res.json({ preferences: await getNotificationPreferences(req.user!.sub) });
});

export const updatePreferences = asyncHandler(async (req: Request, res: Response) => {
  const input = preferenceSchema.parse(req.body);
  res.json({ preferences: await updateNotificationPreferences(req.user!.sub, input) });
});
