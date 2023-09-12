-- AlterTable
CREATE TYPE split_enum AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'NONE');

ALTER TABLE subscriptions 
ADD COLUMN split_status split_enum NOT NULL DEFAULT 'NONE',
ADD COLUMN logs TEXT;
