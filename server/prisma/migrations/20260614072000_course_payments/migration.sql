-- CreateEnum
CREATE TYPE "PurchaseStatus" AS ENUM ('PENDING', 'PAID');

-- AlterTable
ALTER TABLE "Course" ADD COLUMN "priceVnd" INTEGER NOT NULL DEFAULT 199000;

-- CreateTable
CREATE TABLE "CoursePurchase" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "status" "PurchaseStatus" NOT NULL DEFAULT 'PENDING',
    "amountVnd" INTEGER NOT NULL,
    "paymentCode" TEXT NOT NULL,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoursePurchase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CoursePurchase_paymentCode_key" ON "CoursePurchase"("paymentCode");

-- CreateIndex
CREATE UNIQUE INDEX "CoursePurchase_userId_courseId_key" ON "CoursePurchase"("userId", "courseId");

-- CreateIndex
CREATE INDEX "CoursePurchase_userId_idx" ON "CoursePurchase"("userId");

-- CreateIndex
CREATE INDEX "CoursePurchase_courseId_idx" ON "CoursePurchase"("courseId");

-- CreateIndex
CREATE INDEX "CoursePurchase_status_idx" ON "CoursePurchase"("status");

-- AddForeignKey
ALTER TABLE "CoursePurchase" ADD CONSTRAINT "CoursePurchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoursePurchase" ADD CONSTRAINT "CoursePurchase_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
