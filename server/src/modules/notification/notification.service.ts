import { Prisma, type NotificationType } from '@prisma/client';
import { prisma } from '../../db/prisma.js';
import { env } from '../../config/env.js';
import { sendNotificationEmail } from '../../services/email.js';
import { AppError } from '../../utils/AppError.js';

type EmailPreference =
  | 'emailPayments'
  | 'emailRewards'
  | 'emailContests'
  | 'emailRetention'
  | 'emailBadges';

const preferenceByType: Partial<Record<NotificationType, EmailPreference>> = {
  PAYMENT: 'emailPayments',
  REWARD: 'emailRewards',
  CONTEST: 'emailContests',
  RETENTION: 'emailRetention',
  BADGE: 'emailBadges',
};

function isDuplicate(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

function dateKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function daysBetween(start: Date, end: Date) {
  const startDay = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());
  const endDay = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate());
  return Math.max(0, Math.floor((endDay - startDay) / 86400000));
}

async function deliverEmail(params: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  href?: string | null;
}) {
  const preferenceKey = preferenceByType[params.type];
  if (!preferenceKey) return;

  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: {
      email: true,
      displayName: true,
      notificationPreference: true,
    },
  });
  if (!user) return;

  const enabled = user.notificationPreference?.[preferenceKey] ?? true;
  if (!enabled) return;

  const actionUrl = new URL(params.href || '/notifications', env.clientOrigin).toString();
  await sendNotificationEmail({
    to: user.email,
    displayName: user.displayName,
    subject: params.title,
    message: params.message,
    actionUrl,
    buttonText: 'Mở CodeLearn',
  });
}

export async function createNotification(params: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  href?: string | null;
  metadata?: Prisma.InputJsonValue;
  dedupeKey?: string | null;
  sendEmail?: boolean;
}) {
  let notification;
  let wasCreated = true;
  try {
    notification = await prisma.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        href: params.href,
        metadata: params.metadata,
        dedupeKey: params.dedupeKey,
      },
    });
  } catch (error) {
    if (!isDuplicate(error) || !params.dedupeKey) throw error;
    wasCreated = false;
    notification = await prisma.notification.findUnique({
      where: {
        userId_dedupeKey: {
          userId: params.userId,
          dedupeKey: params.dedupeKey,
        },
      },
    });
  }

  if (params.sendEmail && notification && wasCreated) {
    void deliverEmail(params).catch((error) => {
      console.error('[notification-email] Không gửi được email thông báo:', error);
    });
  }
  return notification;
}

export async function notifyAdmins(params: {
  type: NotificationType;
  title: string;
  message: string;
  href?: string | null;
  dedupeKey: string;
}) {
  const admins = await prisma.user.findMany({
    where: { role: 'ADMIN' },
    select: { id: true },
  });
  await Promise.all(
    admins.map((admin) =>
      createNotification({
        ...params,
        userId: admin.id,
      }),
    ),
  );
}

export async function syncUserNotifications(userId: string) {
  const now = new Date();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      streakCount: true,
      lastActiveDate: true,
      purchases: {
        where: { status: 'PAID' },
        select: { course: { select: { slug: true } } },
      },
    },
  });
  if (!user) return;

  if (user.role === 'ADMIN') {
    const pendingClaims = await prisma.rewardClaim.count({ where: { status: 'PENDING' } });
    if (pendingClaims > 0) {
      await createNotification({
        userId,
        type: 'REWARD',
        title: 'Có yêu cầu nhận thưởng chờ duyệt',
        message: `${pendingClaims} yêu cầu đang chờ admin kiểm tra.`,
        href: '/admin/contests',
        dedupeKey: `admin-pending-rewards-${dateKey(now)}`,
      });
    }
    return;
  }

  if (user.purchases.length === 0) return;
  const daysInactive = user.lastActiveDate ? daysBetween(user.lastActiveDate, now) : 99;
  if (daysInactive >= 2) {
    await createNotification({
      userId,
      type: 'RETENTION',
      title: daysInactive >= 7 ? 'Gói cứu nhịp đang chờ bạn' : 'Đừng để mất nhịp học hôm nay',
      message:
        daysInactive >= 7
          ? `Bạn đã ${daysInactive} ngày chưa học. Hệ thống đã chuẩn bị một nhiệm vụ ngắn để quay lại.`
          : `Bạn đã ${daysInactive} ngày chưa học. Hoàn thành một nhiệm vụ ngắn để giữ streak.`,
      href: '/retention',
      dedupeKey: `retention-reminder-${dateKey(now)}`,
      sendEmail: daysInactive >= 7,
    });
  }

  const courseSlugs = user.purchases.map((purchase) => purchase.course.slug);
  const nextDay = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const contests = await prisma.contest.findMany({
    where: {
      OR: [
        { startsAt: { gte: now, lte: nextDay } },
        { startsAt: { lte: now }, endsAt: { gte: now, lte: nextDay } },
      ],
      AND: [{ OR: [{ courseSlug: null }, { courseSlug: { in: courseSlugs } }] }],
    },
    select: { id: true, slug: true, title: true, startsAt: true, endsAt: true },
    take: 3,
  });
  for (const contest of contests) {
    const isUpcoming = contest.startsAt > now;
    await createNotification({
      userId,
      type: 'CONTEST',
      title: isUpcoming ? 'Mùa thi sắp bắt đầu' : 'Mùa thi sắp kết thúc',
      message: `${contest.title} ${isUpcoming ? 'sẽ bắt đầu' : 'sẽ kết thúc'} trong vòng 24 giờ.`,
      href: `/contests/${contest.slug}`,
      dedupeKey: `contest-${isUpcoming ? 'start' : 'end'}-${contest.id}`,
    });
  }
}

export async function listNotifications(userId: string, limit = 30) {
  await syncUserNotifications(userId);
  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: Math.min(Math.max(limit, 1), 100),
    }),
    prisma.notification.count({ where: { userId, readAt: null } }),
  ]);
  return { notifications, unreadCount };
}

export async function markNotificationRead(userId: string, id: string) {
  const notification = await prisma.notification.findFirst({ where: { id, userId } });
  if (!notification) throw AppError.notFound('Không tìm thấy thông báo.');
  return prisma.notification.update({
    where: { id },
    data: { readAt: notification.readAt ?? new Date() },
  });
}

export async function markAllNotificationsRead(userId: string) {
  await prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
  return { success: true };
}

export async function getNotificationPreferences(userId: string) {
  return prisma.notificationPreference.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });
}

export async function updateNotificationPreferences(
  userId: string,
  input: {
    emailPayments: boolean;
    emailRewards: boolean;
    emailContests: boolean;
    emailRetention: boolean;
    emailBadges: boolean;
  },
) {
  return prisma.notificationPreference.upsert({
    where: { userId },
    update: input,
    create: { userId, ...input },
  });
}
