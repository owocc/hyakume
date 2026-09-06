import { pgTable, text, integer, bigint, doublePrecision, boolean, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const categoriesTable = pgTable("categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  icon: text("icon").default(""),
  sort_order: integer("sort_order").default(0).notNull(),
  created_at: bigint("created_at", { mode: "number" }).notNull(),
});

export const appsTable = pgTable(
  "apps",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    tagline: text("tagline").default(""),
    url: text("url").notNull(),
    category: text("category").notNull(),
    categories: text("categories"),
    developer: text("developer").notNull(),
    developer_id: text("developer_id"),
    icon_url: text("icon_url").notNull(),
    cover_url: text("cover_url").notNull(),
    primary_color: text("primary_color"),
    seo_image: text("seo_image"),
    screenshots: text("screenshots"),
    preview_features: text("preview_features"),
    description: text("description").notNull(),
    rating: doublePrecision("rating").default(4.5).notNull(),
    rating_count: text("rating_count").default("1000+").notNull(),
    ranking: text("ranking"),
    age_rating: text("age_rating").default("12+").notNull(),
    price: text("price").default("免费 · Web App").notNull(),
    size: text("size").default("Web App").notNull(),
    compatibility: text("compatibility").default("现代 Web 浏览器 / iOS / Android / macOS / Windows").notNull(),
    languages: text("languages").default("简体中文和英语").notNull(),
    version: text("version").default("1.0.0").notNull(),
    version_date: text("version_date").default("近期更新").notNull(),
    release_notes: text("release_notes").default(""),
    privacy_linked: text("privacy_linked"),
    privacy_not_linked: text("privacy_not_linked"),
    events: text("events"),
    related_topics: text("related_topics"),
    featured: boolean("featured").default(false).notNull(),
    trending: boolean("trending").default(false).notNull(),
    user_id: text("user_id").default("system").notNull(),
    created_at: bigint("created_at", { mode: "number" }).notNull(),
    updated_at: bigint("updated_at", { mode: "number" }).notNull(),
  },
  (table) => [
    index("idx_apps_category").on(table.category),
    index("idx_apps_featured").on(table.featured),
    index("idx_apps_trending").on(table.trending),
    index("idx_apps_user_id").on(table.user_id),
  ]
);

export const reviewsTable = pgTable(
  "reviews",
  {
    id: text("id").primaryKey(),
    app_id: text("app_id")
      .notNull()
      .references(() => appsTable.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    author: text("author").notNull(),
    rating: integer("rating").default(5).notNull(),
    date: text("date").notNull(),
    content: text("content").notNull(),
    created_at: bigint("created_at", { mode: "number" }).notNull(),
  },
  (table) => [
    index("idx_reviews_app_id").on(table.app_id),
  ]
);

export const subpagesTable = pgTable(
  "app_subpages",
  {
    id: text("id").primaryKey(),
    app_id: text("app_id")
      .notNull()
      .references(() => appsTable.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    path: text("path").notNull(),
    title: text("title").notNull(),
    description: text("description").default(""),
    screenshot: text("screenshot").notNull(),
    screenshots: text("screenshots"),
    label: text("label").default("核心页面").notNull(),
    is_meaningful: boolean("is_meaningful").default(true).notNull(),
    article_id: text("article_id"),
    user_id: text("user_id").default("system"),
    created_at: bigint("created_at", { mode: "number" }).notNull(),
  },
  (table) => [
    index("idx_subpages_app_id").on(table.app_id),
    index("idx_subpages_url").on(table.url),
    index("idx_subpages_user_id").on(table.user_id),
  ]
);

export const articlesTable = pgTable(
  "articles",
  {
    id: text("id").primaryKey(),
    app_id: text("app_id")
      .notNull()
      .references(() => appsTable.id, { onDelete: "cascade" }),
    slug: text("slug"),
    title: text("title").notNull(),
    summary: text("summary").default(""),
    tag: text("tag").default("精选推荐").notNull(),
    content: text("content").notNull(),
    cover_image: text("cover_image").default(""),
    github_url: text("github_url"),
    x_url: text("x_url"),
    source_url: text("source_url"),
    links: text("links"),
    author: text("author").default("AppStore 精选编辑部").notNull(),
    read_time: text("read_time").default("3 分钟阅读").notNull(),
    views: integer("views").default(0).notNull(),
    likes: integer("likes").default(0).notNull(),
    user_id: text("user_id").default("system").notNull(),
    created_at: bigint("created_at", { mode: "number" }).notNull(),
    updated_at: bigint("updated_at", { mode: "number" }).notNull(),
  },
  (table) => [
    index("idx_articles_app_id").on(table.app_id),
    index("idx_articles_created_at").on(table.created_at),
    index("idx_articles_user_id").on(table.user_id),
  ]
);

export const tasksTable = pgTable(
  "tasks",
  {
    id: text("id").primaryKey(),
    user_id: text("user_id").notNull(),
    url: text("url").notNull(),
    domain: text("domain"),
    status: text("status").default("processing").notNull(), // "processing" | "completed" | "failed"
    step: integer("step").default(1).notNull(), // 1 to 5
    step_name: text("step_name").default("页面渲染与快照截取").notNull(),
    progress: integer("progress").default(20).notNull(), // 0 to 100
    app_id: text("app_id"),
    article_id: text("article_id"),
    error: text("error"),
    created_at: bigint("created_at", { mode: "number" }).notNull(),
    updated_at: bigint("updated_at", { mode: "number" }).notNull(),
  },
  (table) => [
    index("idx_tasks_user_id").on(table.user_id),
    index("idx_tasks_status").on(table.status),
    index("idx_tasks_created_at").on(table.created_at),
  ]
);
export const appsRelations = relations(appsTable, ({ many }) => ({
  reviews: many(reviewsTable),
  subpages: many(subpagesTable),
  articles: many(articlesTable),
}));

export const reviewsRelations = relations(reviewsTable, ({ one }) => ({
  app: one(appsTable, {
    fields: [reviewsTable.app_id],
    references: [appsTable.id],
  }),
}));

export const subpagesRelations = relations(subpagesTable, ({ one }) => ({
  app: one(appsTable, {
    fields: [subpagesTable.app_id],
    references: [appsTable.id],
  }),
}));

export const articlesRelations = relations(articlesTable, ({ one }) => ({
  app: one(appsTable, {
    fields: [articlesTable.app_id],
    references: [appsTable.id],
  }),
}));

export type CategorySelect = typeof categoriesTable.$inferSelect;
export type CategoryInsert = typeof categoriesTable.$inferInsert;
export type AppSelect = typeof appsTable.$inferSelect;
export type AppInsert = typeof appsTable.$inferInsert;
export type ReviewSelect = typeof reviewsTable.$inferSelect;
export type ReviewInsert = typeof reviewsTable.$inferInsert;
export type SubpageSelect = typeof subpagesTable.$inferSelect;
export type SubpageInsert = typeof subpagesTable.$inferInsert;
export type ArticleSelect = typeof articlesTable.$inferSelect;
export type ArticleInsert = typeof articlesTable.$inferInsert;
export type TaskSelect = typeof tasksTable.$inferSelect;
export type TaskInsert = typeof tasksTable.$inferInsert;
export * from "./auth-schema";
