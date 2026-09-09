import type { ReviewFields } from "./types";

export class IngestionError extends Error {
  constructor(message: string, public status = 400, public fieldErrors?: Record<string, string>) {
    super(message);
  }
}

export const EMPTY_FIELDS: ReviewFields = {
  name: "", tagline: "", description: "", categories: ["WEB"],
  preview_features: [], developer: "", icon_url: "", cover_url: "",
};

const PLACEHOLDER = /^(?:test|testing|hello world|undefined|null|n\/a|unknown|待补充|暂无|无|测试|示例|请输入[\s\S]*)[.!。\s]*$/i;
const ERROR_PAGE = /^(?:just a moment|access denied|forbidden|404(?:\s+not found)?|not found|checking your browser|verify you are human|internal server error|service unavailable|访问被拒绝|页面不存在|请完成人机验证)[.!。\s]*$/i;
const BOILERPLATE = /开启智能便捷的 Web 新体验|高效便捷的现代 Web 应用|丰富功能，极速响应|完美兼容桌面端与移动端/;

export function meaningfulText(value: string, min: number): boolean {
  const text = value.trim();
  const chars = text.replace(/[\s\p{P}\p{S}]/gu, "");
  return text.length >= min && chars.length >= Math.min(min, 8) &&
    new Set(chars.toLowerCase()).size >= Math.min(min, 5) &&
    !PLACEHOLDER.test(text) && !ERROR_PAGE.test(text) && !BOILERPLATE.test(text) &&
    !/^(.{1,12})\1{3,}$/u.test(chars);
}

export function safeImageUrl(value: string): boolean {
  if (!value) return true;
  if (/^\/api\/images\/[a-zA-Z0-9_./%-]+$/.test(value) && !value.includes("..")) return true;
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password;
  } catch { return false; }
}

export function validateReviewFields(input: unknown): ReviewFields {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new IngestionError("请填写并确认收录表单");
  }
  const raw = input as Record<string, unknown>;
  const errors: Record<string, string> = {};
  const fields: ReviewFields = { ...EMPTY_FIELDS, categories: [], preview_features: [] };
  const specs = { name: [2, 100], tagline: [8, 200], description: [30, 12000], developer: [0, 100], icon_url: [0, 2048], cover_url: [0, 2048] } as const;
  for (const [key, [min, max]] of Object.entries(specs)) {
    const field = key as keyof typeof specs;
    const value = raw[field];
    if (typeof value !== "string") {
      errors[field] = "必须是文本";
      continue;
    }
    fields[field] = value.trim();
    if (value.trim().length > max || (min > 0 && !meaningfulText(value, min))) {
      errors[field] = `请填写 ${min}–${max} 字的具体内容，不能使用占位符、重复字符或错误页面文字`;
    }
  }
  if (!Array.isArray(raw.categories) || raw.categories.length < 1 || raw.categories.length > 3 ||
      raw.categories.some((item) => typeof item !== "string" || !["WEB", "AI", "工具"].includes(item))) {
    errors.categories = "请选择 1–3 个有效分类";
  } else {
    fields.categories = [...new Set(raw.categories as string[])];
  }
  if (!Array.isArray(raw.preview_features) || raw.preview_features.length > 8 ||
      raw.preview_features.some((item) => typeof item !== "string" || item.length > 160 || !meaningfulText(item, 2))) {
    errors.preview_features = "特色最多 8 条，每条 2–160 字；没有确认的特色可以留空";
  } else {
    fields.preview_features = [...new Set((raw.preview_features as string[]).map((s) => s.trim()))];
  }
  for (const key of ["icon_url", "cover_url"] as const) {
    if (!safeImageUrl(fields[key])) errors[key] = "图片链接必须为 HTTP(S) 或本站图片地址";
  }
  if (Object.keys(errors).length) throw new IngestionError("内容尚未通过校验，请修改标记的字段", 422, errors);
  return fields;
}

export function requireConfirmation(input: unknown): void {
  if (input !== true) throw new IngestionError("请先确认内容准确且有实际意义", 422);
}

export function validDraftId(value: unknown): string {
  if (typeof value !== "string" || !/^[a-zA-Z0-9_-]{6,100}$/.test(value)) {
    throw new IngestionError("无效的草稿 ID");
  }
  return value;
}
