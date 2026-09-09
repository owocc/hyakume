import { normalizeUrl, type CrawlResult } from "../crawler";
import { extractSeoMetadata, extractPageText, isBlockedPage } from "../seo";
import type { ReviewFields } from "./types";
import { EMPTY_FIELDS, IngestionError } from "./validation";
import { decodeText, MAX_UPLOAD_BYTES, readBoundedBody, readJson } from "./http";

export function parseManualContent(url: string, content: string, extension: string): { crawl: CrawlResult; fields?: Partial<ReviewFields> } {
  const crawl: CrawlResult = { url, title: "", description: "", text: "", iconUrl: "", coverUrl: "", screenshots: [], usedSeoImage: false, warnings: [] };
  if (!content.trim()) return { crawl };
  if (extension === "json") {
    let data: Record<string, unknown>;
    try {
      const parsed: unknown = JSON.parse(content);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("object required");
      data = parsed as Record<string, unknown>;
    } catch { throw new IngestionError("JSON 文件必须包含一个有效的应用信息对象"); }
    const fields: Partial<ReviewFields> = {};
    for (const key of Object.keys(EMPTY_FIELDS) as (keyof ReviewFields)[]) {
      if (!(key in data)) continue;
      const value = data[key];
      if (key === "categories" || key === "preview_features") {
        if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
          throw new IngestionError(`${key} 必须是文本数组`);
        }
        fields[key] = value as string[];
      } else {
        if (typeof value !== "string") throw new IngestionError(`${key} 必须是文本`);
        fields[key] = value;
      }
    }
    crawl.title = fields.name || "";
    crawl.description = fields.description || fields.tagline || "";
    crawl.text = crawl.description;
    return { crawl, fields };
  }
  if (extension === "html" || extension === "htm") {
    const seo = extractSeoMetadata(content, url);
    const text = extractPageText(content);
    crawl.seo = seo;
    if (isBlockedPage(seo, text)) {
      crawl.warnings!.push("上传内容是错误页或验证页面，请提供真实产品内容。原始 SEO 仅供核对。");
    } else {
      crawl.title = seo.title;
      crawl.description = seo.description;
      crawl.text = text;
      crawl.iconUrl = seo.iconUrl;
      crawl.seoImage = seo.imageUrl;
      crawl.coverUrl = seo.imageUrl;
      crawl.usedSeoImage = Boolean(seo.imageUrl);
    }
    return { crawl };
  }
  const text = content.trim();
  crawl.text = text.slice(0, 3000);
  crawl.description = text.slice(0, 12000);
  if (text.length > 12000) crawl.warnings!.push("文本超过表单长度限制，仅预填前 12000 字，请检查内容是否完整。");
  return { crawl };
}

export async function readManualRequest(request: Request) {
  let rawUrl: unknown;
  let content = "";
  let extension = "txt";
  if (request.headers.get("content-type")?.startsWith("multipart/form-data")) {
    const bytes = await readBoundedBody(request, MAX_UPLOAD_BYTES + 64 * 1024);
    let form: FormData;
    try {
      form = await new Response(bytes as BodyInit, { headers: { "Content-Type": request.headers.get("content-type")! } }).formData();
    } catch { throw new IngestionError("上传表单格式错误"); }
    rawUrl = form.get("url");
    const pasted = form.get("content");
    if (pasted !== null && typeof pasted !== "string") throw new IngestionError("粘贴内容必须是文本");
    content = pasted || "";
    const file = form.get("file");
    if (file && typeof file !== "string" && file.size) {
      if (content.trim()) throw new IngestionError("请选择上传文件或粘贴文本，不要同时提供两种内容");
      extension = file.name.split(".").pop()?.toLowerCase() || "";
      if (!["html", "htm", "txt", "md", "json"].includes(extension)) throw new IngestionError("仅支持 HTML、TXT、Markdown 和 JSON 文件");
      if (file.size > MAX_UPLOAD_BYTES) throw new IngestionError("文件不能超过 1 MB", 413);
      content = decodeText(new Uint8Array(await file.arrayBuffer()));
    } else if (typeof file === "string" && file) throw new IngestionError("上传文件格式错误");
  } else {
    const body = await readJson(request, MAX_UPLOAD_BYTES + 64 * 1024);
    rawUrl = body.url;
    if (body.content !== undefined && typeof body.content !== "string") throw new IngestionError("内容必须是文本");
    content = (body.content as string) || "";
  }
  if (new TextEncoder().encode(content).length > MAX_UPLOAD_BYTES) throw new IngestionError("内容不能超过 1 MB", 413);
  if (typeof rawUrl !== "string" || !rawUrl.trim() || rawUrl.length > 2048) throw new IngestionError("请提供对应的网站 URL");
  let url: string;
  try { url = normalizeUrl(rawUrl); } catch { throw new IngestionError("请提供公开的 HTTP(S) 网址"); }
  return { url, manual: parseManualContent(url, content, extension) };
}
