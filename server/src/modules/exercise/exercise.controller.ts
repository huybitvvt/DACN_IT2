import type { Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { prisma } from '../../db/prisma.js';
import { getExerciseForLearner, gradeSubmission } from './exercise.service.js';
import { courseIdOfLesson, markCompleted } from '../progress/progress.service.js';
import { onLearningActivity } from '../gamification/gamification.service.js';

// GET /api/exercises/:id
export const getExercise = asyncHandler(async (req: Request, res: Response) => {
  const id = z.string().min(1).parse(req.params.id);
  const exercise = await getExerciseForLearner(id);
  res.json({ exercise });
});

const submitSchema = z.object({
  sourceCode: z.string().min(1, 'Mã nguồn không được rỗng.').max(50000),
});

// POST /api/exercises/:id/submit
export const submitExercise = asyncHandler(async (req: Request, res: Response) => {
  const id = z.string().min(1).parse(req.params.id);
  const { sourceCode } = submitSchema.parse(req.body);

  const grade = await gradeSubmission({ exerciseId: id, sourceCode });

  // Lưu submission + cập nhật tiến độ chỉ khi đã đăng nhập (Yêu cầu 4.6, 4.7).
  if (req.user) {
    await prisma.submission.create({
      data: {
        userId: req.user.sub,
        exerciseId: id,
        sourceCode,
        passedCount: grade.passed,
        totalCount: grade.total,
        status: grade.status,
      },
    });

    // Nếu đạt, đánh dấu hoàn thành bài tập trong tiến độ.
    if (grade.status === 'PASSED') {
      const exercise = await prisma.exercise.findUnique({
        where: { id },
        select: { lessonId: true },
      });
      if (exercise) {
        const courseId = await courseIdOfLesson(exercise.lessonId);
        if (courseId) {
          await markCompleted({
            userId: req.user.sub,
            courseId,
            itemType: 'EXERCISE',
            itemId: id,
          });
        }
      }
    }

    // Cập nhật streak + huy hiệu sau hoạt động học tập.
    await onLearningActivity(req.user.sub);
  }

  res.json({
    passed: grade.passed,
    total: grade.total,
    status: grade.status,
    results: grade.results,
    ...(grade.compileError ? { compileError: grade.compileError } : {}),
    saved: Boolean(req.user),
  });
});
