import type { Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../utils/asyncHandler.js';
import {
  claimContestReward,
  getContestDetail,
  getContestRoom,
  getMyContestReward,
  listContests,
  startContestAttempt,
  submitContestAttempt,
} from './contest.service.js';

export const getContests = asyncHandler(async (_req: Request, res: Response) => {
  const contests = await listContests();
  res.json({ contests });
});

export const getContest = asyncHandler(async (req: Request, res: Response) => {
  const slug = z.string().min(1).parse(req.params.slug);
  const contest = await getContestDetail(slug);
  res.json({ contest });
});

export const getMyContest = asyncHandler(async (req: Request, res: Response) => {
  const slug = z.string().min(1).parse(req.params.slug);
  const result = await getMyContestReward(slug, req.user!.sub);
  res.json(result);
});

export const claimReward = asyncHandler(async (req: Request, res: Response) => {
  const slug = z.string().min(1).parse(req.params.slug);
  const claim = await claimContestReward(slug, req.user!.sub);
  res.status(201).json({ claim });
});

export const getRoom = asyncHandler(async (req: Request, res: Response) => {
  const slug = z.string().min(1).parse(req.params.slug);
  const room = await getContestRoom(slug, req.user!.sub);
  res.json(room);
});

export const startAttempt = asyncHandler(async (req: Request, res: Response) => {
  const slug = z.string().min(1).parse(req.params.slug);
  const room = await startContestAttempt(slug, req.user!.sub);
  res.status(201).json(room);
});

export const submitAttempt = asyncHandler(async (req: Request, res: Response) => {
  const slug = z.string().min(1).parse(req.params.slug);
  const room = await submitContestAttempt(slug, req.user!.sub);
  res.json(room);
});
