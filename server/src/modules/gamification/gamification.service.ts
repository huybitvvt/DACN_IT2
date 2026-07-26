import { prisma } from '../../db/prisma.js';
import { computeStreak } from './streak.js';
import { getProgressOverview } from '../progress/progress.service.js';
import { createNotification } from '../notification/notification.service.js';

// Cập nhật streak khi người dùng có hoạt động học tập.
export async function recordActivity(userId: string, now = new Date()): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { streakCount: true, lastActiveDate: true },
  });
  if (!user) return;

  const next = computeStreak(
    { streakCount: user.streakCount, lastActiveDate: user.lastActiveDate },
    now,
  );

  await prisma.user.update({
    where: { id: userId },
    data: { streakCount: next.streakCount, lastActiveDate: next.lastActiveDate },
  });
}

// Trao một huy hiệu cho người dùng (bỏ qua nếu đã có).
export async function awardBadge(userId: string, badgeCode: string): Promise<void> {
  const badge = await prisma.badge.findUnique({ where: { code: badgeCode } });
  if (!badge) return;

  const existing = await prisma.userBadge.findUnique({
    where: { userId_badgeId: { userId, badgeId: badge.id } },
  });
  if (existing) return;

  await prisma.userBadge.create({ data: { userId, badgeId: badge.id } });
  await createNotification({
    userId,
    type: 'BADGE',
    title: 'Bạn vừa nhận huy hiệu mới',
    message: `${badge.title}: ${badge.description}`,
    href: '/dashboard',
    dedupeKey: `badge-${badge.id}`,
    sendEmail: true,
  });
}

// Kiểm tra & trao các huy hiệu dựa trên tiến độ hiện tại.
export async function checkAndAwardBadges(userId: string): Promise<void> {
  // FIRST_LESSON / FIRST_EXERCISE
  const [lessonDone, exerciseDone] = await Promise.all([
    prisma.progress.count({ where: { userId, itemType: 'LESSON', completed: true } }),
    prisma.progress.count({ where: { userId, itemType: 'EXERCISE', completed: true } }),
  ]);
  if (lessonDone > 0) await awardBadge(userId, 'FIRST_LESSON');
  if (exerciseDone > 0) await awardBadge(userId, 'FIRST_EXERCISE');

  // COURSE_COMPLETE: có ít nhất một khoá đạt 100%.
  const overview = await getProgressOverview(userId);
  if (overview.some((c) => c.total > 0 && c.percent === 100)) {
    await awardBadge(userId, 'COURSE_COMPLETE');
  }

  // STREAK_7
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { streakCount: true },
  });
  if (user && user.streakCount >= 7) {
    await awardBadge(userId, 'STREAK_7');
  }
}

// Gọi sau mỗi hoạt động học tập: cập nhật streak + kiểm tra huy hiệu.
export async function onLearningActivity(userId: string): Promise<void> {
  await recordActivity(userId);
  await checkAndAwardBadges(userId);
}

// Dữ liệu gamification để hiển thị trên dashboard.
export async function getGamificationData(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { streakCount: true },
  });
  const userBadges = await prisma.userBadge.findMany({
    where: { userId },
    include: { badge: true },
    orderBy: { awardedAt: 'desc' },
  });

  return {
    streakCount: user?.streakCount ?? 0,
    badges: userBadges.map((ub) => ({
      code: ub.badge.code,
      title: ub.badge.title,
      description: ub.badge.description,
      awardedAt: ub.awardedAt,
    })),
  };
}
