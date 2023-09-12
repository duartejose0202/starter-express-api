-- Prices
CREATE TABLE Prices (
    "id" UUID PRIMARY KEY,
    "product_id" UUID NOT NULL,
    "stripe_price_id" VARCHAR(255) NOT NULL,
    "type" VARCHAR(22) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'usd',
    "trial_day" INT NOT NULL DEFAULT 0,
    "amount" DOUBLE PRECISION NOT NULL,
    "duration" VARCHAR(22),
    "pricing_type" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT FK_prices_products FOREIGN KEY (product_id) REFERENCES products(id)
);