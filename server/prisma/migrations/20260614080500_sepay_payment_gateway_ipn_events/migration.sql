CREATE TABLE "SepayPaymentGatewayIpnEvent" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "invoiceNumber" TEXT,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SepayPaymentGatewayIpnEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SepayPaymentGatewayIpnEvent_transactionId_key" ON "SepayPaymentGatewayIpnEvent"("transactionId");

CREATE INDEX "SepayPaymentGatewayIpnEvent_invoiceNumber_idx" ON "SepayPaymentGatewayIpnEvent"("invoiceNumber");
