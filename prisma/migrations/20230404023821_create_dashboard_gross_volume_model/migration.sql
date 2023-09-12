-- CreateTable
CREATE TABLE "DashboardGrossVolume" (
    "id" SERIAL NOT NULL,
    "stripeAccountId" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "DashboardGrossVolume_pkey" PRIMARY KEY ("id")
);
