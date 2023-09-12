-- AlterTable
ALTER TABLE subscriptions
ADD COLUMN end_first_comm_date TIMESTAMP,
ADD COLUMN end_second_comm_date TIMESTAMP;