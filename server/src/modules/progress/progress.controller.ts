import type { Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { AppError } from '../../utils/AppError.js';
import {
  courseIdOfLesson,
  getCompletedItemIds,
  getProgressOverview,
  markCompleted,
} from './progress.service.js';
import { onLearningActivity } from '../gamification/gamification.service.js';

// GET /api/progress — tổng quan tiến độ + danh sách item đã hoàn thành.
export const getProgress = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw AppError.unauthorized();
  const [courses, completedItemIds] = await Promise.all([
    getProgressOverview(req.user.sub),
    getCompletedItemIds(req.user.sub),
  ]);
  res.json({ courses, completedItemIds });
});

const completeSchema = z.object({
  type: z.enum(['LESSON', 'EXERCISE', 'QUIZ']),
  refId: z.string().min(1),
  lessonId: z.string().min(1).optional(),
});

// POST /api/progress/complete — đánh dấu hoàn thành một item.
// Chủ yếu dùng cho LESSON (đọc xong); exercise/quiz tự đánh dấu khi đạt.
export const completeItem = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw AppError.unauthorized();
  const input = completeSchema.parse(req.body);

  // Xác định courseId: nếu là LESSON thì refId chính là lessonId.
  const lessonId = input.type === 'LESSON' ? input.refId : input.lessonId;
  if (!lessonId) {
    throw AppError.badRequest('Thiếu lessonId để xác định khoá học.');
  }
  const courseId = await courseIdOfLesson(lessonId);
  if (!courseId) {
    throw AppError.notFound('Không tìm thấy bài học tương ứng.');
  }

  await markCompleted({
    userId: req.user.sub,
    courseId,
    itemType: input.type,
    itemId: input.refId,
  });

  // Cập nhật streak + huy hiệu sau hoạt động học tập.
  await onLearningActivity(req.user.sub);

  res.json({ success: true });
});
