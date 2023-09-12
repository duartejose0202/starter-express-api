-- Coupons
CREATE TABLE Coupons (
    "id" UUID PRIMARY KEY,
    "product_id" UUID NOT NULL,
    "stripe_coupon_id" VARCHAR(255) NOT NULL,
    "coupon_code" VARCHAR(22),
    "amount_off" DOUBLE PRECISION,
    "percent_off" DOUBLE PRECISION,
    "currency" VARCHAR(5),
    "duration" VARCHAR(20),
    "livemode" INT,
    "max_redemptions" INT,
    "metadata" TEXT,
    "name" VARCHAR(22),
    "redeem_by" INT,
    "times_redeemed" INT,
    "valid" VARCHAR(100),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT FK_coupons_products FOREIGN KEY (product_id) REFERENCES products(id)
);