-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('SYSTEM', 'PAYMENT', 'REWARD', 'CONTEST', 'RETENTION', 'BADGE');

-- CreateEnum
CREATE TYPE "InterventionStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "InterventionSource" AS ENUM ('SYSTEM', 'ADMIN');

-- AlterTable
ALTER TABLE "Submission"
ADD COLUMN "errorCategory" TEXT,
ADD COLUMN "errorFingerprint" TEXT,
ADD COLUMN "errorSummary" TEXT;

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL DEFAULT 'SYSTEM',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "href" TEXT,
    "metadata" JSONB,
    "dedupeKey" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationPreference" (
    "userId" TEXT NOT NULL,
    "emailPayments" BOOLEAN NOT NULL DEFAULT true,
    "emailRewards" BOOLEAN NOT NULL DEFAULT true,
    "emailContests" BOOLEAN NOT NULL DEFAULT false,
    "emailRetention" BOOLEAN NOT NULL DEFAULT true,
    "emailBadges" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "LearningIntervention" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdById" TEXT,
    "source" "InterventionSource" NOT NULL DEFAULT 'SYSTEM',
    "status" "InterventionStatus" NOT NULL DEFAULT 'ACTIVE',
    "reason" TEXT NOT NULL,
    "reasonFactors" JSONB NOT NULL,
    "baselineHealthScore" INTEGER NOT NULL,
    "targetMissions" INTEGER NOT NULL,
    "completedMissions" INTEGER NOT NULL DEFAULT 0,
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "outcome" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningIntervention_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterventionMission" (
    "id" TEXT NOT NULL,
    "interventionId" TEXT NOT NULL,
    "missionKey" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "itemId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "ctaHref" TEXT NOT NULL,
    "estimatedMinutes" INTEGER NOT NULL,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InterventionMission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Notification_userId_dedupeKey_key" ON "Notification"("userId", "dedupeKey");

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_createdAt_idx" ON "Notification"("userId", "readAt", "createdAt");

-- CreateIndex
CREATE INDEX "LearningIntervention_userId_status_createdAt_idx" ON "LearningIntervention"("userId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "LearningIntervention_createdById_idx" ON "LearningIntervention"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "InterventionMission_interventionId_missionKey_key" ON "InterventionMission"("interventionId", "missionKey");

-- CreateIndex
CREATE INDEX "InterventionMission_interventionId_completedAt_idx" ON "InterventionMission"("interventionId", "completedAt");

-- CreateIndex
CREATE INDEX "InterventionMission_itemId_idx" ON "InterventionMission"("itemId");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationPreference" ADD CONSTRAINT "NotificationPreference_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningIntervention" ADD CONSTRAINT "LearningIntervention_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningIntervention" ADD CONSTRAINT "LearningIntervention_createdById_fkey"
FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterventionMission" ADD CONSTRAINT "InterventionMission_interventionId_fkey"
FOREIGN KEY ("interventionId") REFERENCES "LearningIntervention"("id") ON DELETE CASCADE ON UPDATE CASCADE;
