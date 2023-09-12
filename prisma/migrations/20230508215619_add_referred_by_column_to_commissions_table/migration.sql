/*
  Warnings:

  - A unique constraint covering the columns `[salesperson_id]` on the table `commissions` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "commissions_salesperson_id_key" ON "commissions"("salesperson_id");

-- AlterTable
ALTER TABLE subscriptions 
ADD COLUMN referred_by UUID,
ADD CONSTRAINT FK_subscriptions_commissions FOREIGN KEY (referred_by) REFERENCES commissions(id);
