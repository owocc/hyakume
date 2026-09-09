import { parse, type DefaultTreeAdapterMap } from "parse5";

export interface SeoMetadata {
  sourceUrl: string;
  title: string;
  description: string;
  keywords: string;
  canonicalUrl: string;
  siteName: string;
  imageUrl: string;
  iconUrl: string;
  themeColor: string;
  raw: {
    html: string;
    titles: string[];
    meta: Record<string, string>[];
    links: Record<string, string>[];
  };
}

type Node = DefaultTreeAdapterMap["node"];
type Element = DefaultTreeAdapterMap["element"];

function elements(root: Node): Element[] {
  const result: Element[] = [];
  const pending: Node[] = [root];
  while (pending.length) {
    const node = pending.pop()!;
    if ("tagName" in node) result.push(node);
    if ("childNodes" in node) {
      for (let i = node.childNodes.length - 1; i >= 0; i--) pending.push(node.childNodes[i]);
    }
  }
  return result;
}

function attributes(element: Element): Record<string, string> {
  return Object.fromEntries(element.attrs.map(({ name, value }) => [name, value]));
}

function textContent(root: Node): string {
  if ("value" in root) return root.value;
  if ("childNodes" in root) return root.childNodes.map(textContent).join("");
  return "";
}

function resolveHttpUrl(value: string, baseUrl: string): string {
  if (!value.trim()) return "";
  try {
    const url = new URL(value.trim(), baseUrl);
    return /^(https?):$/.test(url.protocol) && !url.username && !url.password ? url.href : "";
  } catch {
    return "";
  }
}

/** Decoded values use the first nonempty occurrence in document order at each priority. */
export function extractSeoMetadata(html: string, baseUrl: string): SeoMetadata {
  const nodes = elements(parse(html));
  const meta = nodes.filter((node) => node.tagName === "meta").map(attributes);
  const links = nodes.filter((node) => node.tagName === "link").map(attributes);
  const titles = nodes.filter((node) => node.tagName === "title").map(textContent);
  const base = nodes.find((node) => node.tagName === "base" && node.attrs.some((attr) => attr.name === "href"));
  const resolutionBase = base ? resolveHttpUrl(attributes(base).href, baseUrl) || baseUrl : baseUrl;
  const values = (key: string) => meta
    .filter((item) => [item.name, item.property, item.itemprop].some((name) => name?.toLowerCase() === key))
    .map((item) => item.content?.trim() || "");
  const first = (...candidates: string[]) => candidates.find(Boolean) || "";
  const value = (...keys: string[]) => first(...keys.flatMap(values));
  const linked = (rel: string) => links
    .filter((item) => item.rel?.toLowerCase().split(/\s+/).includes(rel))
    .map((item) => item.href || "");
  const url = (...candidates: string[]) => first(...candidates.map((item) => resolveHttpUrl(item, resolutionBase)));

  return {
    sourceUrl: baseUrl,
    title: first(value("og:title"), value("twitter:title"), ...titles.map((item) => item.trim()), value("title")),
    description: value("og:description", "twitter:description", "description"),
    keywords: value("keywords"),
    canonicalUrl: url(...linked("canonical")),
    siteName: value("og:site_name", "application-name"),
    imageUrl: url(...["og:image", "og:image:secure_url", "og:image:url", "twitter:image", "twitter:image:src", "image"].flatMap(values), ...linked("image_src")),
    iconUrl: url(...linked("icon"), ...linked("apple-touch-icon"), ...linked("apple-touch-icon-precomposed"), ...linked("mask-icon")),
    themeColor: value("theme-color", "msapplication-tilecolor"),
    raw: { html, titles, meta, links },
  };
}

export function extractPageText(html: string): string {
  const root = parse(html);
  const body = elements(root).find((node) => node.tagName === "body");
  if (!body) return "";
  const fragments: string[] = [];
  const visit = (node: Node) => {
    if ("tagName" in node && ["script", "style", "template", "noscript", "svg"].includes(node.tagName)) return;
    if ("value" in node) fragments.push(node.value);
    if ("childNodes" in node) node.childNodes.forEach(visit);
  };
  visit(body);
  return fragments.join(" ").replace(/\s+/g, " ").trim().slice(0, 3000);
}

export function hasSeoMetadata(seo: SeoMetadata): boolean {
  return Boolean(seo.title || seo.description || seo.keywords || seo.canonicalUrl || seo.siteName || seo.imageUrl || seo.iconUrl || seo.themeColor);
}

export function isBlockedPage(seo: SeoMetadata, text: string): boolean {
  const titles = [seo.title, ...seo.raw.titles].map((title) => title.trim());
  const errorTitle = /^(?:just a moment(?:\.{3}|…)?|attention required!?\s*(?:\|\s*cloudflare)?|access denied|access to this page has been denied|forbidden|unauthorized|service unavailable|(?:page )?not found|(?:error\s+)?(?:403|404|429|500|502|503|504)(?:\b.*)?|checking your browser|verify (?:that )?you are human|vercel security checkpoint|security (?:check|verification)|robot or human\??|internal server error|bad gateway|this site can[’']t be reached)[.!\s]*$/i;
  if (titles.some((title) => errorTitle.test(title))) return true;
  return /(?:\/cdn-cgi\/challenge-platform\/|id=["']cf-chl-|id=["']challenge-running["'])/i.test(seo.raw.html)
    || /^(?:verify (?:that )?you are human|checking your browser|please enable javascript and cookies to continue)[.!\s]*$/i.test(text);
}
