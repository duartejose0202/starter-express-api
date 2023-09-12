/*
  Warnings:

  - Added the required column `userId` to the `SuperAdminFees` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SuperAdminFees" DROP COLUMN "userId",
ADD COLUMN     "userId" UUID;

-- AddForeignKey
ALTER TABLE "SuperAdminFees" ADD CONSTRAINT "fk_fees_user" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
