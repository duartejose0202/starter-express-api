-- CreateTable
CREATE TABLE "SuperAdminCharges" (
    "id" UUID NOT NULL,
    "amount" INTEGER,
    "amount_origin" INTEGER,
    "currency" TEXT,
    "status" TEXT,
    "transactionId" TEXT,
    "created_at_unix" BIGINT,
    "customerId" TEXT,
    "email" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "chargeId" TEXT,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SuperAdminCharges_pkey" PRIMARY KEY ("id")
);


-- CreateIndex
CREATE UNIQUE INDEX "SuperAdminCharges_chargeId_key" ON "SuperAdminCharges"("chargeId");