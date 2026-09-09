import type { AppItem } from "../types";
import type { CrawlResult } from "../crawler";
import { agentRuntime, type AgentRuntime } from "./runtime";
import { summaryPrompt } from "./prompts";
import { cleanSourceText, hasMeaningfulSource, isSourceExcerpt } from "./source";
import { ALLOWED_CATEGORIES, assertKeys, record, stringArray, textField } from "./validation";

interface SummaryFields {
  name?: string;
  tagline?: string;
  description?: string;
  categories: string[];
  preview_features: string[];
  developer?: string;
}

export function validateSummary(value: unknown, crawl: CrawlResult): SummaryFields {
  const data = record(value);
  assertKeys(data, ["name", "tagline", "description", "categories", "preview_features", "developer"]);
  const fields: SummaryFields = { categories: [], preview_features: [] };
  for (const [key, max] of [["name", 160], ["tagline", 300], ["description", 4000], ["developer", 160]] as const) {
    if (key in data) {
      const text = textField(data[key], key, max);
      if (text && !isSourceExcerpt(text, crawl)) throw new Error(`AI output field "${key}" is not supported by a source excerpt.`);
      fields[key] = text;
    }
  }
  if ("categories" in data) {
    fields.categories = stringArray(data.categories, "categories", 3, 10);
    if (fields.categories.some((category) => !Object.hasOwn(ALLOWED_CATEGORIES, category))) {
      throw new Error("AI output contains an invalid category.");
    }
  }
  if ("preview_features" in data) {
    fields.preview_features = stringArray(data.preview_features, "preview_features", 8, 200);
    if (fields.preview_features.some((feature) => !isSourceExcerpt(feature, crawl))) {
      throw new Error("AI output features are not supported by source excerpts.");
    }
  }
  if (!fields.name && !fields.tagline && !fields.description) throw new Error("AI output has no usable summary fields.");
  return fields;
}

export function createFallbackApp(crawl: CrawlResult): AppItem {
  const parsed = new URL(crawl.url);
  const domain = parsed.hostname.replace(/^www\./, "").toLowerCase();
  const isGithub = domain === "github.com";
  const now = Date.now();
  const description = cleanSourceText(crawl.description).slice(0, 4000);
  return {
    id: domain,
    name: cleanSourceText(crawl.title).slice(0, 160) || domain,
    tagline: description.slice(0, 300),
    url: isGithub ? "https://github.com" : parsed.origin,
    category: "",
    categories: [],
    developer: "",
    icon_url: crawl.iconUrl,
    cover_url: crawl.coverUrl,
    primary_color: crawl.primaryColor,
    seo_image: crawl.seoImage,
    screenshots: [...crawl.screenshots],
    device_screenshots: crawl.deviceScreenshots ? { ...crawl.deviceScreenshots } : undefined,
    preview_features: [],
    description: description || cleanSourceText(crawl.text).slice(0, 4000),
    rating: 0,
    rating_count: "0",
    age_rating: "未知",
    price: "未知",
    size: "未知",
    compatibility: "未知",
    languages: "未知",
    version: "未知",
    version_date: "",
    release_notes: "",
    privacy_linked: [],
    privacy_not_linked: [],
    events: [],
    related_topics: [],
    featured: false,
    trending: false,
    created_at: now,
    updated_at: now,
  };
}

export async function summarizeForReview(
  crawl: CrawlResult,
  runtime: AgentRuntime = agentRuntime,
): Promise<{ app: AppItem; warnings: string[] }> {
  const app = createFallbackApp(crawl);
  const warnings: string[] = [];
  if (!hasMeaningfulSource(crawl)) warnings.push("页面正文不足或可能是错误/验证页面，请核对抓取结果后再确认收录。");
  try {
    const summary = validateSummary(await runtime.complete(summaryPrompt(crawl)), crawl);
    for (const key of ["name", "tagline", "description", "developer"] as const) {
      if (summary[key]) app[key] = summary[key];
    }
    app.categories = summary.categories;
    app.category = summary.categories[0] || "";
    app.preview_features = summary.preview_features;
  } catch (error) {
    const detail = error instanceof Error && error.message.startsWith("AI ")
      ? error.message : "AI analysis failed.";
    warnings.push(`AI 分析未通过，已保留网页原始标题、SEO 描述或正文，未生成推荐内容。${detail}`);
  }
  return { app, warnings };
}

export async function summarizeWithAgent(crawl: CrawlResult, runtime: AgentRuntime = agentRuntime): Promise<AppItem> {
  return (await summarizeForReview(crawl, runtime)).app;
}
