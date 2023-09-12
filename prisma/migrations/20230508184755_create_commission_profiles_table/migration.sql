-- Commissions
CREATE TABLE Commissions (
    "id" UUID PRIMARY KEY,
    "identifier" VARCHAR(10) NOT NULL,
    "salesperson_id" UUID NOT NULL,
    "first_commission" JSONB,
    "second_commission" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ,
 
    CONSTRAINT FK_commissions_users FOREIGN KEY (salesperson_id) REFERENCES "User"("id")
);