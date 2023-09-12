-- AlterTable
ALTER TABLE split_payments 
ADD COLUMN commission_id UUID,
ADD CONSTRAINT FK_split_commissions FOREIGN KEY (commission_id) REFERENCES commissions(id);
