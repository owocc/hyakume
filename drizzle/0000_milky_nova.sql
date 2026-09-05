CREATE TABLE "apps" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"tagline" text DEFAULT '',
	"url" text NOT NULL,
	"category" text NOT NULL,
	"categories" text,
	"developer" text NOT NULL,
	"developer_id" text,
	"icon_url" text NOT NULL,
	"cover_url" text NOT NULL,
	"primary_color" text,
	"seo_image" text,
	"screenshots" text,
	"preview_features" text,
	"description" text NOT NULL,
	"rating" double precision DEFAULT 4.5 NOT NULL,
	"rating_count" text DEFAULT '1000+' NOT NULL,
	"ranking" text,
	"age_rating" text DEFAULT '12+' NOT NULL,
	"price" text DEFAULT '免费 · Web App' NOT NULL,
	"size" text DEFAULT 'Web App' NOT NULL,
	"compatibility" text DEFAULT '现代 Web 浏览器 / iOS / Android / macOS / Windows' NOT NULL,
	"languages" text DEFAULT '简体中文和英语' NOT NULL,
	"version" text DEFAULT '1.0.0' NOT NULL,
	"version_date" text DEFAULT '近期更新' NOT NULL,
	"release_notes" text DEFAULT '',
	"privacy_linked" text,
	"privacy_not_linked" text,
	"events" text,
	"related_topics" text,
	"featured" boolean DEFAULT false NOT NULL,
	"trending" boolean DEFAULT false NOT NULL,
	"created_at" bigint NOT NULL,
	"updated_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"icon" text DEFAULT '',
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" bigint NOT NULL,
	CONSTRAINT "categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" text PRIMARY KEY NOT NULL,
	"app_id" text NOT NULL,
	"title" text NOT NULL,
	"author" text NOT NULL,
	"rating" integer DEFAULT 5 NOT NULL,
	"date" text NOT NULL,
	"content" text NOT NULL,
	"created_at" bigint NOT NULL
);
--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_app_id_apps_id_fk" FOREIGN KEY ("app_id") REFERENCES "public"."apps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_apps_category" ON "apps" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_apps_featured" ON "apps" USING btree ("featured");--> statement-breakpoint
CREATE INDEX "idx_apps_trending" ON "apps" USING btree ("trending");--> statement-breakpoint
CREATE INDEX "idx_reviews_app_id" ON "reviews" USING btree ("app_id");