-- Products
CREATE TABLE Products (
    "id" UUID PRIMARY KEY,
    "user_id" UUID NOT NULL,
    "stripe_product_id" VARCHAR(255) NOT NULL,
    "name" VARCHAR(22) NOT NULL,
    "description" VARCHAR(255) NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT FK_products_user FOREIGN KEY (user_id) REFERENCES "User"("id")
);