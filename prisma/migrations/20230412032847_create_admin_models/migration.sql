-- CreateTable
CREATE TABLE "AdminCharges" (
    "id" UUID NOT NULL,
    "userId" TEXT,
    "amount" INTEGER,
    "amount_origin" INTEGER,
    "currency" TEXT,
    "status" TEXT,
    "transactionId" TEXT,
    "created_at_unix" BIGINT,
    "chargeId" TEXT,
    "applicationId" TEXT,
    "invoice" TEXT,
    "customerEmail" TEXT,
    "customerId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "disputed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminCharges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminCustomers" (
    "id" UUID NOT NULL,
    "userId" TEXT,
    "customerId" TEXT,
    "created_at_unix" BIGINT,
    "balance" INTEGER,
    "email" VARCHAR(255),
    "name" VARCHAR(255),
    "date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminCustomers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminSubscriptions" (
    "id" UUID NOT NULL,
    "userId" TEXT,
    "subscriptionId" TEXT,
    "status" TEXT,
    "created_at_unix" BIGINT,
    "amount" INTEGER,
    "amount_origin" INTEGER,
    "currency" TEXT,
    "customerId" TEXT,
    "applicationId" TEXT,
    "itemId" TEXT,
    "planId" TEXT,
    "priceId" TEXT,
    "productId" TEXT,
    "latestInvoiceId" TEXT,
    "currentPeriodEnd" INTEGER,
    "currentPeriodStart" INTEGER,
    "billingCycleAnchor" INTEGER,
    "date" TIMESTAMP(3) NOT NULL,
    "interval" TEXT,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminSubscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminCharges_chargeId_key" ON "AdminCharges"("chargeId");