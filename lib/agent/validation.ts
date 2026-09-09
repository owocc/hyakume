export const ALLOWED_CATEGORIES: Readonly<Record<string, true>> = Object.freeze({ 工具: true, WEB: true, AI: true });

export function record(value: unknown, label = "AI output"): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be a JSON object.`);
  }
  return value as Record<string, unknown>;
}

export function parseJsonObject(raw: string): Record<string, unknown> {
  if (!raw.trim() || raw.length > 100_000) throw new Error("AI output is empty or too large.");
  let value: unknown;
  try { value = JSON.parse(raw); } catch { throw new Error("AI output is not strict JSON."); }
  return record(value);
}

export function isBoilerplate(text: string): boolean {
  return /(?:as an? (?:ai|language model)|作为(?:一个|一名)?(?:AI|人工智能|语言模型)|(?:i (?:cannot|can't|am unable to)|我(?:无法|不能))\s*(?:access|browse|visit|analy[sz]e|访问|浏览|分析)|lorem ipsum|placeholder|待补充|暂无(?:介绍|描述|信息)|开启智能便捷|优秀的现代网络服务|现代化的 Web 应用|行业最高安全标准|重塑工作流|丝滑无阻|无缝体验|全方位深度剖析|全平台现代 Web 浏览器)/i.test(text)
    || /^(?:核心功能|即时体验|多端同步|功能[一二三123]|特色[一二三123]|应用名称|一句话介绍|详细介绍|官方团队|unknown|n\/?a|undefined|null)$/i.test(text.trim());
}

export function textField(value: unknown, key: string, max: number, min = 0): string {
  if (typeof value !== "string") throw new Error(`AI output field "${key}" must be a string.`);
  const text = value.trim();
  if (text.length < min || text.length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(text)) {
    throw new Error(`AI output field "${key}" has an invalid length or control characters.`);
  }
  if (/<\/?[a-z][^>]*>/i.test(text)) throw new Error(`AI output field "${key}" must not contain HTML.`);
  if (text && isBoilerplate(text)) throw new Error(`AI output field "${key}" contains boilerplate instead of source facts.`);
  return text;
}

export function stringArray(value: unknown, key: string, maxItems: number, maxLength: number): string[] {
  if (!Array.isArray(value) || value.length > maxItems) throw new Error(`AI output field "${key}" must be a bounded string array.`);
  return [...new Set(value.map((item) => textField(item, key, maxLength, 1)))];
}

export function assertKeys(value: Record<string, unknown>, allowed: string[]): void {
  if (Object.keys(value).some((key) => !allowed.includes(key))) throw new Error("AI output contains unsupported fields.");
}

export function httpUrl(value: string): string | undefined {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password ? url.href : undefined;
  } catch { return undefined; }
}

const reservedGithubPaths = new Set([
  "login", "signup", "features", "pricing", "explore", "topics", "trending", "collections", "events",
  "enterprise", "marketplace", "about", "contact", "settings", "search", "organizations", "orgs",
  "stars", "notifications", "dashboard", "sponsors", "readme", "security", "site", "apps",
]);

export type TargetKind = "github_profile" | "github_project" | "web_app";

export function detectTargetKind(urlStr: string): {
  kind: TargetKind;
  githubUsername?: string;
  githubRepo?: { owner: string; repo: string };
} {
  if (!httpUrl(urlStr)) return { kind: "web_app" };
  const url = new URL(urlStr);
  if (!["github.com", "www.github.com"].includes(url.hostname.toLowerCase())) return { kind: "web_app" };
  const parts = url.pathname.split("/").filter(Boolean);
  if (!parts.length || reservedGithubPaths.has(parts[0].toLowerCase()) || !/^[a-z\d](?:[a-z\d-]{0,38})$/i.test(parts[0])) return { kind: "web_app" };
  if (parts.length === 1) return { kind: "github_profile", githubUsername: parts[0] };
  if (!/^[a-z\d_.-]+$/i.test(parts[1])) return { kind: "web_app" };
  return { kind: "github_project", githubRepo: { owner: parts[0], repo: parts[1] } };
}

export function isValidGithubRepoUrl(value?: string | null): boolean {
  if (typeof value !== "string" || detectTargetKind(value).kind !== "github_project") return false;
  const url = new URL(value);
  return url.pathname.split("/").filter(Boolean).length === 2 && !url.search && !url.hash;
}

export function isValidXUrl(value?: string | null): boolean {
  if (typeof value !== "string" || !httpUrl(value)) return false;
  const url = new URL(value);
  if (!["x.com", "www.x.com", "twitter.com", "www.twitter.com"].includes(url.hostname)) return false;
  const parts = url.pathname.split("/").filter(Boolean);
  if (![1, 3].includes(parts.length) || !/^[a-z\d_]{1,15}$/i.test(parts[0])) return false;
  if (["home", "explore", "search", "intent", "login", "signup", "settings", "i", "share"].includes(parts[0].toLowerCase())) return false;
  return !url.search && !url.hash && (parts.length === 1 || (parts[1] === "status" && /^\d+$/.test(parts[2])));
}
