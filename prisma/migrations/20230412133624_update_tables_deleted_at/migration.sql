-- AlterTable
ALTER TABLE "AdminCharges" ADD COLUMN     "deleted_at" TIMESTAMPTZ;

-- AlterTable
ALTER TABLE "AdminCustomers" ADD COLUMN     "deleted_at" TIMESTAMPTZ;

-- AlterTable
ALTER TABLE "AdminSubscriptions" ADD COLUMN     "deleted_at" TIMESTAMPTZ;

-- AlterTable
ALTER TABLE "SuperAdminCharges" ADD COLUMN     "deleted_at" TIMESTAMPTZ;

-- AlterTable
ALTER TABLE "SuperAdminFees" ADD COLUMN     "deleted_at" TIMESTAMPTZ;
