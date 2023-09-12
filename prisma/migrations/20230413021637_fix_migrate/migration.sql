/*
  Warnings:

  - Made the column `identifier` on table `form_settings` required. This step will fail if there are existing NULL values in that column.
  - Made the column `payment_intent` on table `sca_purchase` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "form_settings" ALTER COLUMN "identifier" SET NOT NULL;

-- AlterTable
ALTER TABLE "sca_purchase" ALTER COLUMN "payment_intent" SET NOT NULL;
