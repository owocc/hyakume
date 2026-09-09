import { and, eq, ne, sql } from "drizzle-orm";
import { db, ensureTablesInitialized } from "../db";
import { ingestionDraftsTable, tasksTable } from "../db/schema";
import type { IngestionDraft, ReviewFields } from "./types";
import { IngestionError } from "./validation";

const DRAFT_LIFETIME = 7 * 24 * 60 * 60 * 1000;

export async function loadDraft(id: string, userId: string) {
  const [row] = await db.select().from(ingestionDraftsTable)
    .where(and(eq(ingestionDraftsTable.id, id), eq(ingestionDraftsTable.user_id, userId))).limit(1);
  if (!row) return null;
  if (!row.confirmed_at && row.created_at < Date.now() - DRAFT_LIFETIME) {
    throw new IngestionError("草稿已过期，请重新解析或上传", 410);
  }
  return { draft: JSON.parse(row.payload) as IngestionDraft, publishedAppId: row.app_id || undefined };
}

export async function saveDraft(draft: IngestionDraft, userId: string) {
  await db.insert(ingestionDraftsTable).values({
    id: draft.id, user_id: userId, payload: JSON.stringify(draft), created_at: draft.createdAt,
  }).onConflictDoNothing();
  const saved = await loadDraft(draft.id, userId);
  if (!saved) throw new IngestionError("草稿 ID 已被使用，请新建任务", 409);
  return saved;
}

export async function markAwaitingConfirmation(id: string, userId: string) {
  await db.update(tasksTable).set({ step: 4, step_name: "等待表单确认，尚未发布", progress: 80,
    status: "awaiting_confirmation", updated_at: Date.now() }).where(and(
    eq(tasksTable.id, id), eq(tasksTable.user_id, userId), ne(tasksTable.status, "completed"),
  ));
}

export async function publishDraft(draft: IngestionDraft, fields: ReviewFields, userId: string): Promise<string> {
  await ensureTablesInitialized();
  const app = { ...draft.app, ...fields, category: fields.categories[0] };
  const now = Date.now();
  const values = {
    id: app.id, name: app.name, tagline: app.tagline, url: app.url,
    category: app.category, categories: JSON.stringify(app.categories), developer: app.developer,
    developer_id: app.developer_id || "", icon_url: app.icon_url, cover_url: app.cover_url,
    primary_color: app.primary_color || "", seo_image: draft.crawl.seoImage || "",
    screenshots: JSON.stringify(app.screenshots), preview_features: JSON.stringify(app.preview_features),
    description: app.description, rating: 0, rating_count: "0", ranking: "", age_rating: "未知",
    price: "未知", size: "Web", compatibility: "未知", languages: "未知", version: "未知",
    version_date: "未知", release_notes: "", privacy_linked: "[]", privacy_not_linked: "[]",
    events: "[]", related_topics: "[]", featured: false, trending: false,
    user_id: userId, created_at: now, updated_at: now,
  };
  const columns = Object.keys(values);
  const editableColumns = ["name", "tagline", "category", "categories", "developer", "icon_url", "cover_url", "preview_features", "description", "updated_at"];
  // A re-crawl may have no images. Do not erase working captures during a textual correction.
  if (draft.crawl.screenshots.length) editableColumns.push("screenshots");
  if (draft.crawl.seoImage) editableColumns.push("seo_image");
  if (draft.crawl.primaryColor) editableColumns.push("primary_color");
  const updates = draft.kind === "subpage" ? sql`id = apps.id` : sql.join(editableColumns.map((key) =>
    sql`${sql.identifier(key)} = excluded.${sql.identifier(key)}`), sql`, `);
  const target = new URL(draft.url);
  const hasSubpage = target.pathname !== "/";
  const subpage = hasSubpage ? sql`, saved_page AS (
    INSERT INTO app_subpages (id, app_id, url, path, title, description, screenshot, screenshots, label, is_meaningful, user_id, created_at)
    SELECT ${"sub_" + draft.id}, id, ${draft.url}, ${target.pathname + target.search}, ${fields.name}, ${fields.description},
      ${fields.cover_url || draft.crawl.screenshots[0] || ""}, ${JSON.stringify(draft.crawl.screenshots)},
      ${target.pathname.includes("doc") ? "技术文档" : "核心页面"}, true, ${userId}, ${now}
    FROM saved_app ON CONFLICT (id) DO NOTHING RETURNING id
  )` : sql``;
  // Claim, publish and mark the task in one statement: retries cannot publish twice,
  // and a failed write rolls the claim back on both PostgreSQL and Neon HTTP.
  await db.execute(sql`
    WITH claimed AS (
      UPDATE ingestion_drafts SET confirmed_at = ${now}, app_id = ${app.id},
        payload = ${JSON.stringify({ ...draft, fields })}
      WHERE id = ${draft.id} AND user_id = ${userId} AND confirmed_at IS NULL
        AND created_at >= ${now - DRAFT_LIFETIME} RETURNING id
    ), saved_app AS (
      INSERT INTO apps (${sql.join(columns.map((key) => sql.identifier(key)), sql`, `)})
      SELECT ${sql.join(Object.values(values).map((value) => sql`${value}`), sql`, `)} FROM claimed
      ON CONFLICT (id) DO UPDATE SET ${updates} RETURNING id
    ) ${subpage}, saved_task AS (
      UPDATE tasks SET status = 'completed', step = 5, step_name = '内容已确认并发布',
        progress = 100, app_id = ${app.id}, updated_at = ${now}
      WHERE id = ${draft.id} AND user_id = ${userId} AND EXISTS (SELECT 1 FROM saved_app) RETURNING id
    ) SELECT id FROM saved_app
  `);
  const saved = await loadDraft(draft.id, userId);
  if (!saved?.publishedAppId) throw new IngestionError("草稿不可发布，请重新加载后重试", 409);
  return saved.publishedAppId;
}
