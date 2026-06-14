import type { Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { AppError } from '../../utils/AppError.js';
import {
  getCourseBySlug,
  getLessonById,
  listCourses,
  searchLessons,
} from './content.service.js';

// GET /api/courses
export const getCourses = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw AppError.unauthorized();
  const courses = await listCourses(req.user.sub);
  res.json({ courses });
});

// GET /api/courses/:slug
export const getCourse = asyncHandler(async (req: Request, res: Response) => {
  const slug = z.string().min(1).parse(req.params.slug);
  if (!req.user) throw AppError.unauthorized();
  const course = await getCourseBySlug(slug, req.user.sub);
  res.json({ course });
});

// GET /api/lessons/:id
export const getLesson = asyncHandler(async (req: Request, res: Response) => {
  const id = z.string().min(1).parse(req.params.id);
  if (!req.user) throw AppError.unauthorized();
  const lesson = await getLessonById(id, req.user.sub);
  res.json({ lesson });
});

// GET /api/search?q=
export const search = asyncHandler(async (req: Request, res: Response) => {
  const q = z.string().optional().parse(req.query.q) ?? '';
  const results = await searchLessons(q);
  res.json({ results });
});
