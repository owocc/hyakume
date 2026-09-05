import type { AppItem } from "./types";
import type { CrawlResult } from "./crawler";
import { getCloudflareEnv } from "./cf-env";

export const ALLOWED_CATEGORIES: Record<string, true> = {
  工具: true,
  WEB: true,
  AI: true,
};

function decodeHtml(html: string): string {
  return html
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function cleanTitle(rawTitle: string, hostname: string): string {
  const decoded = decodeHtml(rawTitle);
  const parts = decoded.split(/\s*[-_—|·•:：]\s*/);
  let name = (parts[0] || "").trim();

  if (name.length > 20) {
    name = name.slice(0, 20);
  }
  if (!name || name.length < 2) {
    name = hostname.replace(/\.[^.]+$/, "").replace(/^www\./, "");
    name = name.charAt(0).toUpperCase() + name.slice(1);
  }
  return name;
}

function inferCategories(text: string): string[] {
  const lower = text.toLowerCase();
  const cats: string[] = ["WEB"];

  if (
    lower.includes("ai") ||
    lower.includes("gpt") ||
    lower.includes("llm") ||
    lower.includes("model") ||
    lower.includes("agent") ||
    lower.includes("bot") ||
    lower.includes("chat") ||
    lower.includes("intelligence") ||
    lower.includes("智能") ||
    lower.includes("大模型") ||
    lower.includes("机器学习") ||
    lower.includes("深度学习") ||
    lower.includes("生成式")
  ) {
    cats.push("AI");
  }

  if (
    lower.includes("tool") ||
    lower.includes("util") ||
    lower.includes("generator") ||
    lower.includes("converter") ||
    lower.includes("editor") ||
    lower.includes("viewer") ||
    lower.includes("calculator") ||
    lower.includes("dashboard") ||
    lower.includes("whiteboard") ||
    lower.includes("dev") ||
    lower.includes("code") ||
    lower.includes("git") ||
    lower.includes("design") ||
    lower.includes("format") ||
    lower.includes("api") ||
    lower.includes("productivity") ||
    lower.includes("工具") ||
    lower.includes("编辑器") ||
    lower.includes("转换器") ||
    lower.includes("生成器") ||
    lower.includes("开发") ||
    lower.includes("设计") ||
    lower.includes("白板") ||
    lower.includes("协同") ||
    lower.includes("办公") ||
    lower.includes("效率")
  ) {
    cats.push("工具");
  }

  if (cats.length === 1) {
    cats.push("工具");
  }

  return cats.filter((c, i) => cats.indexOf(c) === i);
}
export interface AiConfig {
  provider: "cloudflare" | "openai" | "deepseek" | "custom";
  model: string;
  apiKey?: string;
  baseUrl?: string;
}

export function resolveAiConfig(env: Record<string, unknown>): AiConfig {
  const getVal = (key: string): string => {
    if (typeof env[key] === "string" && env[key]) return env[key] as string;
    if (typeof process !== "undefined" && process.env && process.env[key]) return process.env[key] as string;
    return "";
  };

  const rawProvider = (getVal("AI_PROVIDER") || "").toLowerCase().trim();
  const apiKey = getVal("AI_API_KEY") || getVal("OPENAI_API_KEY") || getVal("DEEPSEEK_API_KEY");
  const customBaseUrl = getVal("AI_BASE_URL");
  const customModel = getVal("AI_MODEL");

  if (rawProvider === "deepseek" || (!rawProvider && customBaseUrl.includes("deepseek"))) {
    return {
      provider: "deepseek",
      model: customModel || "deepseek-chat",
      apiKey,
      baseUrl: customBaseUrl || "https://api.deepseek.com/v1",
    };
  }

  if (rawProvider === "openai" || (!rawProvider && apiKey && !customBaseUrl)) {
    return {
      provider: "openai",
      model: customModel || "gpt-4o-mini",
      apiKey,
      baseUrl: customBaseUrl || "https://api.openai.com/v1",
    };
  }

  if (rawProvider === "custom" || (rawProvider && rawProvider !== "cloudflare" && customBaseUrl)) {
    return {
      provider: "custom",
      model: customModel || "gpt-4o-mini",
      apiKey,
      baseUrl: customBaseUrl,
    };
  }

  return {
    provider: "cloudflare",
    model: customModel || "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
    apiKey,
    baseUrl: customBaseUrl,
  };
}

async function callOpenAICompatible(options: {
  baseUrl: string;
  apiKey: string;
  model: string;
  systemPrompt: string;
  userContent: string;
}): Promise<string> {
  const endpoint = options.baseUrl.replace(/\/+$/, "") + "/chat/completions";
  const resp = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(options.apiKey ? { Authorization: `Bearer ${options.apiKey}` } : {}),
    },
    body: JSON.stringify({
      model: options.model,
      messages: [
        { role: "system", content: options.systemPrompt },
        { role: "user", content: options.userContent },
      ],
      temperature: 0.3,
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`AI API error (${resp.status}): ${errText}`);
  }

  const data = (await resp.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return data.choices?.[0]?.message?.content?.trim() || "";
}

export async function summarizeWithAgent(crawl: CrawlResult): Promise<AppItem> {
  const env = await getCloudflareEnv();
  const parsedUrl = new URL(crawl.url);
  const fallbackName = cleanTitle(crawl.title, parsedUrl.hostname);
  const fallbackCategories = inferCategories(`${crawl.title} ${crawl.description} ${crawl.text}`);

  let appName = fallbackName;
  let tagline = crawl.description ? crawl.description.slice(0, 40) : `${fallbackName}，开启智能便捷的 Web 新体验`;
  let categories = fallbackCategories;
  let description = "";
  let previewFeatures = ["核心功能", "即时体验", "多端同步"];
  const releaseNotes = `版本更新内容：\n【全新重磅内容】\n全新 Web App 官方收录上线，提供极速轻量浏览体验。`;

  const systemPrompt = `你是一位专业的 Apple App Store 与 Web App 编辑评审专家。
请根据提供的网站标题、网页元数据与网页文本，将该网站整理为一个精美的 App Store 风格的应用介绍。
必须以 JSON 格式输出，不要包含任何 markdown 代码块标识。
格式字段如下：
{
  "name": "应用名称（简洁有力，不超过12个字）",
  "tagline": "一句话介绍标语（富有感染力，不超过30字）",
  "categories": ["工具", "WEB"], // 只能从 ["工具", "WEB", "AI"] 中选择 1 到 3 个适用的分类。一个应用属于多个分类，由你决定！
  "description": "详细介绍，包含【应用介绍】与【核心特色】",
  "preview_features": ["特色1", "特色2", "特色3"],
  "developer": "开发者或组织名称"
}`;

  const userContent = `网址: ${crawl.url}
标题: ${crawl.title}
描述: ${crawl.description}
页面内容节选: ${crawl.text.slice(0, 1000)}`;

  const aiConfig = resolveAiConfig(env as Record<string, unknown>);
  let rawText = "";

  try {
    if (aiConfig.provider !== "cloudflare" && aiConfig.baseUrl) {
      rawText = await callOpenAICompatible({
        baseUrl: aiConfig.baseUrl,
        apiKey: aiConfig.apiKey || "",
        model: aiConfig.model,
        systemPrompt,
        userContent,
      });
    } else if (env && env.AI && typeof (env.AI as { run?: unknown }).run === "function") {
      const aiRunner = env.AI as {
        run: (model: string, options: { messages: Array<{ role: string; content: string }> }) => Promise<unknown>;
      };
      let aiResponse: unknown;
      try {
        aiResponse = await aiRunner.run(aiConfig.model, {
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userContent },
          ],
        });
      } catch {
        aiResponse = await aiRunner.run("@cf/meta/llama-3.1-8b-instruct-fast", {
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userContent },
          ],
        });
      }

      if (aiResponse && typeof aiResponse === "object") {
        const resObj = aiResponse as Record<string, unknown>;
        if (typeof resObj.response === "string" && resObj.response.trim()) {
          rawText = resObj.response.trim();
        } else if (Array.isArray(resObj.choices) && resObj.choices.length > 0) {
          const first = resObj.choices[0];
          if (first && typeof first === "object") {
            const firstObj = first as Record<string, unknown>;
            if (firstObj.message && typeof firstObj.message === "object") {
              const msgObj = firstObj.message as Record<string, unknown>;
              if (typeof msgObj.content === "string") {
                rawText = msgObj.content.trim();
              }
            }
          }
        }
      }
    }
  } catch (aiErr) {
    console.warn(`AI summarization failed with provider [${aiConfig.provider}]:`, aiErr);
  }

  if (rawText) {
    try {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.name) appName = parsed.name;
        if (parsed.tagline) tagline = parsed.tagline;
        if (Array.isArray(parsed.categories) && parsed.categories.length > 0) {
          const validCats = parsed.categories.filter((c: string) => Boolean(ALLOWED_CATEGORIES[c]));
          if (validCats.length > 0) {
            categories = validCats.filter((c: string, i: number) => validCats.indexOf(c) === i);
          }
        }
        if (parsed.description) description = parsed.description;
        if (Array.isArray(parsed.preview_features) && parsed.preview_features.length >= 3) {
          previewFeatures = parsed.preview_features.slice(0, 3);
        }
      }
    } catch {
      // ignore parse error, fallback to rule engine
    }
  }

  if (!description) {
    const rawDesc = crawl.description || `${appName} 是一款高效便捷的现代 Web 应用。`;
    description = `【应用介绍】\n${rawDesc}\n\n【核心特色】\n① 随时随地，即点即用：基于现代浏览器技术构建，免去繁琐安装，畅享无缝体验。\n② 丰富功能，极速响应：轻量化架构设计，全面兼顾数据效率与交互流畅度。\n③ 安全可信，多端适配：完美兼容桌面端与移动端主流现代 Web 浏览器。`;
  }

  const id = parsedUrl.hostname.toLowerCase();
  const developerName = parsedUrl.hostname.replace(/^www\./, "");
  const primaryCategory = categories[0] || "WEB";

  const app: AppItem = {
    id,
    name: appName,
    tagline,
    url: crawl.url,
    category: primaryCategory,
    categories,
    developer: `${developerName} Official`,
    developer_id: developerName,
    icon_url: crawl.iconUrl,
    cover_url: crawl.coverUrl,
    primary_color: crawl.primaryColor,
    seo_image: crawl.seoImage,
    screenshots: crawl.screenshots,
    device_screenshots: crawl.deviceScreenshots,
    preview_features: previewFeatures,
    description,
    rating: 4.8,
    rating_count: "8.8万",
    ranking: `#1 ${categories.join(" · ")}`,
    age_rating: "4+ 岁",
    price: "免费 · Web App",
    size: "Web App",
    compatibility: "全平台现代 Web 浏览器 / iOS / Android / macOS / Windows",
    languages: "简体中文和英语",
    version: "1.0.0",
    version_date: "刚刚收录",
    release_notes: releaseNotes,
    privacy_linked: ["标识符", "用户内容"],
    privacy_not_linked: ["使用数据", "诊断"],
    events: [
      {
        badge: "现已推出",
        tag: "官方收录",
        title: `${appName} 现已正式入驻 Web App Store！`,
        desc: `体验全新升级的 ${appName}，感受智能化的现代化 Web 魅力。`,
        image: crawl.coverUrl,
      },
    ],
    related_topics: [
      {
        tag: "精选推荐",
        title: `探索 ${appName} 的核心设计与实用技巧`,
        desc: `深入了解如何利用 ${appName} 大幅提升日常使用体验与效率。`,
        image: crawl.coverUrl,
      },
    ],
    featured: false,
    trending: true,
    created_at: Date.now(),
    updated_at: Date.now(),
  };

  return app;
}
