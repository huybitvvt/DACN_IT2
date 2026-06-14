import { prisma } from '../../db/prisma.js';
import { AppError } from '../../utils/AppError.js';
import type {
  CourseInput,
  ExerciseInput,
  LessonInput,
  QuizInput,
} from './admin.schema.js';

// ---- Courses ----
export const listCourses = () => prisma.course.findMany({ orderBy: { order: 'asc' } });

export const createCourse = (data: CourseInput) => prisma.course.create({ data });

export async function updateCourse(id: string, data: CourseInput) {
  await ensureExists(prisma.course.findUnique({ where: { id } }), 'khoá học');
  return prisma.course.update({ where: { id }, data });
}

export async function deleteCourse(id: string) {
  await ensureExists(prisma.course.findUnique({ where: { id } }), 'khoá học');
  return prisma.course.delete({ where: { id } });
}

// ---- Lessons ----
export const listLessons = (courseId?: string) =>
  prisma.lesson.findMany({
    where: courseId ? { courseId } : undefined,
    orderBy: [{ courseId: 'asc' }, { order: 'asc' }],
  });

export const createLesson = (data: LessonInput) => prisma.lesson.create({ data });

export async function updateLesson(id: string, data: LessonInput) {
  await ensureExists(prisma.lesson.findUnique({ where: { id } }), 'bài học');
  return prisma.lesson.update({ where: { id }, data });
}

export async function deleteLesson(id: string) {
  await ensureExists(prisma.lesson.findUnique({ where: { id } }), 'bài học');
  return prisma.lesson.delete({ where: { id } });
}

// ---- Exercises (kèm test cases) ----
export const getExercise = (id: string) =>
  prisma.exercise.findUnique({ where: { id }, include: { testCases: { orderBy: { order: 'asc' } } } });

export const listExercises = (lessonId?: string) =>
  prisma.exercise.findMany({
    where: lessonId ? { lessonId } : undefined,
    include: { testCases: true },
  });

export async function createExercise(data: ExerciseInput) {
  const { testCases, ...rest } = data;
  return prisma.exercise.create({
    data: {
      ...rest,
      testCases: {
        create: testCases.map((tc, i) => ({ ...tc, order: i })),
      },
    },
    include: { testCases: true },
  });
}

// Cập nhật bài tập: thay toàn bộ test case bằng tập mới (đơn giản, nhất quán).
export async function updateExercise(id: string, data: ExerciseInput) {
  await ensureExists(prisma.exercise.findUnique({ where: { id } }), 'bài tập');
  const { testCases, ...rest } = data;
  await prisma.testCase.deleteMany({ where: { exerciseId: id } });
  return prisma.exercise.update({
    where: { id },
    data: {
      ...rest,
      testCases: { create: testCases.map((tc, i) => ({ ...tc, order: i })) },
    },
    include: { testCases: true },
  });
}

export async function deleteExercise(id: string) {
  await ensureExists(prisma.exercise.findUnique({ where: { id } }), 'bài tập');
  return prisma.exercise.delete({ where: { id } });
}

// ---- Quizzes (kèm questions/choices) ----
export const getQuiz = (id: string) =>
  prisma.quiz.findUnique({
    where: { id },
    include: { questions: { include: { choices: true }, orderBy: { order: 'asc' } } },
  });

export async function createQuiz(data: QuizInput) {
  const { questions, ...rest } = data;
  return prisma.quiz.create({
    data: {
      ...rest,
      questions: {
        create: questions.map((q, qi) => ({
          text: q.text,
          type: q.type,
          order: qi,
          choices: { create: q.choices.map((c, ci) => ({ ...c, order: ci })) },
        })),
      },
    },
    include: { questions: { include: { choices: true } } },
  });
}

export async function updateQuiz(id: string, data: QuizInput) {
  await ensureExists(prisma.quiz.findUnique({ where: { id } }), 'quiz');
  const { questions, ...rest } = data;
  // Xoá câu hỏi cũ (cascade xoá choices) rồi tạo lại.
  await prisma.question.deleteMany({ where: { quizId: id } });
  return prisma.quiz.update({
    where: { id },
    data: {
      ...rest,
      questions: {
        create: questions.map((q, qi) => ({
          text: q.text,
          type: q.type,
          order: qi,
          choices: { create: q.choices.map((c, ci) => ({ ...c, order: ci })) },
        })),
      },
    },
    include: { questions: { include: { choices: true } } },
  });
}

export async function deleteQuiz(id: string) {
  await ensureExists(prisma.quiz.findUnique({ where: { id } }), 'quiz');
  return prisma.quiz.delete({ where: { id } });
}

// ---- Users ----
export const listUsers = () =>
  prisma.user.findMany({
    select: {
      id: true,
      email: true,
      displayName: true,
      role: true,
      streakCount: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

export async function listPurchases(params: { status?: 'PENDING' | 'PAID'; q?: string }) {
  const q = params.q?.trim();
  return prisma.coursePurchase.findMany({
    where: {
      status: params.status,
      ...(q
        ? {
            OR: [
              { paymentCode: { contains: q, mode: 'insensitive' } },
              { user: { email: { contains: q, mode: 'insensitive' } } },
              { user: { displayName: { contains: q, mode: 'insensitive' } } },
              { course: { title: { contains: q, mode: 'insensitive' } } },
              { course: { slug: { contains: q, mode: 'insensitive' } } },
            ],
          }
        : {}),
    },
    include: {
      user: { select: { id: true, email: true, displayName: true } },
      course: { select: { id: true, slug: true, title: true, language: true } },
    },
    orderBy: { updatedAt: 'desc' },
    take: 100,
  });
}

export async function markPurchasePaid(id: string) {
  const purchase = await ensureExists(
    prisma.coursePurchase.findUnique({ where: { id } }),
    'đơn mua khoá học',
  );
  if (purchase.status === 'PAID') return purchase;

  return prisma.coursePurchase.update({
    where: { id },
    data: { status: 'PAID', paidAt: new Date() },
  });
}

// Helper: ném 404 nếu bản ghi không tồn tại.
async function ensureExists<T>(promise: Promise<T | null>, label: string): Promise<T> {
  const found = await promise;
  if (!found) throw AppError.notFound(`Không tìm thấy ${label}.`);
  return found;
}
