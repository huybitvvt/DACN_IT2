import { prisma } from '../../db/prisma.js';
import { AppError } from '../../utils/AppError.js';
import { createNotification, notifyAdmins } from '../notification/notification.service.js';

interface RewardView {
  id: string;
  rankFrom: number;
  rankTo: number;
  title: string;
  description: string;
  rewardType: string;
  valueVnd: number | null;
  percentOff: number | null;
}

interface ContestLeaderboardEntry {
  userId?: string;
  rank: number;
  displayName: string;
  score: number;
  completedItems: number;
  passedSubmissions: number;
  quizPoints: number;
  examScore: number;
  streak: number;
  badges: number;
  reward: RewardView | null;
}

function statusByDate(startsAt: Date, endsAt: Date) {
  const now = new Date();
  if (now < startsAt) return 'UPCOMING';
  if (now > endsAt) return 'FINISHED';
  return 'ACTIVE';
}

function rewardForRank(rank: number, rewards: RewardView[]) {
  return rewards.find((r) => rank >= r.rankFrom && rank <= r.rankTo) ?? null;
}

function mapRewards(rewards: RewardView[]) {
  return rewards.sort((a, b) => a.rankFrom - b.rankFrom || a.rankTo - b.rankTo);
}

async function buildLeaderboard(contest: {
  id: string;
  courseSlug: string | null;
  startsAt: Date;
  endsAt: Date;
  rewards: RewardView[];
}): Promise<ContestLeaderboardEntry[]> {
  const courseFilter = contest.courseSlug
    ? { course: { slug: contest.courseSlug } }
    : undefined;
  const exerciseCourseFilter = contest.courseSlug
    ? { exercise: { lesson: { course: { slug: contest.courseSlug } } } }
    : undefined;
  const quizCourseFilter = contest.courseSlug
    ? { quiz: { lesson: { course: { slug: contest.courseSlug } } } }
    : undefined;

  const users = await prisma.user.findMany({
    select: {
      displayName: true,
      streakCount: true,
      id: true,
      progress: {
        where: {
          completed: true,
          completedAt: { gte: contest.startsAt, lte: contest.endsAt },
          ...(courseFilter ? { course: courseFilter.course } : {}),
        },
        select: { id: true },
      },
      submissions: {
        where: {
          status: 'PASSED',
          createdAt: { gte: contest.startsAt, lte: contest.endsAt },
          ...(exerciseCourseFilter ?? {}),
        },
        select: { exerciseId: true },
      },
      quizAttempts: {
        where: {
          createdAt: { gte: contest.startsAt, lte: contest.endsAt },
          ...(quizCourseFilter ?? {}),
        },
        select: { quizId: true, score: true, total: true },
      },
      badges: {
        where: { awardedAt: { gte: contest.startsAt, lte: contest.endsAt } },
        select: { id: true },
      },
      contestAttempts: {
        where: { contestId: contest.id, status: 'SUBMITTED' },
        select: { score: true },
      },
    },
  });

  const ranked = users
    .map((u) => {
      const passedSubmissionCount = new Set(u.submissions.map((s) => s.exerciseId)).size;
      const quizBest = new Map<string, number>();
      for (const attempt of u.quizAttempts) {
        const normalized = attempt.total > 0 ? Math.round((attempt.score / attempt.total) * 20) : 0;
        quizBest.set(attempt.quizId, Math.max(quizBest.get(attempt.quizId) ?? 0, normalized));
      }
      const quizPoints = [...quizBest.values()].reduce((sum, n) => sum + n, 0);
      const completedItems = u.progress.length;
      const badges = u.badges.length;
      const examScore = u.contestAttempts.reduce((sum, attempt) => sum + attempt.score, 0);
      const score =
        completedItems * 10 +
        passedSubmissionCount * 30 +
        quizPoints +
        examScore +
        u.streakCount * 5 +
        badges * 20;

      return {
        rank: 0,
        userId: u.id,
        displayName: u.displayName,
        score,
        completedItems,
        passedSubmissions: passedSubmissionCount,
        quizPoints,
        examScore,
        streak: u.streakCount,
        badges,
        reward: null,
      };
    })
    .filter((u) => u.score > 0)
    .sort((a, b) => b.score - a.score || b.completedItems - a.completedItems)
    .slice(0, 20)
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
      reward: rewardForRank(index + 1, contest.rewards),
    }));

  return ranked;
}

export async function listContests() {
  const contests = await prisma.contest.findMany({
    include: { rewards: true },
    orderBy: [{ status: 'asc' }, { startsAt: 'desc' }],
  });

  const result = [];
  for (const c of contests) {
    const rewards = mapRewards(c.rewards);
    const leaderboard = await buildLeaderboard({
      courseSlug: c.courseSlug,
      id: c.id,
      startsAt: c.startsAt,
      endsAt: c.endsAt,
      rewards,
    });
    result.push({
      id: c.id,
      slug: c.slug,
      title: c.title,
      description: c.description,
      status: statusByDate(c.startsAt, c.endsAt),
      courseSlug: c.courseSlug,
      startsAt: c.startsAt,
      endsAt: c.endsAt,
      scoringNote: c.scoringNote,
      rewards,
      participantCount: leaderboard.length,
      topUsers: leaderboard.slice(0, 3),
    });
  }

  return result;
}

export async function getContestDetail(slug: string) {
  const contest = await prisma.contest.findUnique({
    where: { slug },
    include: { rewards: true },
  });
  if (!contest) {
    throw AppError.notFound('Không tìm thấy mùa thi đua.');
  }

  const rewards = mapRewards(contest.rewards);
  const leaderboard = await buildLeaderboard({
    courseSlug: contest.courseSlug,
    id: contest.id,
    startsAt: contest.startsAt,
    endsAt: contest.endsAt,
    rewards,
  });

  return {
    id: contest.id,
    slug: contest.slug,
    title: contest.title,
    description: contest.description,
    status: statusByDate(contest.startsAt, contest.endsAt),
    courseSlug: contest.courseSlug,
    startsAt: contest.startsAt,
    endsAt: contest.endsAt,
    scoringNote: contest.scoringNote,
    rewards,
    leaderboard: leaderboard.map(({ userId: _userId, ...entry }) => entry),
  };
}

export async function getMyContestReward(slug: string, userId: string) {
  const contest = await prisma.contest.findUnique({
    where: { slug },
    include: { rewards: true },
  });
  if (!contest) {
    throw AppError.notFound('Không tìm thấy mùa thi đua.');
  }

  const rewards = mapRewards(contest.rewards);
  const leaderboard = await buildLeaderboard({
    id: contest.id,
    courseSlug: contest.courseSlug,
    startsAt: contest.startsAt,
    endsAt: contest.endsAt,
    rewards,
  });
  const me = leaderboard.find((entry) => entry.userId === userId) ?? null;
  const claim = await prisma.rewardClaim.findFirst({
    where: { userId, contestId: contest.id },
    include: { reward: true },
    orderBy: { createdAt: 'desc' },
  });

  return {
    rank: me?.rank ?? null,
    score: me?.score ?? 0,
    reward: me?.reward ?? null,
    claim: claim
      ? {
          id: claim.id,
          status: claim.status,
          note: claim.note,
          rank: claim.rank,
          score: claim.score,
          createdAt: claim.createdAt,
          reviewedAt: claim.reviewedAt,
          reward: {
            id: claim.reward.id,
            rankFrom: claim.reward.rankFrom,
            rankTo: claim.reward.rankTo,
            title: claim.reward.title,
            description: claim.reward.description,
            rewardType: claim.reward.rewardType,
            valueVnd: claim.reward.valueVnd,
            percentOff: claim.reward.percentOff,
          },
        }
      : null,
  };
}

function activeStatus(startsAt: Date, endsAt: Date) {
  const now = new Date();
  return now >= startsAt && now <= endsAt;
}

async function getContestWithProblems(slug: string) {
  const contest = await prisma.contest.findUnique({
    where: { slug },
    include: {
      problems: {
        include: {
          exercise: { select: { id: true, lessonId: true, title: true } },
          quiz: { select: { id: true, lessonId: true, title: true } },
        },
        orderBy: { order: 'asc' },
      },
    },
  });
  if (!contest) {
    throw AppError.notFound('Không tìm thấy mùa thi đua.');
  }
  return contest;
}

function mapContestProblems(
  problems: Awaited<ReturnType<typeof getContestWithProblems>>['problems'],
) {
  return problems.map((p) => ({
    id: p.id,
    problemType: p.problemType,
    title: p.title,
    points: p.points,
    order: p.order,
    exerciseId: p.exerciseId,
    quizId: p.quizId,
    lessonId: p.exercise?.lessonId ?? p.quiz?.lessonId ?? null,
  }));
}

async function scoreAttempt(attempt: { id: string; contestId: string; userId: string; startedAt: Date; expiresAt: Date }) {
  const problems = await prisma.contestProblem.findMany({
    where: { contestId: attempt.contestId },
    orderBy: { order: 'asc' },
  });
  const scoreUntil = new Date(Math.min(Date.now(), attempt.expiresAt.getTime()));
  let score = 0;
  const maxScore = problems.reduce((sum, p) => sum + p.points, 0);
  const results = [];

  for (const problem of problems) {
    if (problem.problemType === 'EXERCISE' && problem.exerciseId) {
      const passed = await prisma.submission.findFirst({
        where: {
          userId: attempt.userId,
          exerciseId: problem.exerciseId,
          status: 'PASSED',
          createdAt: { gte: attempt.startedAt, lte: scoreUntil },
        },
        select: { id: true },
      });
      const earned = passed ? problem.points : 0;
      score += earned;
      results.push({ problemId: problem.id, earned, max: problem.points });
    }
    if (problem.problemType === 'QUIZ' && problem.quizId) {
      const attempts = await prisma.quizAttempt.findMany({
        where: {
          userId: attempt.userId,
          quizId: problem.quizId,
          createdAt: { gte: attempt.startedAt, lte: scoreUntil },
        },
        select: { score: true, total: true },
      });
      const best = attempts.reduce((max, a) => {
        if (a.total <= 0) return max;
        return Math.max(max, Math.round((a.score / a.total) * problem.points));
      }, 0);
      score += best;
      results.push({ problemId: problem.id, earned: best, max: problem.points });
    }
  }

  return { score, maxScore, results };
}

export async function getContestRoom(slug: string, userId: string) {
  const contest = await getContestWithProblems(slug);
  const attempt = await prisma.contestAttempt.findFirst({
    where: { contestId: contest.id, userId },
    orderBy: { startedAt: 'desc' },
  });

  return {
    contest: {
      id: contest.id,
      slug: contest.slug,
      title: contest.title,
      status: statusByDate(contest.startsAt, contest.endsAt),
      startsAt: contest.startsAt,
      endsAt: contest.endsAt,
      durationMinutes: contest.durationMinutes,
      canStart: activeStatus(contest.startsAt, contest.endsAt) && contest.problems.length > 0,
      problems: mapContestProblems(contest.problems),
    },
    attempt: attempt
      ? {
          id: attempt.id,
          status: attempt.status,
          startedAt: attempt.startedAt,
          expiresAt: attempt.expiresAt,
          submittedAt: attempt.submittedAt,
          score: attempt.score,
          maxScore: attempt.maxScore,
        }
      : null,
  };
}

export async function startContestAttempt(slug: string, userId: string) {
  const contest = await getContestWithProblems(slug);
  if (!activeStatus(contest.startsAt, contest.endsAt)) {
    throw AppError.badRequest('Mùa thi chưa trong thời gian làm bài.');
  }
  if (contest.problems.length === 0) {
    throw AppError.badRequest('Mùa thi chưa có đề thi.');
  }

  const current = await prisma.contestAttempt.findFirst({
    where: { contestId: contest.id, userId, status: 'IN_PROGRESS' },
    orderBy: { startedAt: 'desc' },
  });
  if (current && current.expiresAt > new Date()) return getContestRoom(slug, userId);

  if (current) {
    const scored = await scoreAttempt(current);
    await prisma.contestAttempt.update({
      where: { id: current.id },
      data: { status: 'EXPIRED', score: scored.score, maxScore: scored.maxScore, submittedAt: new Date() },
    });
  }

  const startedAt = new Date();
  const expiresAt = new Date(startedAt.getTime() + contest.durationMinutes * 60_000);
  await prisma.contestAttempt.create({
    data: {
      contestId: contest.id,
      userId,
      startedAt,
      expiresAt,
      maxScore: contest.problems.reduce((sum, p) => sum + p.points, 0),
    },
  });

  return getContestRoom(slug, userId);
}

export async function submitContestAttempt(slug: string, userId: string) {
  const contest = await getContestWithProblems(slug);
  const attempt = await prisma.contestAttempt.findFirst({
    where: { contestId: contest.id, userId, status: 'IN_PROGRESS' },
    orderBy: { startedAt: 'desc' },
  });
  if (!attempt) {
    throw AppError.badRequest('Bạn chưa có lượt thi đang mở.');
  }

  const scored = await scoreAttempt(attempt);
  const status = attempt.expiresAt < new Date() ? 'EXPIRED' : 'SUBMITTED';
  await prisma.contestAttempt.update({
    where: { id: attempt.id },
    data: {
      status,
      score: scored.score,
      maxScore: scored.maxScore,
      submittedAt: new Date(),
    },
  });

  return getContestRoom(slug, userId);
}

export async function claimContestReward(slug: string, userId: string) {
  const contest = await prisma.contest.findUnique({
    where: { slug },
    include: { rewards: true },
  });
  if (!contest) {
    throw AppError.notFound('Không tìm thấy mùa thi đua.');
  }

  const rewards = mapRewards(contest.rewards);
  const leaderboard = await buildLeaderboard({
    id: contest.id,
    courseSlug: contest.courseSlug,
    startsAt: contest.startsAt,
    endsAt: contest.endsAt,
    rewards,
  });
  const me = leaderboard.find((entry) => entry.userId === userId);
  if (!me || !me.reward) {
    throw AppError.badRequest('Bạn chưa nằm trong nhóm đủ điều kiện nhận thưởng của mùa thi này.');
  }

  const claim = await prisma.rewardClaim.upsert({
    where: {
      userId_contestId_rewardId: {
        userId,
        contestId: contest.id,
        rewardId: me.reward.id,
      },
    },
    update: {
      rank: me.rank,
      score: me.score,
      status: 'PENDING',
      reviewedAt: null,
      note: '',
    },
    create: {
      userId,
      contestId: contest.id,
      rewardId: me.reward.id,
      rank: me.rank,
      score: me.score,
    },
    include: { reward: true },
  });

  await Promise.all([
    createNotification({
      userId,
      type: 'REWARD',
      title: 'Đã gửi yêu cầu nhận thưởng',
      message: `Yêu cầu nhận ${claim.reward.title} đang chờ admin duyệt.`,
      href: `/contests/${contest.slug}`,
      dedupeKey: `reward-claim-confirmation-${claim.id}-${claim.updatedAt.toISOString()}`,
    }),
    notifyAdmins({
      type: 'REWARD',
      title: 'Yêu cầu nhận thưởng mới',
      message: `Có học viên hạng #${me.rank} yêu cầu nhận ${claim.reward.title} trong ${contest.title}.`,
      href: '/admin/contests',
      dedupeKey: `reward-claim-admin-${claim.id}-${claim.updatedAt.toISOString()}`,
    }),
  ]);

  return {
    id: claim.id,
    status: claim.status,
    note: claim.note,
    rank: claim.rank,
    score: claim.score,
    createdAt: claim.createdAt,
    reviewedAt: claim.reviewedAt,
    reward: {
      id: claim.reward.id,
      rankFrom: claim.reward.rankFrom,
      rankTo: claim.reward.rankTo,
      title: claim.reward.title,
      description: claim.reward.description,
      rewardType: claim.reward.rewardType,
      valueVnd: claim.reward.valueVnd,
      percentOff: claim.reward.percentOff,
    },
  };
}
