-- SplitPayments
CREATE TABLE Split_Payments (
    "id" UUID PRIMARY KEY,
    "stripe_account_id" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "split" DOUBLE PRECISION NOT NULL,
    "merchant_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT FK_split_payments_user FOREIGN KEY (merchant_id) REFERENCES "User"("id")
)