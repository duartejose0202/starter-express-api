-- FormStyle
CREATE TABLE Form_Styles (
    "id" UUID PRIMARY KEY,
    "style_object" JSONB,
    "analytics_object" JSONB,
    "user_id" UUID NOT NULL,
    "app_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT FK_form_style_user FOREIGN KEY (user_id) REFERENCES "User"("id"),
    CONSTRAINT FK_form_style_app FOREIGN KEY (app_id) REFERENCES "App"("id")
);
