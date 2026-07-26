import type { Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../utils/asyncHandler.js';
import * as svc from './admin.service.js';
import {
  courseSchema,
  contestSchema,
  exerciseSchema,
  lessonSchema,
  quizSchema,
  rewardClaimStatusSchema,
} from './admin.schema.js';

const idParam = (req: Request) => z.string().min(1).parse(req.params.id);

// ---- Courses ----
export const listCourses = asyncHandler(async (_req, res: Response) => {
  res.json({ courses: await svc.listCourses() });
});
export const createCourse = asyncHandler(async (req: Request, res: Response) => {
  res.status(201).json({ course: await svc.createCourse(courseSchema.parse(req.body)) });
});
export const updateCourse = asyncHandler(async (req: Request, res: Response) => {
  res.json({ course: await svc.updateCourse(idParam(req), courseSchema.parse(req.body)) });
});
export const deleteCourse = asyncHandler(async (req: Request, res: Response) => {
  await svc.deleteCourse(idParam(req));
  res.json({ success: true });
});

// ---- Lessons ----
export const listLessons = asyncHandler(async (req: Request, res: Response) => {
  const courseId = z.string().optional().parse(req.query.courseId);
  res.json({ lessons: await svc.listLessons(courseId) });
});
export const createLesson = asyncHandler(async (req: Request, res: Response) => {
  res.status(201).json({ lesson: await svc.createLesson(lessonSchema.parse(req.body)) });
});
export const updateLesson = asyncHandler(async (req: Request, res: Response) => {
  res.json({ lesson: await svc.updateLesson(idParam(req), lessonSchema.parse(req.body)) });
});
export const deleteLesson = asyncHandler(async (req: Request, res: Response) => {
  await svc.deleteLesson(idParam(req));
  res.json({ success: true });
});

// ---- Exercises ----
export const listExercises = asyncHandler(async (req: Request, res: Response) => {
  const lessonId = z.string().optional().parse(req.query.lessonId);
  res.json({ exercises: await svc.listExercises(lessonId) });
});
export const getExercise = asyncHandler(async (req: Request, res: Response) => {
  res.json({ exercise: await svc.getExercise(idParam(req)) });
});
export const createExercise = asyncHandler(async (req: Request, res: Response) => {
  res.status(201).json({ exercise: await svc.createExercise(exerciseSchema.parse(req.body)) });
});
export const updateExercise = asyncHandler(async (req: Request, res: Response) => {
  res.json({ exercise: await svc.updateExercise(idParam(req), exerciseSchema.parse(req.body)) });
});
export const deleteExercise = asyncHandler(async (req: Request, res: Response) => {
  await svc.deleteExercise(idParam(req));
  res.json({ success: true });
});

// ---- Quizzes ----
export const getQuiz = asyncHandler(async (req: Request, res: Response) => {
  res.json({ quiz: await svc.getQuiz(idParam(req)) });
});
export const createQuiz = asyncHandler(async (req: Request, res: Response) => {
  res.status(201).json({ quiz: await svc.createQuiz(quizSchema.parse(req.body)) });
});
export const updateQuiz = asyncHandler(async (req: Request, res: Response) => {
  res.json({ quiz: await svc.updateQuiz(idParam(req), quizSchema.parse(req.body)) });
});
export const deleteQuiz = asyncHandler(async (req: Request, res: Response) => {
  await svc.deleteQuiz(idParam(req));
  res.json({ success: true });
});

// ---- Users ----
export const listUsers = asyncHandler(async (_req, res: Response) => {
  res.json({ users: await svc.listUsers() });
});

export const listRetentionRisks = asyncHandler(async (_req, res: Response) => {
  res.json(await svc.listRetentionRisks());
});

export const assignRetentionIntervention = asyncHandler(async (req: Request, res: Response) => {
  const userId = idParam(req);
  res.status(201).json({
    intervention: await svc.assignRetentionIntervention(userId, req.user!.sub),
  });
});

// ---- Purchases ----
export const listPurchases = asyncHandler(async (req: Request, res: Response) => {
  const status = z.enum(['PENDING', 'PAID']).optional().parse(req.query.status || undefined);
  const q = z.string().optional().parse(req.query.q);
  res.json({ purchases: await svc.listPurchases({ status, q }) });
});

export const markPurchasePaid = asyncHandler(async (req: Request, res: Response) => {
  const purchase = await svc.markPurchasePaid(idParam(req));
  res.json({ purchase });
});

// ---- Contests ----
export const listContests = asyncHandler(async (_req, res: Response) => {
  res.json({ contests: await svc.listContests() });
});

export const createContest = asyncHandler(async (req: Request, res: Response) => {
  res.status(201).json({ contest: await svc.createContest(contestSchema.parse(req.body)) });
});

export const updateContest = asyncHandler(async (req: Request, res: Response) => {
  res.json({ contest: await svc.updateContest(idParam(req), contestSchema.parse(req.body)) });
});

export const deleteContest = asyncHandler(async (req: Request, res: Response) => {
  await svc.deleteContest(idParam(req));
  res.json({ success: true });
});

export const listRewardClaims = asyncHandler(async (_req, res: Response) => {
  res.json({ claims: await svc.listRewardClaims() });
});

export const updateRewardClaimStatus = asyncHandler(async (req: Request, res: Response) => {
  const claim = await svc.updateRewardClaimStatus(idParam(req), rewardClaimStatusSchema.parse(req.body));
  res.json({ claim });
});
