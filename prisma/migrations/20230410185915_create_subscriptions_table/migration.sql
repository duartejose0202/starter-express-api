-- Subscriptions
CREATE TABLE Subscriptions (
    "id" UUID PRIMARY KEY,
    "stripe_subscription_id" VARCHAR(255) NOT NULL,
    "product_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT FK_subscriptions_products FOREIGN KEY (product_id) REFERENCES products(id)
);