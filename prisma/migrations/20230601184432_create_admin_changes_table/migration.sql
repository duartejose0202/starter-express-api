CREATE TYPE change_enum AS ENUM ('ADD', 'MODIFY', 'DELETE');

-- CREATE AdminChanges
CREATE TABLE Admin_Changes (
    "id" UUID PRIMARY KEY,
    "table" VARCHAR(255) NOT NULL,
    "column_changed" VARCHAR(255) NOT NULL,
    "record_id" UUID NOT NULL,
    "logs" TEXT,
    "type" change_enum NOT NULL DEFAULT 'MODIFY',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);