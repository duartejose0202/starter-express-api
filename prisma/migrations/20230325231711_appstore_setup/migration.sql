-- CreateTable
CREATE TABLE "AppleAccount" (
    "id" UUID NOT NULL,
    "teamId" TEXT NOT NULL,
    "teamName" TEXT NOT NULL,
    "bundleId" TEXT NOT NULL,
    "iosKeyId" TEXT NOT NULL,
    "iosSecret" TEXT NOT NULL,
    "iapKeyId" TEXT NOT NULL,
    "iapKey" TEXT NOT NULL,
    "apiKeyId" TEXT NOT NULL,
    "apiKeyIssuerId" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "AppleAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppleAppDetail" (
    "id" UUID NOT NULL,
    "appName" TEXT NOT NULL,
    "appIcon" TEXT NOT NULL,
    "appDescription" TEXT NOT NULL,
    "appPromotion" TEXT NOT NULL,
    "appSubtitle" TEXT NOT NULL,
    "appCategory" TEXT NOT NULL,
    "appKeywords" TEXT NOT NULL,
    "supportUrl" TEXT NOT NULL,
    "marketingUrl" TEXT,
    "privacyPolicyUrl" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "AppleAppDetail_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AppleAccount_userId_key" ON "AppleAccount"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AppleAppDetail_userId_key" ON "AppleAppDetail"("userId");

-- AddForeignKey
ALTER TABLE "AppleAccount" ADD CONSTRAINT "AppleAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppleAppDetail" ADD CONSTRAINT "AppleAppDetail_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
