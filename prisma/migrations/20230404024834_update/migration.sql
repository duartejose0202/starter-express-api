/*
  Warnings:

  - You are about to alter the column `stripeAccountId` on the `DashboardGrossVolume` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - A unique constraint covering the columns `[stripeAccountId]` on the table `DashboardGrossVolume` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "DashboardGrossVolume" ALTER COLUMN "stripeAccountId" SET DATA TYPE VARCHAR(255);

-- CreateIndex
CREATE UNIQUE INDEX "DashboardGrossVolume_stripeAccountId_key" ON "DashboardGrossVolume"("stripeAccountId");
