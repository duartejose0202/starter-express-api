/*
  Warnings:

  - The `is_show_logo` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "old_user_id" INTEGER,
DROP COLUMN "is_show_logo",
ADD COLUMN     "is_show_logo" BOOLEAN;
