-- AlterTable
ALTER TABLE "App" ADD COLUMN     "appCategory" TEXT,
ADD COLUMN     "appDesign" TEXT,
ADD COLUMN     "appTemplate" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "payment_period" VARCHAR(255),
ADD COLUMN     "payment_plan" VARCHAR(255);
