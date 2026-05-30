import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { prisma } from '../../db/prisma.js';

// GET /api/leaderboard — top tài khoản theo số mục hoàn thành + streak.
export const getLeaderboard = asyncHandler(async (_req: Request, res: Response) => {
  // Lấy mọi tài khoản có hoạt động. Admin vẫn có thể học thử khi demo nên cũng
  // được xếp hạng nếu có tiến độ/streak/huy hiệu.
  const users = await prisma.user.findMany({
    select: {
      id: true,
      displayName: true,
      streakCount: true,
      progress: { where: { completed: true }, select: { id: true } },
      badges: { select: { id: true } },
    },
  });

  // Điểm = số mục hoàn thành * 10 + streak * 5 + huy hiệu * 20.
  const ranked = users
    .map((u) => ({
      displayName: u.displayName,
      completed: u.progress.length,
      badges: u.badges.length,
      streak: u.streakCount,
      score: u.progress.length * 10 + u.streakCount * 5 + u.badges.length * 20,
    }))
    .filter((u) => u.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);

  res.json({ leaderboard: ranked });
});
