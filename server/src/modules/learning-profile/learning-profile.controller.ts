import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { getLearningErrorProfile } from './learning-profile.service.js';

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  res.json(await getLearningErrorProfile(req.user!.sub));
});
