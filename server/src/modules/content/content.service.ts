import { prisma } from '../../db/prisma.js';
import { AppError } from '../../utils/AppError.js';

// Danh sách khoá học, sắp theo thứ tự hiển thị.
export async function listCourses() {
  return prisma.course.findMany({
    orderBy: { order: 'asc' },
    select: {
      id: true,
      slug: true,
      title: true,
      language: true,
      description: true,
      order: true,
    },
  });
}

// Chi tiết một khoá theo slug, kèm mục lục bài học (không kèm nội dung dài).
export async function getCourseBySlug(slug: string) {
  const course = await prisma.course.findUnique({
    where: { slug },
    include: {
      lessons: {
        orderBy: { order: 'asc' },
        select: { id: true, title: true, order: true, isPublic: true },
      },
    },
  });
  if (!course) {
    throw AppError.notFound('Không tìm thấy khoá học.');
  }
  return course;
}

// Chi tiết một bài học kèm ví dụ code và điều hướng trước/sau.
export async function getLessonById(id: string) {
  const lesson = await prisma.lesson.findUnique({
    where: { id },
    include: {
      examples: { orderBy: { order: 'asc' } },
      exercises: {
        orderBy: { order: 'asc' },
        select: { id: true, title: true },
      },
      course: { select: { id: true, slug: true, title: true, language: true } },
      quiz: { select: { id: true } },
    },
  });
  if (!lesson) {
    throw AppError.notFound('Không tìm thấy bài học.');
  }

  // Tìm bài trước và bài kế tiếp trong cùng khoá (theo order).
  const [prev, next] = await Promise.all([
    prisma.lesson.findFirst({
      where: { courseId: lesson.courseId, order: { lt: lesson.order } },
      orderBy: { order: 'desc' },
      select: { id: true, title: true },
    }),
    prisma.lesson.findFirst({
      where: { courseId: lesson.courseId, order: { gt: lesson.order } },
      orderBy: { order: 'asc' },
      select: { id: true, title: true },
    }),
  ]);

  return { ...lesson, prev, next };
}

// Tìm kiếm bài học theo từ khoá trong tiêu đề hoặc nội dung.
export async function searchLessons(query: string) {
  const q = query.trim();
  if (!q) return [];

  return prisma.lesson.findMany({
    where: {
      OR: [
        { title: { contains: q, mode: 'insensitive' } },
        { contentMarkdown: { contains: q, mode: 'insensitive' } },
      ],
    },
    orderBy: { order: 'asc' },
    take: 30,
    select: {
      id: true,
      title: true,
      course: { select: { slug: true, title: true, language: true } },
    },
  });
}
