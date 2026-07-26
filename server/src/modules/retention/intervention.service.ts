import { Prisma, type InterventionSource } from '@prisma/client';
import { prisma } from '../../db/prisma.js';
import { AppError } from '../../utils/AppError.js';
import { createNotification } from '../notification/notification.service.js';

export interface InterventionMissionInput {
  id: string;
  itemId: string | null;
  type: string;
  title: string;
  description: string;
  minutes: number;
  ctaHref: string;
}

function findIntervention(id: string) {
  return prisma.learningIntervention.findUnique({
    where: { id },
    include: { missions: { orderBy: { createdAt: 'asc' } } },
  });
}

type InterventionRow = NonNullable<Awaited<ReturnType<typeof findIntervention>>>;

function toView(intervention: InterventionRow | null) {
  if (!intervention) return null;
  return {
    id: intervention.id,
    source: intervention.source,
    status: intervention.status,
    reason: intervention.reason,
    reasonFactors: intervention.reasonFactors,
    baselineHealthScore: intervention.baselineHealthScore,
    targetMissions: intervention.targetMissions,
    completedMissions: intervention.completedMissions,
    startsAt: intervention.startsAt,
    dueAt: intervention.dueAt,
    completedAt: intervention.completedAt,
    outcome: intervention.outcome,
    missions: intervention.missions,
  };
}

async function syncProgress(interventionId: string, currentHealthScore: number) {
  const intervention = await findIntervention(interventionId);
  if (!intervention || intervention.status !== 'ACTIVE') return intervention;

  const itemIds = intervention.missions
    .map((mission) => mission.itemId)
    .filter((itemId): itemId is string => Boolean(itemId));
  const [completedProgress, contestAttempts] = await Promise.all([
    prisma.progress.findMany({
      where: {
        userId: intervention.userId,
        completed: true,
        completedAt: { gte: intervention.startsAt },
        itemId: { in: itemIds },
      },
      select: { itemId: true, completedAt: true },
    }),
    prisma.contestAttempt.findMany({
      where: {
        userId: intervention.userId,
        contestId: { in: itemIds },
        status: 'SUBMITTED',
        submittedAt: { gte: intervention.startsAt },
      },
      select: { contestId: true, submittedAt: true },
    }),
  ]);
  const completedAtByItem = new Map<string, Date>();
  for (const progress of completedProgress) {
    completedAtByItem.set(progress.itemId, progress.completedAt ?? new Date());
  }
  for (const attempt of contestAttempts) {
    completedAtByItem.set(attempt.contestId, attempt.submittedAt ?? new Date());
  }

  const newlyCompleted = intervention.missions.filter(
    (mission) => !mission.completedAt && mission.itemId && completedAtByItem.has(mission.itemId),
  );
  if (newlyCompleted.length > 0) {
    await Promise.all(
      newlyCompleted.map((mission) =>
        prisma.interventionMission.update({
          where: { id: mission.id },
          data: { completedAt: completedAtByItem.get(mission.itemId!) },
        }),
      ),
    );
  }

  const completedMissions =
    intervention.missions.filter((mission) => mission.completedAt).length + newlyCompleted.length;
  const now = new Date();
  const completed = completedMissions >= intervention.targetMissions;
  const expired = !completed && intervention.dueAt < now;
  if (completed || expired || completedMissions !== intervention.completedMissions) {
    const outcome = {
      completedMissions,
      targetMissions: intervention.targetMissions,
      completionRate: Math.round((completedMissions / intervention.missions.length) * 100),
      healthScoreAfter: currentHealthScore,
      scoreDelta: currentHealthScore - intervention.baselineHealthScore,
      elapsedHours: Math.max(
        0,
        Math.round((now.getTime() - intervention.startsAt.getTime()) / 3600000),
      ),
    } satisfies Prisma.InputJsonValue;
    await prisma.learningIntervention.update({
      where: { id: intervention.id },
      data: {
        completedMissions,
        ...(completed
          ? { status: 'COMPLETED', completedAt: now, outcome }
          : expired
            ? { status: 'EXPIRED', outcome }
            : {}),
      },
    });

    if (completed) {
      const delta = currentHealthScore - intervention.baselineHealthScore;
      await createNotification({
        userId: intervention.userId,
        type: 'RETENTION',
        title: 'Bạn đã hoàn thành gói cứu nhịp',
        message: `Điểm giữ nhịp thay đổi ${delta >= 0 ? '+' : ''}${delta} điểm.`,
        href: '/retention',
        dedupeKey: `intervention-completed-${intervention.id}`,
      });
    }
  }
  return findIntervention(intervention.id);
}

export async function createLearningIntervention(params: {
  userId: string;
  createdById?: string | null;
  source: InterventionSource;
  healthScore: number;
  riskLevel: string;
  reasons: string[];
  missions: InterventionMissionInput[];
  force?: boolean;
}) {
  if (!params.force) {
    const existing = await prisma.learningIntervention.findFirst({
      where: { userId: params.userId, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
    });
    if (existing) {
      const synced = await syncProgress(existing.id, params.healthScore);
      if (synced?.status === 'ACTIVE') return toView(synced);
    }
  }

  const selectedMissions = params.missions.filter((mission) => mission.itemId).slice(0, 3);
  if (selectedMissions.length === 0) {
    throw AppError.badRequest('Chưa có nhiệm vụ phù hợp để tạo gói cứu nhịp.');
  }
  const targetMissions = Math.min(params.riskLevel === 'AT_RISK' ? 3 : 2, selectedMissions.length);
  const intervention = await prisma.learningIntervention.create({
    data: {
      userId: params.userId,
      createdById: params.createdById,
      source: params.source,
      reason: params.reasons.join(' '),
      reasonFactors: params.reasons,
      baselineHealthScore: params.healthScore,
      targetMissions,
      dueAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
      missions: {
        create: selectedMissions.map((mission) => ({
          missionKey: mission.id,
          itemId: mission.itemId,
          type: mission.type,
          title: mission.title,
          description: mission.description,
          ctaHref: mission.ctaHref,
          estimatedMinutes: mission.minutes,
        })),
      },
    },
    include: { missions: { orderBy: { createdAt: 'asc' } } },
  });
  await createNotification({
    userId: params.userId,
    type: 'RETENTION',
    title: params.source === 'ADMIN' ? 'Admin đã giao gói cứu nhịp' : 'Gói cứu nhịp 48 giờ đã sẵn sàng',
    message: `Hoàn thành ${targetMissions} nhiệm vụ ngắn để kéo lại nhịp học.`,
    href: '/retention',
    dedupeKey: `intervention-created-${intervention.id}`,
    sendEmail: params.source === 'ADMIN' || params.riskLevel === 'AT_RISK',
  });
  return toView(intervention);
}

export async function ensureLearningIntervention(params: {
  userId: string;
  healthScore: number;
  riskLevel: string;
  reasons: string[];
  missions: InterventionMissionInput[];
}) {
  const active = await prisma.learningIntervention.findFirst({
    where: { userId: params.userId, status: 'ACTIVE' },
    orderBy: { createdAt: 'desc' },
  });
  if (active) {
    const synced = await syncProgress(active.id, params.healthScore);
    if (synced?.status === 'ACTIVE') return toView(synced);
  }
  if (!['WATCH', 'AT_RISK'].includes(params.riskLevel)) return null;
  return createLearningIntervention({ ...params, source: 'SYSTEM' });
}

export async function getInterventionHistory(userId: string) {
  const rows = await prisma.learningIntervention.findMany({
    where: { userId },
    include: { missions: { orderBy: { createdAt: 'asc' } } },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });
  return rows.map((row) => toView(row));
}
