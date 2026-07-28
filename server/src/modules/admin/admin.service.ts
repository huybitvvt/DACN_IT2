import { prisma } from '../../db/prisma.js';
import { AppError } from '../../utils/AppError.js';
import { createNotification } from '../notification/notification.service.js';
import {
  buildRetentionScoreInputAt,
  type RetentionAnalyticsData,
} from '../retention/retention-analytics.js';
import { calculateRetentionHealth } from '../retention/retention-score.js';
import { getRetentionPlan } from '../retention/retention.service.js';
import { createLearningIntervention } from '../retention/intervention.service.js';
import type {
  CourseInput,
  ContestInput,
  ExerciseInput,
  LessonInput,
  QuizInput,
  RewardClaimStatusInput,
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
  prisma.exercise.findUnique({
    where: { id },
    include: { testCases: { orderBy: { order: 'asc' } } },
  });

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

function adminRiskLevel(level: 'ON_TRACK' | 'WATCH' | 'AT_RISK') {
  if (level === 'ON_TRACK') return 'LOW';
  if (level === 'WATCH') return 'MEDIUM';
  return 'HIGH';
}

function interventionAction(params: {
  daysInactive: number;
  percent: number;
  streak: number;
  pendingRewards: number;
}) {
  if (params.pendingRewards > 0) return 'Duyệt thưởng sớm để tạo động lực quay lại.';
  if (params.daysInactive >= 7) return 'Liên hệ trực tiếp và gợi ý nhiệm vụ 15 phút dễ nhất.';
  if (params.daysInactive >= 3) return 'Gửi nhắc học kèm lợi ích giữ streak/ranking.';
  if (params.percent < 20) return 'Gợi ý lộ trình nhập môn ngắn để tránh ngợp.';
  if (params.streak === 0) return 'Gợi ý hoàn thành một quiz nhanh để khởi động streak.';
  return 'Theo dõi thêm và khuyến khích tham gia mùa thi.';
}

export async function listRetentionRisks() {
  const now = new Date();
  const sinceWeek = new Date(now.getTime() - 7 * 86400000);
  const sinceAnalytics = new Date(now.getTime() - 56 * 86400000);
  const [users, paidCourses] = await Promise.all([
    prisma.user.findMany({
      where: { role: 'LEARNER', purchases: { some: { status: 'PAID' } } },
      select: {
        id: true,
        email: true,
        displayName: true,
        lastActiveDate: true,
        purchases: {
          where: { status: 'PAID' },
          select: { courseId: true },
        },
        progress: {
          where: { completed: true },
          select: { courseId: true, itemType: true, completedAt: true },
        },
        submissions: {
          where: { createdAt: { gte: sinceAnalytics } },
          select: {
            exerciseId: true,
            status: true,
            createdAt: true,
            exercise: { select: { lesson: { select: { courseId: true } } } },
          },
        },
        quizAttempts: {
          where: { createdAt: { gte: sinceAnalytics } },
          select: {
            quizId: true,
            score: true,
            total: true,
            createdAt: true,
            quiz: { select: { lesson: { select: { courseId: true } } } },
          },
        },
        rewardClaims: {
          where: { status: 'PENDING' },
          select: { id: true },
        },
        interventions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            status: true,
            source: true,
            baselineHealthScore: true,
            targetMissions: true,
            completedMissions: true,
            startsAt: true,
            dueAt: true,
            completedAt: true,
            outcome: true,
          },
        },
      },
    }),
    prisma.course.findMany({
      where: { purchases: { some: { status: 'PAID', user: { role: 'LEARNER' } } } },
      select: {
        id: true,
        slug: true,
        title: true,
        lessons: {
          select: {
            _count: { select: { exercises: true } },
            quiz: { select: { id: true } },
          },
        },
      },
    }),
  ]);

  const courseCatalog = new Map(
    paidCourses.map((course) => [
      course.id,
      {
        id: course.id,
        slug: course.slug,
        title: course.title,
        total: course.lessons.reduce(
          (sum, lesson) => sum + 1 + lesson._count.exercises + (lesson.quiz ? 1 : 0),
          0,
        ),
      },
    ]),
  );

  const learners = users.map((user) => {
    const paidCourseIds = new Set(user.purchases.map((purchase) => purchase.courseId));
    const courses = [...paidCourseIds].flatMap((courseId) => {
      const course = courseCatalog.get(courseId);
      if (!course) return [];
      const completed = user.progress.filter((item) => item.courseId === courseId).length;
      return [
        {
          ...course,
          completed: Math.min(completed, course.total),
          percent:
            course.total === 0
              ? 0
              : Math.min(100, Math.round((completed / course.total) * 100)),
        },
      ];
    });
    const totalItems = courses.reduce((sum, course) => sum + course.total, 0);
    const completedItems = courses.reduce((sum, course) => sum + course.completed, 0);
    const eligibleProgress = user.progress.filter((item) => paidCourseIds.has(item.courseId));
    const eligibleSubmissions = user.submissions.filter((item) =>
      paidCourseIds.has(item.exercise.lesson.courseId),
    );
    const eligibleQuizAttempts = user.quizAttempts.filter((item) =>
      paidCourseIds.has(item.quiz.lesson.courseId),
    );
    const analyticsData: RetentionAnalyticsData = {
      totalItems,
      lastActiveDate: user.lastActiveDate,
      progress: eligibleProgress,
      submissions: eligibleSubmissions.map((item) => ({
        exerciseId: item.exerciseId,
        status: item.status,
        createdAt: item.createdAt,
      })),
      quizAttempts: eligibleQuizAttempts.map((item) => ({
        quizId: item.quizId,
        score: item.score,
        total: item.total,
        createdAt: item.createdAt,
      })),
    };
    const scoreInput = buildRetentionScoreInputAt(analyticsData, now);
    const scoreResult = calculateRetentionHealth(scoreInput);
    const healthScore = scoreResult.score;
    const overallPercent = scoreInput.overallPercent;
    const daysInactive = scoreInput.daysInactive;
    const passedSubmissionsWeek = new Set(
      eligibleSubmissions
        .filter((submission) => submission.status === 'PASSED' && submission.createdAt >= sinceWeek)
        .map((submission) => submission.exerciseId),
    ).size;
    const quizAttemptsWeek = new Set(
      eligibleQuizAttempts
        .filter((attempt) => attempt.createdAt >= sinceWeek)
        .map((attempt) => attempt.quizId),
    ).size;
    const weakestCourse = [...courses].sort((a, b) => a.percent - b.percent)[0] ?? null;
    const pendingRewards = user.rewardClaims.length;

    return {
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
      },
      healthScore,
      riskLevel: adminRiskLevel(scoreResult.riskLevel),
      scoreFormula: {
        version: scoreResult.formulaVersion,
        factors: scoreResult.factors,
        reasons: scoreResult.reasons,
      },
      daysInactive,
      streak: scoreInput.effectiveStreak,
      overallPercent,
      paidCourses: courses.length,
      completedItems,
      totalItems,
      recent: {
        submissions: eligibleSubmissions.filter((submission) => submission.createdAt >= sinceWeek)
          .length,
        passedSubmissions: passedSubmissionsWeek,
        quizAttempts: quizAttemptsWeek,
      },
      pendingRewards,
      weakestCourse,
      latestIntervention: user.interventions[0] ?? null,
      suggestedAction: interventionAction({
        daysInactive,
        percent: overallPercent,
        streak: scoreInput.effectiveStreak,
        pendingRewards,
      }),
    };
  });

  const summary = {
    totalPaidLearners: learners.length,
    highRisk: learners.filter((learner) => learner.riskLevel === 'HIGH').length,
    mediumRisk: learners.filter((learner) => learner.riskLevel === 'MEDIUM').length,
    lowRisk: learners.filter((learner) => learner.riskLevel === 'LOW').length,
    pendingRewards: learners.reduce((sum, learner) => sum + learner.pendingRewards, 0),
    activeInterventions: learners.filter(
      (learner) => learner.latestIntervention?.status === 'ACTIVE',
    ).length,
  };

  return {
    summary,
    learners: learners.sort(
      (a, b) =>
        a.healthScore - b.healthScore ||
        b.daysInactive - a.daysInactive ||
        a.overallPercent - b.overallPercent,
    ),
  };
}

export async function assignRetentionIntervention(userId: string, adminId: string) {
  const learner = await prisma.user.findFirst({
    where: { id: userId, role: 'LEARNER' },
    select: { id: true },
  });
  if (!learner) throw AppError.notFound('Không tìm thấy học viên.');

  const plan = await getRetentionPlan(userId, { ensureIntervention: false });
  if (plan.riskLevel === 'NOT_STARTED') {
    throw AppError.badRequest('Học viên chưa mua khóa học nên chưa thể giao gói cứu nhịp.');
  }
  return createLearningIntervention({
    userId,
    createdById: adminId,
    source: 'ADMIN',
    healthScore: plan.healthScore,
    riskLevel: plan.riskLevel,
    reasons: plan.scoreFormula.reasons,
    missions: plan.missions,
  });
}

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
    prisma.coursePurchase.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, displayName: true } },
        course: { select: { id: true, slug: true, title: true, language: true } },
      },
    }),
    'đơn mua khoá học',
  );
  if (purchase.status === 'PAID') return purchase;

  const updated = await prisma.coursePurchase.update({
    where: { id },
    data: { status: 'PAID', paidAt: new Date() },
    include: {
      user: { select: { id: true, email: true, displayName: true } },
      course: { select: { id: true, slug: true, title: true, language: true } },
    },
  });
  await createNotification({
    userId: updated.userId,
    type: 'PAYMENT',
    title: 'Thanh toán đã được xác nhận',
    message: `Khoá học ${updated.course.title} đã được mở.`,
    href: `/courses/${updated.course.slug}`,
    dedupeKey: `payment-paid-${updated.id}`,
    sendEmail: true,
  });
  return updated;
}

// ---- Contests & rewards ----
export const listContests = () =>
  prisma.contest.findMany({
    include: {
      rewards: { orderBy: [{ rankFrom: 'asc' }, { rankTo: 'asc' }] },
      problems: { orderBy: { order: 'asc' } },
    },
    orderBy: { startsAt: 'desc' },
  });

export async function createContest(data: ContestInput) {
  const { rewards, problems, courseSlug, ...rest } = data;
  return prisma.contest.create({
    data: {
      ...rest,
      courseSlug: courseSlug || null,
      rewards: {
        create: rewards.map((r) => ({
          ...r,
          valueVnd: r.valueVnd ?? null,
          percentOff: r.percentOff ?? null,
        })),
      },
      problems: {
        create: problems.map((p, i) => ({
          problemType: p.problemType,
          exerciseId: p.problemType === 'EXERCISE' ? p.exerciseId || null : null,
          quizId: p.problemType === 'QUIZ' ? p.quizId || null : null,
          title: p.title,
          points: p.points,
          order: p.order ?? i,
        })),
      },
    },
    include: {
      rewards: { orderBy: [{ rankFrom: 'asc' }, { rankTo: 'asc' }] },
      problems: { orderBy: { order: 'asc' } },
    },
  });
}

export async function updateContest(id: string, data: ContestInput) {
  await ensureExists(prisma.contest.findUnique({ where: { id } }), 'mùa thi đua');
  const { rewards, problems, courseSlug, ...rest } = data;
  await prisma.$transaction([
    prisma.contestReward.deleteMany({ where: { contestId: id } }),
    prisma.contestProblem.deleteMany({ where: { contestId: id } }),
  ]);
  return prisma.contest.update({
    where: { id },
    data: {
      ...rest,
      courseSlug: courseSlug || null,
      rewards: {
        create: rewards.map((r) => ({
          ...r,
          valueVnd: r.valueVnd ?? null,
          percentOff: r.percentOff ?? null,
        })),
      },
      problems: {
        create: problems.map((p, i) => ({
          problemType: p.problemType,
          exerciseId: p.problemType === 'EXERCISE' ? p.exerciseId || null : null,
          quizId: p.problemType === 'QUIZ' ? p.quizId || null : null,
          title: p.title,
          points: p.points,
          order: p.order ?? i,
        })),
      },
    },
    include: {
      rewards: { orderBy: [{ rankFrom: 'asc' }, { rankTo: 'asc' }] },
      problems: { orderBy: { order: 'asc' } },
    },
  });
}

export async function deleteContest(id: string) {
  await ensureExists(prisma.contest.findUnique({ where: { id } }), 'mùa thi đua');
  return prisma.contest.delete({ where: { id } });
}

export const listRewardClaims = () =>
  prisma.rewardClaim.findMany({
    include: {
      user: { select: { id: true, email: true, displayName: true } },
      contest: { select: { id: true, slug: true, title: true } },
      reward: {
        select: {
          id: true,
          title: true,
          description: true,
          rewardType: true,
          percentOff: true,
          valueVnd: true,
        },
      },
    },
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    take: 100,
  });

export async function updateRewardClaimStatus(id: string, data: RewardClaimStatusInput) {
  await ensureExists(prisma.rewardClaim.findUnique({ where: { id } }), 'yêu cầu nhận thưởng');
  const claim = await prisma.rewardClaim.update({
    where: { id },
    data: {
      status: data.status,
      note: data.note,
      reviewedAt: data.status === 'PENDING' ? null : new Date(),
    },
    include: {
      user: { select: { id: true, email: true, displayName: true } },
      contest: { select: { id: true, slug: true, title: true } },
      reward: {
        select: {
          id: true,
          title: true,
          description: true,
          rewardType: true,
          percentOff: true,
          valueVnd: true,
        },
      },
    },
  });
  if (claim.status !== 'PENDING') {
    await createNotification({
      userId: claim.user.id,
      type: 'REWARD',
      title:
        claim.status === 'APPROVED'
          ? 'Yêu cầu nhận thưởng đã được duyệt'
          : 'Yêu cầu nhận thưởng chưa được duyệt',
      message:
        claim.note ||
        (claim.status === 'APPROVED'
          ? `Phần thưởng ${claim.reward.title} đã được duyệt.`
          : `Yêu cầu ${claim.reward.title} đã bị từ chối.`),
      href: `/contests/${claim.contest.slug}`,
      dedupeKey: `reward-review-${claim.id}-${claim.updatedAt.toISOString()}`,
      sendEmail: true,
    });
  }
  return claim;
}

// Helper: ném 404 nếu bản ghi không tồn tại.
async function ensureExists<T>(promise: Promise<T | null>, label: string): Promise<T> {
  const found = await promise;
  if (!found) throw AppError.notFound(`Không tìm thấy ${label}.`);
  return found;
}
