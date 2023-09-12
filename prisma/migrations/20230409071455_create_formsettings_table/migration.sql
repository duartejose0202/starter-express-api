-- FormSettings
CREATE TABLE Form_Settings (
    "id" UUID PRIMARY KEY,
    "identifier" VARCHAR(10) NOT NULL,
    "miscellaneous" JSONB NULL,
    "user_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "price_id" UUID NOT NULL,
    "app_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT FK_form_settings_user FOREIGN KEY (user_id) REFERENCES "User"("id"),
    CONSTRAINT FK_form_settings_products FOREIGN KEY (product_id) REFERENCES products(id),
    CONSTRAINT FK_form_settings_prices FOREIGN KEY (price_id) REFERENCES prices(id),
    CONSTRAINT FK_form_settings_app FOREIGN KEY (app_id) REFERENCES "App"("id")
);