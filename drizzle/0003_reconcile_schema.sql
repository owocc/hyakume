CREATE TABLE IF NOT EXISTS "articles" (
	"id" text PRIMARY KEY NOT NULL,
	"app_id" text NOT NULL,
	"slug" text,
	"title" text NOT NULL,
	"summary" text DEFAULT '',
	"tag" text DEFAULT '精选推荐' NOT NULL,
	"content" text NOT NULL,
	"cover_image" text DEFAULT '',
	"github_url" text,
	"x_url" text,
	"source_url" text,
	"links" text,
	"author" text DEFAULT 'AppStore 精选编辑部' NOT NULL,
	"read_time" text DEFAULT '3 分钟阅读' NOT NULL,
	"views" integer DEFAULT 0 NOT NULL,
	"likes" integer DEFAULT 0 NOT NULL,
	"user_id" text DEFAULT 'system' NOT NULL,
	"created_at" bigint NOT NULL,
	"updated_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "app_subpages" (
	"id" text PRIMARY KEY NOT NULL,
	"app_id" text NOT NULL,
	"url" text NOT NULL,
	"path" text NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '',
	"screenshot" text NOT NULL,
	"screenshots" text,
	"label" text DEFAULT '核心页面' NOT NULL,
	"is_meaningful" boolean DEFAULT true NOT NULL,
	"article_id" text,
	"user_id" text DEFAULT 'system',
	"created_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tasks" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"url" text NOT NULL,
	"domain" text,
	"status" text DEFAULT 'processing' NOT NULL,
	"step" integer DEFAULT 1 NOT NULL,
	"step_name" text DEFAULT '页面渲染与快照截取' NOT NULL,
	"progress" integer DEFAULT 20 NOT NULL,
	"app_id" text,
	"article_id" text,
	"error" text,
	"created_at" bigint NOT NULL,
	"updated_at" bigint NOT NULL
);
--> statement-breakpoint
ALTER TABLE "apps" ADD COLUMN IF NOT EXISTS "user_id" text DEFAULT 'system' NOT NULL;
--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "links" text;
--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "user_id" text DEFAULT 'system' NOT NULL;
--> statement-breakpoint
ALTER TABLE "app_subpages" ADD COLUMN IF NOT EXISTS "is_meaningful" boolean DEFAULT true NOT NULL;
--> statement-breakpoint
ALTER TABLE "app_subpages" ADD COLUMN IF NOT EXISTS "user_id" text DEFAULT 'system';
--> statement-breakpoint
ALTER TABLE "account" ADD COLUMN IF NOT EXISTS "issuer" text DEFAULT '' NOT NULL;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'articles_app_id_apps_id_fk') THEN
    ALTER TABLE "articles" ADD CONSTRAINT "articles_app_id_apps_id_fk" FOREIGN KEY ("app_id") REFERENCES "public"."apps"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'app_subpages_app_id_apps_id_fk') THEN
    ALTER TABLE "app_subpages" ADD CONSTRAINT "app_subpages_app_id_apps_id_fk" FOREIGN KEY ("app_id") REFERENCES "public"."apps"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_articles_app_id" ON "articles" USING btree ("app_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_articles_created_at" ON "articles" USING btree ("created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_articles_user_id" ON "articles" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_subpages_app_id" ON "app_subpages" USING btree ("app_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_subpages_url" ON "app_subpages" USING btree ("url");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_subpages_user_id" ON "app_subpages" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_tasks_user_id" ON "tasks" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_tasks_status" ON "tasks" USING btree ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_tasks_created_at" ON "tasks" USING btree ("created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_apps_user_id" ON "apps" USING btree ("user_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "account_issuer_accountId_uidx" ON "account" USING btree ("issuer", "account_id");
--> statement-breakpoint
INSERT INTO "categories" ("id", "name", "icon", "sort_order", "created_at") VALUES
  ('apps', 'App', 'AppWindow', 1, FLOOR(EXTRACT(EPOCH FROM CURRENT_TIMESTAMP) * 1000)::bigint),
  ('games', '游戏', 'Gamepad2', 2, FLOOR(EXTRACT(EPOCH FROM CURRENT_TIMESTAMP) * 1000)::bigint),
  ('web', 'WEB', 'Globe', 3, FLOOR(EXTRACT(EPOCH FROM CURRENT_TIMESTAMP) * 1000)::bigint),
  ('tools', '工具', 'Wrench', 4, FLOOR(EXTRACT(EPOCH FROM CURRENT_TIMESTAMP) * 1000)::bigint),
  ('ai', 'AI', 'Sparkles', 5, FLOOR(EXTRACT(EPOCH FROM CURRENT_TIMESTAMP) * 1000)::bigint)
ON CONFLICT ("id") DO NOTHING;
