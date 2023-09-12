-- AlterTable
ALTER TABLE subscriptions
ADD COLUMN merchant_id UUID,
ADD CONSTRAINT FK_subscriptions_user FOREIGN KEY (merchant_id) REFERENCES "User"("id");
