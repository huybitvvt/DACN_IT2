import type { Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { prisma } from '../../db/prisma.js';
import { getQuizForLesson, gradeQuiz } from './quiz.service.js';
import { courseIdOfLesson, markCompleted } from '../progress/progress.service.js';
import { onLearningActivity } from '../gamification/gamification.service.js';

// GET /api/lessons/:id/quiz
export const getQuiz = asyncHandler(async (req: Request, res: Response) => {
  const lessonId = z.string().min(1).parse(req.params.id);
  const quiz = await getQuizForLesson(lessonId);
  res.json({ quiz });
});

const submitSchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.string().min(1),
      choiceIds: z.array(z.string().min(1)),
    }),
  ),
});

// POST /api/quizzes/:id/submit
export const submitQuiz = asyncHandler(async (req: Request, res: Response) => {
  const quizId = z.string().min(1).parse(req.params.id);
  const { answers } = submitSchema.parse(req.body);

  const result = await gradeQuiz(quizId, answers);

  // Lưu kết quả nếu đã đăng nhập (Yêu cầu 6.4).
  if (req.user) {
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      select: { lessonId: true },
    });
    if (quiz) {
      await prisma.quizAttempt.create({
        data: {
          userId: req.user.sub,
          quizId,
          score: result.score,
          total: result.total,
        },
      });
      // Đánh dấu hoàn thành quiz trong tiến độ.
      const courseId = await courseIdOfLesson(quiz.lessonId);
      if (courseId) {
        await markCompleted({
          userId: req.user.sub,
          courseId,
          itemType: 'QUIZ',
          itemId: quizId,
        });
      }
    }
    // Cập nhật streak + huy hiệu.
    await onLearningActivity(req.user.sub);
  }

  res.json({ ...result, saved: Boolean(req.user) });
});
