-- CreateTable
CREATE TABLE "SuperAdminFees" (
    "id" UUID NOT NULL,
    "userId" TEXT,
    "feeId" TEXT,
    "amount" INTEGER,
    "amount_origin" INTEGER,
    "currency" TEXT,
    "status" TEXT,
    "transactionId" TEXT,
    "chargeId" TEXT,
    "created_at_unix" BIGINT,
    "date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SuperAdminFees_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SuperAdminFees_feeId_key" ON "SuperAdminFees"("feeId");
