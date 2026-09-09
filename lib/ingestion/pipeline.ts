import { crawlWebsite, normalizeUrl, type CrawlResult } from "../crawler";
import { summarizeForReview } from "../agent";
import { createTask, getAppByDomain, getTaskById, updateTask } from "../db";
import type { AppItem } from "../types";
import type { IngestionDraft, ReviewFields } from "./types";
import { EMPTY_FIELDS, IngestionError, validDraftId, validateReviewFields } from "./validation";
import { loadDraft, saveDraft, markAwaitingConfirmation } from "./repository";

export function fieldsFromApp(app: AppItem): ReviewFields {
  return Object.fromEntries(Object.keys(EMPTY_FIELDS).map((key) => [key, app[key as keyof AppItem]])) as unknown as ReviewFields;
}

export function emptyApp(crawl: CrawlResult): AppItem {
  const url = new URL(crawl.url);
  const domain = url.hostname.replace(/^www\./, "").toLowerCase();
  return {
    ...EMPTY_FIELDS, name: crawl.title, tagline: crawl.description.slice(0, 200), description: crawl.description,
    categories: ["WEB"], preview_features: [], id: domain, url: url.origin,
    category: "WEB", icon_url: crawl.iconUrl, cover_url: crawl.coverUrl,
    seo_image: crawl.seoImage, primary_color: crawl.primaryColor,
    screenshots: crawl.screenshots, device_screenshots: crawl.deviceScreenshots,
    rating: 0, rating_count: "0", age_rating: "未知", price: "未知", size: "Web",
    compatibility: "未知", languages: "未知", version: "未知", version_date: "未知", release_notes: "",
    privacy_linked: [], privacy_not_linked: [], featured: false, trending: false,
    created_at: Date.now(), updated_at: Date.now(),
  };
}

export async function prepareDraft(options: {
  userId: string; url: unknown; taskId?: unknown;
  manual?: { crawl: CrawlResult; fields?: Partial<ReviewFields> };
}) {
  if (typeof options.url !== "string" || !options.url.trim() || options.url.length > 2048) {
    throw new IngestionError("请提供有效的网址 (URL)");
  }
  let target: string;
  try { target = normalizeUrl(options.url); }
  catch { throw new IngestionError("请提供公开的 HTTP(S) 网址"); }
  const id = options.taskId === undefined ? `rec_${crypto.randomUUID()}` : validDraftId(options.taskId);
  const prior = await loadDraft(id, options.userId);
  if (prior) {
    if (prior.draft.url !== target) throw new IngestionError("此任务对应其他网址，请新建任务", 409);
    return prior;
  }
  const task = await getTaskById(id);
  if (task && (task.user_id !== options.userId || task.url !== target)) {
    throw new IngestionError("任务不存在或无权访问", 404);
  }
  const parsed = new URL(target);
  await createTask({ id, user_id: options.userId, url: target, domain: parsed.hostname,
    status: "processing", step: 1, step_name: options.manual ? "读取手动上传内容" : "程序提取 SEO 与页面快照",
    progress: 10, created_at: Date.now(), updated_at: Date.now() });
  try {
    const crawl = options.manual?.crawl || await crawlWebsite(target, { isSubpage: parsed.pathname !== "/" });
    await updateTask(id, { step: 2, step_name: "SEO 提取完成，整理候选内容", progress: 50 });
    const result = options.manual
      ? { app: { ...emptyApp(crawl), ...options.manual.fields }, warnings: ["手动内容未经过网站真实性核验，请逐项确认。"] }
      : await summarizeForReview(crawl);
    const app = result.app;
    const fields = fieldsFromApp(app);
    const existing = await getAppByDomain(target);
    if (existing) { app.id = existing.id; app.url = existing.url; }
    const warnings = [...(crawl.warnings || []), ...result.warnings];
    try { validateReviewFields(fields); }
    catch (error) {
      if (error instanceof IngestionError) warnings.push("部分内容不足或不符合质量要求，请在确认表单中补充具体信息。");
      else throw error;
    }
    const { screenshotBuffer: _buffer, ...source } = crawl;
    const draft: IngestionDraft = {
      id, url: target, source: options.manual ? "manual" : "url",
      kind: existing && parsed.pathname !== "/" ? "subpage" : "app",
      fields, crawl: source, warnings: [...new Set(warnings)], app, createdAt: Date.now(),
    };
    const saved = await saveDraft(draft, options.userId);
    if (!saved.publishedAppId) {
      await markAwaitingConfirmation(id, options.userId);
    }
    return saved;
  } catch (error) {
    await updateTask(id, { status: "failed", step_name: "解析失败，可改用手动上传", error: "未发布任何内容", progress: 0 }).catch(() => {});
    throw error;
  }
}
