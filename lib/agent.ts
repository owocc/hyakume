import type { AppItem, ArticleItem } from "./types";
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

export interface SubpageAnalysisResult {
  is_meaningful: boolean;
  label: string;
  tag: string;
  title: string;
  summary: string;
  content: string;
  github_url?: string;
  x_url?: string;
  author: string;
}

export function generateFallbackArticle(
  crawl: CrawlResult,
  parentApp?: AppItem
): SubpageAnalysisResult {
  const parsedUrl = new URL(crawl.url);
  const appName = parentApp?.name || cleanTitle(crawl.title, parsedUrl.hostname);
  const pageTitle = crawl.title || appName;
  const description = crawl.description || `${appName} 是一款优秀的现代网络服务与生产力工具。`;
  const githubUrl = crawl.githubUrl || (crawl.url.includes("github.com") ? crawl.url : undefined);
  const xUrl = crawl.xUrl || (crawl.url.includes("x.com") || crawl.url.includes("twitter.com") ? crawl.url : undefined);
  const isSubpage = parsedUrl.pathname !== "/" && parsedUrl.pathname !== "";

  let label = "核心功能";
  let tag = "精选推荐";
  if (githubUrl || crawl.url.includes("github.com")) {
    label = "GitHub 仓库";
    tag = "开源解读";
  } else if (xUrl || crawl.url.includes("x.com") || crawl.url.includes("twitter.com")) {
    label = "社交动态";
    tag = "社交热议";
  } else if (parsedUrl.pathname.includes("doc") || parsedUrl.pathname.includes("guide") || parsedUrl.pathname.includes("api")) {
    label = "技术文档";
    tag = "深度评测";
  } else if (parsedUrl.pathname.includes("price") || parsedUrl.pathname.includes("plan")) {
    label = "定价方案";
    tag = "功能解析";
  } else if (isSubpage) {
    label = "特色页面";
    tag = "深度评测";
  }

  let articleTitle = `重塑工作流：${appName} 的核心优势与全景实践`;
  if (tag === "开源解读") {
    articleTitle = `深度探秘 ${appName} 开源生态与工程实践`;
  } else if (tag === "社交热议") {
    articleTitle = `X 社区热议：${appName} 体验反响与开发者观点盘点`;
  } else if (isSubpage) {
    articleTitle = `深入剖析 ${appName}：${pageTitle} 与实用价值解读`;
  }

  const summary = `本篇推荐为您全方位深度剖析 ${appName} 的核心技术架构、应用场景与实际使用心得，帮助您发掘更高效的现代化 Web 工作流。`;

  const githubSection = githubUrl
    ? `### 📦 关联代码仓库\n- **GitHub 地址**: [${githubUrl}](${githubUrl})\n- **生态价值**: 该项目在 GitHub 上受到众多开发者关注，代码架构清晰，模块化设计便于二次集成与协作维护。\n- **技术亮点**: 遵循现代前端与云原生规范，提供开放的扩展能力与丰富的接口文档。`
    : `### 📦 开源与生态建设\n- **开放架构**: ${appName} 积极拥抱现代 Web 标准与开放协议，支持与主流开发工具链及自动化脚本无缝协同。\n- **社区集成**: 开发者可基于标准 Webhook 与 API 进行深度定制，打造专属的自动化流程。`;

  const xSection = xUrl
    ? `### 💬 X (Twitter) 动态与社群热议\n- **动态来源**: [关注 X 平台最新热议](${xUrl})\n- **用户评价**: 社区开发者普遍称赞其极速响应与简洁交互，成为许多人日常效率工具栈的常备之选。\n- **使用反馈**: 许多博主分享了将其融入团队协作、知识管理与日常开发的实际范例。`
    : `### 💬 社区反响与口碑沉淀\n- **行业反馈**: 在各大技术社区与开发者社群中，${appName} 凭借出色的性能表现与优雅的设计细节赢得了广泛好评。\n- **高频讨论**: 用户集中探讨其在轻量化协作、跨平台体验以及无缝同步等方面的显著优势。`;

  const content = `# 🌟 核心亮点与产品全貌

${appName} 作为一款现代化的 Web 应用，以其极简的设计理念与卓越的运行性能脱颖而出。

> **快速导读**：${description}

无论是日常轻量使用，还是高强度的专业场景，${appName} 都能带来丝滑无阻的体验。免去传统客户端繁琐的安装配置，只需在浏览器中打开，即可随时随地投入工作。

---

## 🛠️ 核心架构与功能解析

1. **即开即用，极致轻量**：基于现代浏览器引擎优化，内存占用低，启动迅速。
2. **多端自适应响应式布局**：无论是桌面大屏、iPad 平板还是手机端，都能自适应呈现最佳视野。
3. **严密的数据隐私与安全防护**：遵循行业最高安全标准，保障用户交互数据的机密性与完整性。

---

## 💻 GitHub 与代码沉淀

${githubSection}

---

## 🐦 社交反响与社区热议

${xSection}

---

## 💡 深度上手与实用技巧指南

- **技巧一：快捷键与手势加速**：熟练掌握内置全局快捷键，能让常用操作效率翻倍。
- **技巧二：多标签页联动**：利用浏览器分屏或多标签功能，实现数据的高效比对与协同操作。
- **技巧三：沉浸式全屏工作流**：将网页添加到桌面快捷方式或设为 PWA，享受近似原生应用的纯粹沉浸体验。

---

## 🎯 综合研判与适用人群

- **推荐指数**：⭐⭐⭐⭐⭐ (4.9 / 5.0)
- **适用人群**：追求极致效率的开发者、设计师、数字游民以及所有热爱探索优质 Web 工具的现代工作者。

${appName} 成功展示了现代 Web 应用在轻量化与专业性之间的完美平衡，非常值得纳入您的日常工具箱！`;

  return {
    is_meaningful: true,
    label,
    tag,
    title: articleTitle,
    summary,
    content,
    github_url: githubUrl,
    x_url: xUrl,
    author: "AppStore 精选编辑部",
  };
}

export async function analyzeAndGenerateArticle(
  crawl: CrawlResult,
  parentApp?: AppItem
): Promise<SubpageAnalysisResult> {
  const env = await getCloudflareEnv();
  const parsedUrl = new URL(crawl.url);
  const appName = parentApp?.name || cleanTitle(crawl.title, parsedUrl.hostname);
  const fallback = generateFallbackArticle(crawl, parentApp);

  const systemPrompt = `你是一位资深科技媒体主编、开源产品猎手与 Web 产品体验官。
你的任务是对传入的网页内容（可能是一个 Web 应用主站、具体子页面如文档/功能/更新、GitHub 仓库或 X 社区动态）进行深度研判并产出高质量结构化推荐内容。
必须以纯 JSON 格式输出，不要包含任何 markdown 代码块标记，不要包含 \`\`\`json 前缀。

JSON 字段定义如下：
{
  "is_meaningful": true, // 布尔值：若页面有实质内容、实用价值、开源仓库、社区讨论则为 true；若是纯空白页、404、无实质内容的重定向则为 false。
  "label": "2~6字精准页面标注", // 如: "GitHub 仓库", "技术文档", "社交动态", "核心功能", "定价方案", "开源生态"
  "tag": "推荐类型", // 只能从 ["精选推荐", "开源解读", "社交热议", "深度评测"] 中选择一个
  "title": "深度推荐文章标题（生动、有力，针对该页面的特色命名）",
  "summary": "80~150字核心导读摘要",
  "github_url": "如果页面涉及或提供了 GitHub 仓库链接，提取出来，否则输出空字符串",
  "x_url": "如果页面涉及或提供了 X/Twitter 动态或主页链接，提取出来，否则输出空字符串",
  "content": "完整的 Markdown 格式深度推荐文章（需包含：# 🌟 核心亮点与产品全貌、## 🛠️ 核心架构与功能解析、## 💻 GitHub 开源生态与代码沉淀、## 🐦 社交反响与社区热议、## 💡 深度上手与实用技巧指南、## 🎯 综合研判与适用人群）",
  "author": "AppStore 精选编辑部"
}`;

  const userContent = `应用名称: ${appName}
主站地址: ${parentApp?.url || crawl.url}
当前分析目标页面: ${crawl.url}
页面标题: ${crawl.title}
页面描述: ${crawl.description}
已检测到的 GitHub 链接: ${crawl.githubUrl || "无"}
已检测到的 X (Twitter) 链接: ${crawl.xUrl || "无"}
页面正文节选:
${crawl.text.slice(0, 1600)}`;

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
        }
      }
    }
  } catch (aiErr) {
    console.warn("AI article generation encountered issue, using intelligent fallback:", aiErr);
  }

  if (rawText) {
    try {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          is_meaningful: typeof parsed.is_meaningful === "boolean" ? parsed.is_meaningful : true,
          label: typeof parsed.label === "string" && parsed.label.trim() ? parsed.label.trim() : fallback.label,
          tag: typeof parsed.tag === "string" && parsed.tag.trim() ? parsed.tag.trim() : fallback.tag,
          title: typeof parsed.title === "string" && parsed.title.trim() ? parsed.title.trim() : fallback.title,
          summary: typeof parsed.summary === "string" && parsed.summary.trim() ? parsed.summary.trim() : fallback.summary,
          content: typeof parsed.content === "string" && parsed.content.length > 50 ? parsed.content.trim() : fallback.content,
          github_url: parsed.github_url || crawl.githubUrl || fallback.github_url,
          x_url: parsed.x_url || crawl.xUrl || fallback.x_url,
          author: parsed.author || fallback.author,
        };
      }
    } catch (parseErr) {
      console.warn("Failed to parse AI article JSON, using fallback:", parseErr);
    }
  }

  return fallback;
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

  try {
    const articleAnalysis = await analyzeAndGenerateArticle(crawl, app);
    const initialArticleId = "art_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const initialArticle: ArticleItem = {
      id: initialArticleId,
      app_id: id,
      slug: `${id}-${Date.now().toString(36)}`,
      title: articleAnalysis.title,
      summary: articleAnalysis.summary,
      tag: articleAnalysis.tag,
      content: articleAnalysis.content,
      cover_image: crawl.coverUrl,
      github_url: articleAnalysis.github_url,
      x_url: articleAnalysis.x_url,
      source_url: crawl.url,
      author: articleAnalysis.author,
      read_time: "3 分钟阅读",
      views: 0,
      likes: 0,
      created_at: Date.now(),
      updated_at: Date.now(),
    };

    app.related_topics = [
      {
        tag: articleAnalysis.tag,
        title: articleAnalysis.title,
        desc: articleAnalysis.summary,
        image: crawl.coverUrl,
        article_id: initialArticleId,
        github_url: articleAnalysis.github_url,
        x_url: articleAnalysis.x_url,
      },
    ];
    app.articles = [initialArticle];
  } catch (artErr) {
    console.warn("Failed to generate initial article for app:", artErr);
  }

  return app;
}
