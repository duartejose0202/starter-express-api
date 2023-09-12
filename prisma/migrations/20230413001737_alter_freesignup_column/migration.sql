-- AlterTable
ALTER TABLE "form_settings" ALTER COLUMN "identifier" SET DEFAULT 'usd',
ALTER COLUMN "app_id" DROP NOT NULL;
