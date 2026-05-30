import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { AppError } from '../../utils/AppError.js';
import { getGamificationData } from './gamification.service.js';

// GET /api/gamification — streak + huy hiệu của người dùng hiện tại.
export const getGamification = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw AppError.unauthorized();
  const data = await getGamificationData(req.user.sub);
  res.json(data);
});
