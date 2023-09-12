/*
  Warnings:

  - Made the column `payment_intent` on table `sca_purchase` required. This step will fail if there are existing NULL values in that column.

*/
-- -- AlterTable
-- ALTER TABLE "sca_purchase" ALTER COLUMN "payment_intent" SET NOT NULL;

-- AlterTable
ALTER TABLE "FreeSignup" ADD COLUMN "identifier" VARCHAR(10);