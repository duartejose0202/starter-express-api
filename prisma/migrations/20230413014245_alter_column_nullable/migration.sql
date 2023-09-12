/*
  Warnings:

  - Made the column `payment_intent` on table `sca_purchase` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "form_settings" ALTER COLUMN "identifier" DROP NOT NULL;
