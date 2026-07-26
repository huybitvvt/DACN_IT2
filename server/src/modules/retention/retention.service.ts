import { prisma } from '../../db/prisma.js';
import { getProgressOverview } from '../progress/progress.service.js';
import { calculateRetentionHealth } from './retention-score.js';
import {
  ensureLearningIntervention,
  type InterventionMissionInput,
} from './intervention.service.js';

type RiskLevel = 'NOT_STARTED' | 'ON_TRACK' | 'WATCH' | 'AT_RISK';
type MissionType = 'COURSE' | 'LESSON' | 'EXERCISE' | 'QUIZ' | 'CONTEST';

export interface RetentionMission extends InterventionMissionInput {
  type: MissionType;
  points: number;
  ctaLabel: string;
}

function daysBetween(start: Date, end: Date) {
  const startDay = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());
  const endDay = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate());
  return Math.max(0, Math.floor((endDay - startDay) / 86400000));
}

function riskLabel(level: RiskLevel) {
  if (level === 'NOT_STARTED') return 'Chưa bắt đầu khoá học';
  if (level === 'ON_TRACK') return 'Đang giữ nhịp tốt';
  if (level === 'WATCH') return 'Cần kéo nhịp hôm nay';
  return 'Nguy cơ bỏ nhịp cao';
}

function riskMessage(level: RiskLevel) {
  if (level === 'NOT_STARTED') {
    return 'Bạn chưa mua khoá học nào nên hệ thống chưa tính nguy cơ bỏ học. Hãy chọn một khoá phù hợp để bắt đầu lộ trình và tham gia thi đua.';
  }
  if (level === 'ON_TRACK') {
    return 'Bạn đang có tín hiệu học đều. Giữ một nhiệm vụ ngắn mỗi ngày để bảo vệ vị trí ranking.';
  }
  if (level === 'WATCH') {
    return 'Bạn có dấu hiệu chậm lại. Hoàn thành một nhiệm vụ 15 phút hôm nay để kéo lại streak và điểm thi đua.';
  }
  return 'Hệ thống phát hiện bạn đang dễ rơi khỏi lộ trình. Ưu tiên nhiệm vụ ngắn nhất để quay lại trước khi mất động lực.';
}

export async function getRetentionPlan(
  userId: string,
  options: { ensureIntervention?: boolean } = {},
) {
  const now = new Date();
  const sinceWeek = new Date(now.getTime() - 7 * 86400000);
  const [
    user,
    progress,
    completedRows,
    badgesCount,
    paidPurchases,
    activeContests,
    recentPassedSubmissions,
    recentQuizAttempts,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { streakCount: true, lastActiveDate: true },
    }),
    getProgressOverview(userId),
    prisma.progress.findMany({
      where: { userId, completed: true },
      select: { itemId: true, itemType: true },
    }),
    prisma.userBadge.count({ where: { userId } }),
    prisma.coursePurchase.findMany({
      where: { userId, status: 'PAID' },
      include: { course: { select: { id: true, slug: true, title: true } } },
    }),
    prisma.contest.findMany({
      where: {
        startsAt: { lte: now },
        endsAt: { gte: now },
      },
      include: { rewards: { orderBy: [{ rankFrom: 'asc' }, { rankTo: 'asc' }] } },
      orderBy: { endsAt: 'asc' },
      take: 2,
    }),
    prisma.submission.count({
      where: { userId, status: 'PASSED', createdAt: { gte: sinceWeek } },
    }),
    prisma.quizAttempt.count({
      where: { userId, createdAt: { gte: sinceWeek } },
    }),
  ]);

  const purchasedCourseIds = new Set(paidPurchases.map((purchase) => purchase.courseId));
  const purchasedCourseSlugs = new Set(paidPurchases.map((purchase) => purchase.course.slug));
  const hasPurchasedCourse = paidPurchases.length > 0;
  const eligibleContests = activeContests.filter(
    (contest) => !contest.courseSlug || purchasedCourseSlugs.has(contest.courseSlug),
  );
  const completedItemIds = new Set(completedRows.map((row) => row.itemId));
  const purchasedProgress = progress.filter((course) => purchasedCourseIds.has(course.courseId));
  const totalItems = purchasedProgress.reduce((sum, course) => sum + course.total, 0);
  const completedItems = purchasedProgress.reduce((sum, course) => sum + course.completed, 0);
  const overallPercent = totalItems === 0 ? 0 : Math.round((completedItems / totalItems) * 100);
  const daysInactive = user?.lastActiveDate ? daysBetween(user.lastActiveDate, now) : 99;
  const streak = user?.streakCount ?? 0;

  const scoreResult = calculateRetentionHealth({
    daysInactive,
    overallPercent,
    streak,
    recentPassedSubmissions,
    recentQuizAttempts,
    badges: badgesCount,
  });
  const healthScore = hasPurchasedCourse ? scoreResult.score : 0;
  const riskLevel: RiskLevel = hasPurchasedCourse ? scoreResult.riskLevel : 'NOT_STARTED';

  const focusCourse =
    purchasedProgress.find((course) => course.completed > 0 && course.percent < 100) ??
    purchasedProgress.find((course) => course.percent < 100) ??
    purchasedProgress[0] ??
    null;

  const missions: RetentionMission[] = [];

  if (!hasPurchasedCourse) {
    missions.push({
      id: 'course-start',
      itemId: null,
      type: 'COURSE',
      title: 'Chọn khoá học đầu tiên',
      description: 'Bạn chưa mua khoá nào. Hãy chọn một khoá để hệ thống bắt đầu tính tiến độ, streak và nhiệm vụ giữ nhịp.',
      points: 0,
      minutes: 3,
      ctaLabel: 'Xem khoá học',
      ctaHref: '/courses',
    });
  } else if (focusCourse) {
    const course = await prisma.course.findUnique({
      where: { id: focusCourse.courseId },
      include: {
        lessons: {
          orderBy: { order: 'asc' },
          include: {
            exercises: { orderBy: { order: 'asc' } },
            quiz: { select: { id: true, title: true } },
          },
        },
      },
    });

    if (course) {
      const nextLesson = course.lessons.find((lesson) => !completedItemIds.has(lesson.id));
      if (nextLesson) {
        missions.push({
          id: `lesson-${nextLesson.id}`,
          itemId: nextLesson.id,
          type: 'LESSON',
          title: `Học tiếp: ${nextLesson.title}`,
          description: `${course.title} - hoàn thành một bài học để tăng tiến độ và giữ nhịp.`,
          points: 10,
          minutes: 12,
          ctaLabel: 'Vào bài học',
          ctaHref: `/lessons/${nextLesson.id}`,
        });
      }

      const nextExercise = course.lessons
        .flatMap((lesson) => lesson.exercises.map((exercise) => ({ ...exercise, lessonTitle: lesson.title })))
        .find((exercise) => !completedItemIds.has(exercise.id));
      if (nextExercise) {
        missions.push({
          id: `exercise-${nextExercise.id}`,
          itemId: nextExercise.id,
          type: 'EXERCISE',
          title: `Luyện bài: ${nextExercise.title}`,
          description: `${nextExercise.lessonTitle} - nộp bài pass để cộng mạnh vào ranking.`,
          points: 30,
          minutes: 18,
          ctaLabel: 'Làm bài tập',
          ctaHref: `/exercises/${nextExercise.id}`,
        });
      }

      const nextQuiz = course.lessons
        .map((lesson) => ({ lessonId: lesson.id, lessonTitle: lesson.title, quiz: lesson.quiz }))
        .find((row) => row.quiz && !completedItemIds.has(row.quiz.id));
      if (nextQuiz?.quiz) {
        missions.push({
          id: `quiz-${nextQuiz.quiz.id}`,
          itemId: nextQuiz.quiz.id,
          type: 'QUIZ',
          title: `Quiz nhanh: ${nextQuiz.quiz.title}`,
          description: `${nextQuiz.lessonTitle} - kiểm tra kiến thức để mở thêm điểm thi đua.`,
          points: 20,
          minutes: 8,
          ctaLabel: 'Làm quiz',
          ctaHref: `/lessons/${nextQuiz.lessonId}/quiz`,
        });
      }
    }
  }

  if (hasPurchasedCourse) {
    for (const contest of eligibleContests) {
      const bestReward = contest.rewards[0];
      missions.push({
        id: `contest-${contest.id}`,
        itemId: contest.id,
        type: 'CONTEST',
        title: `Bứt tốc: ${contest.title}`,
        description: bestReward
          ? `Top ${bestReward.rankFrom === bestReward.rankTo ? bestReward.rankFrom : `${bestReward.rankFrom}-${bestReward.rankTo}`} đang có ${bestReward.title}.`
          : 'Mùa thi đang mở, điểm học hôm nay sẽ được tính vào ranking.',
        points: 50,
        minutes: contest.durationMinutes,
        ctaLabel: 'Vào mùa thi',
        ctaHref: `/contests/${contest.slug}`,
      });
    }
  }

  const prioritizedMissions = missions
    .sort((a, b) => {
      const typeWeight: Record<MissionType, number> = { COURSE: 0, LESSON: 1, QUIZ: 2, EXERCISE: 3, CONTEST: 4 };
      return typeWeight[a.type] - typeWeight[b.type] || a.minutes - b.minutes;
    })
    .slice(0, 4);

  const incentives = eligibleContests.flatMap((contest) =>
    contest.rewards
      .filter((reward) => hasPurchasedCourse || reward.rewardType !== 'TUITION_REFUND')
      .slice(0, 3)
      .map((reward) => ({
        id: `${contest.id}-${reward.id}`,
        contestTitle: contest.title,
        title: reward.title,
        description: reward.description,
        rewardType: reward.rewardType,
        rankFrom: reward.rankFrom,
        rankTo: reward.rankTo,
        percentOff: reward.percentOff,
        valueVnd: reward.valueVnd,
        ctaHref: `/contests/${contest.slug}`,
      })),
  );

  const intervention =
    hasPurchasedCourse && options.ensureIntervention !== false
      ? await ensureLearningIntervention({
          userId,
          healthScore,
          riskLevel,
          reasons: scoreResult.reasons,
          missions: prioritizedMissions,
        })
      : null;

  return {
    healthScore,
    riskLevel,
    riskLabel: riskLabel(riskLevel),
    riskMessage: riskMessage(riskLevel),
    scoreFormula: {
      version: scoreResult.formulaVersion,
      factors: hasPurchasedCourse ? scoreResult.factors : [],
      reasons: hasPurchasedCourse
        ? scoreResult.reasons
        : ['Chỉ bắt đầu tính điểm sau khi học viên mua khóa học.'],
    },
    focusCourse,
    metrics: {
      completedItems,
      totalItems,
      overallPercent,
      streak,
      daysInactive,
      badges: badgesCount,
      activeContestCount: eligibleContests.length,
      recentPassedSubmissions,
      recentQuizAttempts,
    },
    rescueOffer: {
      title:
        riskLevel === 'NOT_STARTED'
          ? 'Bắt đầu để mở giữ nhịp'
          : riskLevel === 'ON_TRACK'
          ? 'Giữ top bằng nhiệm vụ ngắn'
          : 'Gói cứu nhịp 48 giờ',
      description:
        riskLevel === 'NOT_STARTED'
          ? 'Sau khi mua khoá, hệ thống sẽ theo dõi tiến độ thật và đề xuất nhiệm vụ học mỗi ngày.'
          : riskLevel === 'ON_TRACK'
          ? 'Hoàn thành đều nhiệm vụ nhỏ để tích điểm ranking và giữ cơ hội nhận thưởng.'
          : 'Hoàn thành 3 nhiệm vụ ngắn trong 48 giờ để quay lại lộ trình và đủ điều kiện nhận ưu đãi thi đua.',
      target:
        intervention?.targetMissions ??
        (riskLevel === 'NOT_STARTED' ? 1 : riskLevel === 'AT_RISK' ? 3 : 2),
      current: intervention?.completedMissions ?? 0,
    },
    intervention,
    missions: prioritizedMissions,
    incentives,
  };
}
