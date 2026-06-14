-- CreateTable
CREATE TABLE "SepayWebhookEvent" (
    "id" TEXT NOT NULL,
    "sepayId" INTEGER NOT NULL,
    "paymentCode" TEXT,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SepayWebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SepayWebhookEvent_sepayId_key" ON "SepayWebhookEvent"("sepayId");

-- CreateIndex
CREATE INDEX "SepayWebhookEvent_paymentCode_idx" ON "SepayWebhookEvent"("paymentCode");
