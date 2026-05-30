import type { Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../utils/asyncHandler.js';
import {
  getCourseBySlug,
  getLessonById,
  listCourses,
  searchLessons,
} from './content.service.js';

// GET /api/courses
export const getCourses = asyncHandler(async (_req: Request, res: Response) => {
  const courses = await listCourses();
  res.json({ courses });
});

// GET /api/courses/:slug
export const getCourse = asyncHandler(async (req: Request, res: Response) => {
  const slug = z.string().min(1).parse(req.params.slug);
  const course = await getCourseBySlug(slug);
  res.json({ course });
});

// GET /api/lessons/:id
export const getLesson = asyncHandler(async (req: Request, res: Response) => {
  const id = z.string().min(1).parse(req.params.id);
  const lesson = await getLessonById(id);
  res.json({ lesson });
});

// GET /api/search?q=
export const search = asyncHandler(async (req: Request, res: Response) => {
  const q = z.string().optional().parse(req.query.q) ?? '';
  const results = await searchLessons(q);
  res.json({ results });
});
