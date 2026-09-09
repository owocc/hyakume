import type { CrawlResult } from "../crawler";
import { httpUrl } from "./validation";

export function cleanSourceText(value: string): string {
  return value.replace(/<[^>]*>/g, " ")
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&")
    .replace(/\s+/g, " ").trim();
}

export function sourceText(crawl: CrawlResult): string {
  return [crawl.title.slice(0, 500), crawl.description.slice(0, 4000), crawl.text.slice(0, 16000)]
    .map(cleanSourceText).filter(Boolean).join("\n");
}

export function isSourceExcerpt(text: string, crawl: CrawlResult): boolean {
  const source = sourceText(crawl).normalize("NFKC").toLowerCase();
  return text.split(/\n+/).filter((line) => line.trim()).every((line) =>
    source.includes(cleanSourceText(line).normalize("NFKC").toLowerCase()),
  );
}

export function hasMeaningfulSource(crawl: CrawlResult): boolean {
  if (/^(?:just a moment|access denied|attention required|403\b|404\b|page not found|sign in|log in|登录|访问被拒绝)/i.test(crawl.title.trim())) return false;
  const parts = [...new Set([crawl.description, crawl.text].map(cleanSourceText).filter(Boolean))];
  const text = parts.join(" ");
  if (/(?:verify (?:that )?you are human|checking your browser|enable javascript and cookies to continue|请完成(?:安全|人机)验证)/i.test(text) && text.length < 1500) return false;
  return hasSubstantiveText(text);
}

export function hasSubstantiveText(text: string): boolean {
  const withoutUrls = text.replace(/https?:\/\/\S+/g, "");
  const substantive = withoutUrls.replace(/[^\p{L}\p{N}]/gu, "");
  const words = new Set(withoutUrls.toLowerCase().match(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]|\p{L}{3,}/gu) ?? []);
  return substantive.length >= 120 && words.size >= 20;
}

export function sourceUrls(crawl: CrawlResult): Set<string> {
  const found = sourceText(crawl).match(/https?:\/\/[^\s<>"\]\[()]+/g) ?? [];
  return new Set([crawl.url, crawl.githubUrl, crawl.xUrl, ...found]
    .filter((url): url is string => typeof url === "string")
    .map((url) => httpUrl(url.replace(/[.,;，。；]+$/, "")))
    .filter((url): url is string => Boolean(url)));
}
