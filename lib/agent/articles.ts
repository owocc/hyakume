import type { AppItem, ArticleLinkItem } from "../types";
import type { CrawlResult } from "../crawler";
import { agentRuntime, type AgentRuntime } from "./runtime";
import { articlePrompt } from "./prompts";
import { hasMeaningfulSource, hasSubstantiveText, sourceUrls } from "./source";
import { assertKeys, detectTargetKind, httpUrl, isValidGithubRepoUrl, isValidXUrl, record, textField } from "./validation";

export interface SubpageAnalysisResult {
  is_meaningful: boolean;
  label: string;
  tag: string;
  title: string;
  summary: string;
  content: string;
  github_url?: string;
  x_url?: string;
  links?: ArticleLinkItem[];
  author: string;
}

export function validateArticle(value: unknown, crawl: CrawlResult): SubpageAnalysisResult {
  const data = record(value);
  assertKeys(data, ["is_meaningful", "label", "tag", "title", "summary", "content", "github_url", "x_url", "links", "author"]);
  if (data.is_meaningful !== true) throw new Error("AI output did not explicitly identify meaningful source content (is_meaningful must be true).");
  const article: SubpageAnalysisResult = {
    is_meaningful: true,
    label: textField(data.label, "label", 40, 1),
    tag: textField(data.tag, "tag", 40, 1),
    title: textField(data.title, "title", 200, 2),
    summary: textField(data.summary, "summary", 1200, 20),
    content: textField(data.content, "content", 20_000, 120),
    author: "",
    links: [],
  };
  if (!hasSubstantiveText(article.content)) throw new Error("AI output article content is repetitive or lacks substantive information.");
  if ("author" in data && textField(data.author, "author", 160) !== "") {
    throw new Error("AI output must not invent publishing attribution; author must be empty.");
  }
  const observed = sourceUrls(crawl);
  const observedUrl = (value: unknown, key: string): string => {
    const text = textField(value, key, 2048, 1);
    const url = httpUrl(text);
    if (!url || !observed.has(url)) throw new Error(`AI output field "${key}" contains a URL not observed in the source.`);
    return url;
  };
  for (const key of ["github_url", "x_url"] as const) {
    if (!(key in data)) continue;
    const text = textField(data[key], key, 2048);
    if (!text) continue;
    const url = observedUrl(text, key);
    const isGithubProfile = detectTargetKind(url).kind === "github_profile" && !new URL(url).search && !new URL(url).hash;
    if (key === "github_url" ? !(isValidGithubRepoUrl(url) || isGithubProfile) : !isValidXUrl(url)) {
      throw new Error(`AI output field "${key}" has an invalid social URL.`);
    }
    article[key] = url;
  }
  if ("links" in data) {
    if (!Array.isArray(data.links) || data.links.length > 20) throw new Error("AI output links must be a bounded array.");
    article.links = data.links.map((item) => {
      const link = record(item);
      assertKeys(link, ["label", "url", "type"]);
      const type = "type" in link ? textField(link.type, "link.type", 20, 1) : "other";
      if (!["website", "docs", "github", "x", "discord", "demo", "community", "other"].includes(type)) {
        throw new Error("AI output link has an unsupported type.");
      }
      const url = observedUrl(link.url, "link.url");
      if ((type === "github" && detectTargetKind(url).kind === "web_app") || (type === "x" && !isValidXUrl(url))) {
        throw new Error("AI output link type does not match its URL.");
      }
      return { label: textField(link.label, "link.label", 100, 1), url, type };
    });
  }
  // Markdown is rendered downstream; model-authored HTML, images and unobserved link targets are not evidence.
  for (const text of [article.title, article.summary, article.content]) {
    if (/<\/?[a-z][^>]*>|!\[/i.test(text)) throw new Error("AI output must not contain HTML or generated images.");
    const urls = text.match(/https?:\/\/[^\s<>"\]\[()]+/g) ?? [];
    urls.forEach((url) => observedUrl(url.replace(/[.,;，。；]+$/, ""), "content URL"));
    const targets = [...text.matchAll(/\]\(\s*<?([^\s)>]+)>?(?:\s+"[^"]*")?\s*\)/g)];
    targets.forEach((match) => observedUrl(match[1], "Markdown URL"));
    for (const match of text.matchAll(/^\s*\[[^\]]+\]:\s*<?([^\s>]+)>?/gm)) observedUrl(match[1], "Markdown reference URL");
  }
  return article;
}

export async function analyzeAndGenerateArticle(
  crawl: CrawlResult,
  _parentApp?: AppItem,
  runtime: AgentRuntime = agentRuntime,
): Promise<SubpageAnalysisResult> {
  if (!hasMeaningfulSource(crawl)) {
    throw new Error("Article generation stopped: insufficient meaningful source content. Crawl a substantive page before trying again.");
  }
  try {
    return validateArticle(await runtime.complete(articlePrompt(crawl)), crawl);
  } catch (error) {
    const detail = error instanceof Error && error.message.startsWith("AI ") ? error.message : "AI request or schema validation failed.";
    throw new Error(`Article generation stopped: ${detail} No fallback article was created.`);
  }
}
