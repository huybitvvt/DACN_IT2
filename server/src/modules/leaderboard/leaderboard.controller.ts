import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { prisma } from '../../db/prisma.js';
import { calculateCompetitionScore } from '../contest/competition-score.js';

async function buildRollingLeaderboard() {
  const now = new Date();
  const since = new Date(now.getTime() - 30 * 86_400_000);
  const users = await prisma.user.findMany({
    where: { role: 'LEARNER', purchases: { some: { status: 'PAID' } } },
    select: {
      displayName: true,
      progress: {
        where: { completed: true, completedAt: { gte: since } },
        select: { itemType: true, completedAt: true },
      },
      submissions: {
        where: { status: 'PASSED', createdAt: { gte: since } },
        select: { exerciseId: true, createdAt: true },
      },
      quizAttempts: {
        where: { createdAt: { gte: since } },
        select: { quizId: true, score: true, total: true, createdAt: true },
      },
    },
  });

  const ranked = users
    .map((user) => {
      const completedLessons = user.progress.filter((item) => item.itemType === 'LESSON').length;
      const passedExercises = new Set(user.submissions.map((item) => item.exerciseId)).size;
      const quizBest = new Map<string, number>();
      for (const attempt of user.quizAttempts) {
        if (attempt.total <= 0) continue;
        const percent = Math.round((attempt.score / attempt.total) * 100);
        quizBest.set(attempt.quizId, Math.max(quizBest.get(attempt.quizId) ?? 0, percent));
      }
      const activeDates = new Set(
        [
          ...user.progress.flatMap((item) => (item.completedAt ? [item.completedAt] : [])),
          ...user.submissions.map((item) => item.createdAt),
          ...user.quizAttempts.map((item) => item.createdAt),
        ].map((date) => date.toISOString().slice(0, 10)),
      );
      const result = calculateCompetitionScore({
        completedLessons,
        passedExercises,
        quizBestPercents: [...quizBest.values()],
        examEarned: 0,
        examMax: 0,
        activeDays: activeDates.size,
        targetActiveDays: 12,
      });

      return {
        displayName: user.displayName,
        completed: completedLessons,
        passedExercises,
        quizPoints: result.breakdown.quizzes,
        activeDays: activeDates.size,
        score: result.score,
        formulaVersion: result.formulaVersion,
      };
    })
    .filter((user) => user.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.passedExercises - a.passedExercises ||
        b.quizPoints - a.quizPoints ||
        b.activeDays - a.activeDays,
    )
    .slice(0, 100);

  return {
    leaderboard: ranked,
    period: { days: 30, startsAt: since, endsAt: now },
  };
}

type RollingLeaderboard = Awaited<ReturnType<typeof buildRollingLeaderboard>>;
let leaderboardCache:
  | { expiresAt: number; value: Promise<RollingLeaderboard> }
  | undefined;

function getCachedLeaderboard() {
  if (leaderboardCache && leaderboardCache.expiresAt > Date.now()) {
    return leaderboardCache.value;
  }

  const value = buildRollingLeaderboard().catch((error) => {
    leaderboardCache = undefined;
    throw error;
  });
  leaderboardCache = { expiresAt: Date.now() + 5_000, value };
  return value;
}

// GET /api/leaderboard — giải học tập cuốn chiếu 30 ngày.
export const getLeaderboard = asyncHandler(async (_req: Request, res: Response) => {
  res.json(await getCachedLeaderboard());
});
