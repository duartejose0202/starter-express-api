/*
  Warnings:

  - You are about to drop the column `appCategory` on the `AppleAppDetail` table. All the data in the column will be lost.
  - You are about to drop the column `appDescription` on the `AppleAppDetail` table. All the data in the column will be lost.
  - You are about to drop the column `appIcon` on the `AppleAppDetail` table. All the data in the column will be lost.
  - You are about to drop the column `appKeywords` on the `AppleAppDetail` table. All the data in the column will be lost.
  - You are about to drop the column `appName` on the `AppleAppDetail` table. All the data in the column will be lost.
  - You are about to drop the column `appPromotion` on the `AppleAppDetail` table. All the data in the column will be lost.
  - You are about to drop the column `appSubtitle` on the `AppleAppDetail` table. All the data in the column will be lost.
  - Added the required column `category` to the `AppleAppDetail` table without a default value. This is not possible if the table is not empty.
  - Added the required column `description` to the `AppleAppDetail` table without a default value. This is not possible if the table is not empty.
  - Added the required column `iconFile` to the `AppleAppDetail` table without a default value. This is not possible if the table is not empty.
  - Added the required column `iconUrl` to the `AppleAppDetail` table without a default value. This is not possible if the table is not empty.
  - Added the required column `keywords` to the `AppleAppDetail` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `AppleAppDetail` table without a default value. This is not possible if the table is not empty.
  - Added the required column `promotion` to the `AppleAppDetail` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subtitle` to the `AppleAppDetail` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "AppleAppDetail" DROP COLUMN "appCategory",
DROP COLUMN "appDescription",
DROP COLUMN "appIcon",
DROP COLUMN "appKeywords",
DROP COLUMN "appName",
DROP COLUMN "appPromotion",
DROP COLUMN "appSubtitle",
ADD COLUMN     "category" TEXT NOT NULL,
ADD COLUMN     "description" TEXT NOT NULL,
ADD COLUMN     "iconFile" TEXT NOT NULL,
ADD COLUMN     "iconUrl" TEXT NOT NULL,
ADD COLUMN     "keywords" TEXT NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "promotion" TEXT NOT NULL,
ADD COLUMN     "screenshotFiles" TEXT[],
ADD COLUMN     "screenshotUrls" TEXT[],
ADD COLUMN     "subtitle" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "GoogleAccount" (
    "id" UUID NOT NULL,
    "gplk" TEXT NOT NULL,
    "jsonKey" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "GoogleAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoogleAppDetail" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "iconFile" TEXT NOT NULL,
    "iconUrl" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "shortDesc" TEXT NOT NULL,
    "featureImageFile" TEXT NOT NULL,
    "featureImageUrl" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "keywords" TEXT NOT NULL,
    "supportUrl" TEXT NOT NULL,
    "marketingUrl" TEXT NOT NULL,
    "privacyPolicyUrl" TEXT NOT NULL,
    "screenshotFiles" TEXT[],
    "screenshotUrls" TEXT[],
    "userId" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "GoogleAppDetail_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GoogleAccount_userId_key" ON "GoogleAccount"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "GoogleAppDetail_userId_key" ON "GoogleAppDetail"("userId");

-- AddForeignKey
ALTER TABLE "GoogleAccount" ADD CONSTRAINT "GoogleAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoogleAppDetail" ADD CONSTRAINT "GoogleAppDetail_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
