-- CREATE CommissionPayments
CREATE TABLE Commission_Payments (
    "id" UUID PRIMARY KEY,
    "commission_id" UUID NOT NULL,
    "subscription_id" UUID NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "payment_status" split_enum NOT NULL DEFAULT 'SUCCESS',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ,
 
    CONSTRAINT FK_payments_commissions FOREIGN KEY (commission_id) REFERENCES commissions(id),
    CONSTRAINT FK_payments_subscriptions FOREIGN KEY (subscription_id) REFERENCES subscriptions(id)
);