CREATE TABLE IF NOT EXISTS "ingestion_drafts" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "payload" text NOT NULL,
  "created_at" bigint NOT NULL,
  "confirmed_at" bigint,
  "app_id" text
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ingestion_drafts_user_id" ON "ingestion_drafts" USING btree ("user_id");
