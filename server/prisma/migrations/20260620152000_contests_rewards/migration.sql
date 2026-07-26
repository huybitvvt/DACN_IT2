-- CreateEnum
CREATE TYPE "ContestStatus" AS ENUM ('UPCOMING', 'ACTIVE', 'FINISHED');

-- CreateEnum
CREATE TYPE "ContestRewardType" AS ENUM ('TUITION_REFUND', 'VOUCHER', 'BADGE', 'UNLOCK');

-- CreateTable
CREATE TABLE "Contest" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "ContestStatus" NOT NULL DEFAULT 'ACTIVE',
    "courseSlug" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "scoringNote" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContestReward" (
    "id" TEXT NOT NULL,
    "contestId" TEXT NOT NULL,
    "rankFrom" INTEGER NOT NULL,
    "rankTo" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "rewardType" "ContestRewardType" NOT NULL,
    "valueVnd" INTEGER,
    "percentOff" INTEGER,

    CONSTRAINT "ContestReward_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Contest_slug_key" ON "Contest"("slug");

-- CreateIndex
CREATE INDEX "Contest_status_startsAt_endsAt_idx" ON "Contest"("status", "startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "Contest_courseSlug_idx" ON "Contest"("courseSlug");

-- CreateIndex
CREATE INDEX "ContestReward_contestId_idx" ON "ContestReward"("contestId");

-- AddForeignKey
ALTER TABLE "ContestReward" ADD CONSTRAINT "ContestReward_contestId_fkey" FOREIGN KEY ("contestId") REFERENCES "Contest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
