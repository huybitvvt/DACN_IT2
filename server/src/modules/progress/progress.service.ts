import { prisma } from '../../db/prisma.js';
import type { ProgressItemType } from '@prisma/client';

// Đánh dấu một item (lesson/exercise/quiz) là hoàn thành cho người dùng.
// Tính đơn điệu (Property 6): khi đã completed thì không quay lại false.
// Dùng upsert theo khoá duy nhất (userId, itemType, itemId).
export async function markCompleted(params: {
  userId: string;
  courseId: string;
  itemType: ProgressItemType;
  itemId: string;
}): Promise<void> {
  const { userId, courseId, itemType, itemId } = params;
  await prisma.progress.upsert({
    where: {
      userId_itemType_itemId: { userId, itemType, itemId },
    },
    update: { completed: true, completedAt: new Date() },
    create: {
      userId,
      courseId,
      itemType,
      itemId,
      completed: true,
      completedAt: new Date(),
    },
  });
}

// Tìm courseId từ một lesson (bài tập/quiz đều gắn với lesson -> course).
export async function courseIdOfLesson(lessonId: string): Promise<string | null> {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: { courseId: true },
  });
  return lesson?.courseId ?? null;
}

// Đếm tổng số item (lesson + exercise + quiz) của một khoá.
async function countCourseItems(courseId: string): Promise<number> {
  const lessons = await prisma.lesson.findMany({
    where: { courseId },
    select: {
      _count: { select: { exercises: true } },
      quiz: { select: { id: true } },
    },
  });
  let total = 0;
  for (const l of lessons) {
    total += 1; // chính bài học
    total += l._count.exercises; // số bài tập
    if (l.quiz) total += 1; // quiz (nếu có)
  }
  return total;
}

export interface CourseProgress {
  courseId: string;
  slug: string;
  title: string;
  completed: number;
  total: number;
  percent: number;
}

// Tổng hợp tiến độ theo từng khoá cho một người dùng.
// Property 5: percent luôn trong [0,100] = completed/total * 100.
export async function getProgressOverview(userId: string): Promise<CourseProgress[]> {
  const courses = await prisma.course.findMany({ orderBy: { order: 'asc' } });
  const overview: CourseProgress[] = [];

  for (const course of courses) {
    const total = await countCourseItems(course.id);
    const completed = await prisma.progress.count({
      where: { userId, courseId: course.id, completed: true },
    });
    const percent = total === 0 ? 0 : Math.min(100, Math.round((completed / total) * 100));
    overview.push({
      courseId: course.id,
      slug: course.slug,
      title: course.title,
      completed: Math.min(completed, total),
      total,
      percent,
    });
  }

  return overview;
}

// Lấy danh sách id các item đã hoàn thành của người dùng (cho lộ trình).
export async function getCompletedItemIds(userId: string): Promise<string[]> {
  const rows = await prisma.progress.findMany({
    where: { userId, completed: true },
    select: { itemId: true },
  });
  return rows.map((r) => r.itemId);
}
