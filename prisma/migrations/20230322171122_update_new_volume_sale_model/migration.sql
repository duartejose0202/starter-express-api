/*
  Warnings:

  - You are about to drop the column `net_volume` on the `NetVolumeSales` table. All the data in the column will be lost.
  - Added the required column `charge` to the `NetVolumeSales` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fee` to the `NetVolumeSales` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "NetVolumeSales" DROP COLUMN "net_volume",
ADD COLUMN     "charge" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "fee" DOUBLE PRECISION NOT NULL;
