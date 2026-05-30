import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { prisma } from '../../db/prisma.js';

// GET /api/leaderboard — top người học theo số mục hoàn thành + streak.
export const getLeaderboard = asyncHandler(async (_req: Request, res: Response) => {
  // Lấy người dùng LEARNER kèm số item đã hoàn thành và số huy hiệu.
  const users = await prisma.user.findMany({
    where: { role: 'LEARNER' },
    select: {
      id: true,
      displayName: true,
      streakCount: true,
      _count: {
        select: {
          progress: true,
          badges: true,
        },
      },
    },
  });

  // Điểm = số mục hoàn thành * 10 + streak * 5 + huy hiệu * 20.
  const ranked = users
    .map((u) => ({
      displayName: u.displayName,
      completed: u._count.progress,
      badges: u._count.badges,
      streak: u.streakCount,
      score: u._count.progress * 10 + u.streakCount * 5 + u._count.badges * 20,
    }))
    .filter((u) => u.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);

  res.json({ leaderboard: ranked });
});
