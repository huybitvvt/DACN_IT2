import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { AppError } from '../../utils/AppError.js';
import { getRetentionPlan } from './retention.service.js';
import { getInterventionHistory } from './intervention.service.js';

// GET /api/retention/plan — kế hoạch giữ nhịp học tập cá nhân.
export const getPlan = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw AppError.unauthorized();
  const plan = await getRetentionPlan(req.user.sub);
  res.json(plan);
});

export const getHistory = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw AppError.unauthorized();
  res.json({ interventions: await getInterventionHistory(req.user.sub) });
});
