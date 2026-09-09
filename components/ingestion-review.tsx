"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Plus, Trash2 } from "lucide-react";
import type { IngestionDraft, ReviewFields } from "@/lib/ingestion/types";

const inputClass =
  "w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/20 disabled:opacity-60";
const categories = ["WEB", "AI", "工具"];

function validate(fields: ReviewFields) {
  const errors: Record<string, string> = {};
  const lengths = {
    name: [2, 100],
    tagline: [8, 200],
    description: [30, 12000],
  } as const;
  for (const [key, [min, max]] of Object.entries(lengths)) {
    const length = fields[key as keyof typeof lengths].trim().length;
    if (length < min || length > max)
      errors[key] = `请填写 ${min}–${max} 个字符。`;
  }
  if (
    !fields.categories.length ||
    fields.categories.length > 3 ||
    fields.categories.some((value) => !categories.includes(value))
  ) {
    errors.categories = "请选择 1–3 个分类：WEB、AI、工具。";
  }
  if (
    fields.preview_features.length > 8 ||
    fields.preview_features.some(
      (value) => value.trim().length < 2 || value.trim().length > 160,
    )
  ) {
    errors.preview_features =
      "最多 8 项特色，每项需为 2–160 个字符；不需要的空行请删除。";
  }
  if (fields.developer.trim().length > 100)
    errors.developer = "开发者名称不能超过 100 个字符。";
  for (const key of ["icon_url", "cover_url"] as const) {
    const value = fields[key].trim();
    if (!value) continue;
    try {
      if (value.startsWith("/api/images/") && !value.includes("\\")) continue;
      const url = new URL(value);
      if (!["http:", "https:"].includes(url.protocol)) throw new Error();
    } catch {
      errors[key] =
        "请输入 http(s) 图片网址或 /api/images/ 开头的本地图片路径，也可留空。";
    }
  }
  return errors;
}

export function IngestionReview({
  draft,
  onPublished,
  onCancel,
}: {
  draft: IngestionDraft;
  onPublished: (id: string) => void;
  onCancel: () => void;
}) {
  const [fields, setFields] = useState<ReviewFields>(() => ({
    ...draft.fields,
    categories: [...draft.fields.categories],
    preview_features: [...draft.fields.preview_features],
  }));
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const seo = (draft.crawl as IngestionDraft["crawl"] & { seo?: unknown }).seo;

  function update<K extends keyof ReviewFields>(
    key: K,
    value: ReviewFields[K],
  ) {
    setFields((current) => ({ ...current, [key]: value }));
    setConfirmed(false);
    setErrors((current) =>
      Object.fromEntries(
        Object.entries(current).filter(
          ([name]) => name !== key && !name.startsWith(`${key}.`),
        ),
      ),
    );
    setError("");
  }

  async function publish(event: React.FormEvent) {
    event.preventDefault();
    if (busy || !confirmed) return;
    const nextErrors = validate(fields);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      setError("请修正下方标出的字段，然后重新确认。 ");
      setConfirmed(false);
      return;
    }
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/analyze/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draftId: draft.id, fields, confirmed: true }),
      });
      const data = (await response.json()) as {
        success?: boolean;
        app?: { id: string };
        appId?: string;
        error?: string;
        fieldErrors?: Record<string, string>;
      };
      if (!response.ok || !data.success) {
        setErrors(data.fieldErrors || {});
        throw new Error(
          data.error ||
            (response.status === 401
              ? "登录已失效，请重新登录后打开本草稿。"
              : "发布未成功，请检查内容后重试。"),
        );
      }
      const appId = data.appId || data.app?.id;
      if (!appId)
        throw new Error("未收到发布结果，请刷新本页核实草稿状态后再重试。");
      onPublished(appId);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "网络异常，请重试。若请求已发送，可刷新本页核实发布状态。",
      );
      setConfirmed(false);
    } finally {
      setBusy(false);
    }
  }

  function fieldError(key: string) {
    const message = errors[key];
    return message ? (
      <p
        id={`${key}-error`}
        className="mt-1.5 text-sm text-red-600 dark:text-red-400"
      >
        {message}
      </p>
    ) : null;
  }

  return (
    <div className="space-y-6">
      {draft.kind === "subpage" && (
        <div
          role="note"
          className="rounded-2xl border border-primary/30 bg-primary/10 p-4 text-sm"
        >
          此网址属于已收录应用。本次将添加一个子页面，不会覆盖原应用的名称、介绍或其他资料。
        </div>
      )}
      {draft.warnings.length > 0 && (
        <section
          className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4"
          aria-label="解析提醒"
        >
          <h2 className="font-medium">请留意以下内容</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            {draft.warnings.map((warning, index) => (
              <li key={index}>{warning}</li>
            ))}
          </ul>
        </section>
      )}
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <form
          onSubmit={publish}
          noValidate
          className="min-w-0 rounded-2xl border border-border bg-card p-5 sm:p-6"
        >
          <h2 className="text-xl font-semibold">
            {draft.kind === "subpage" ? "子页面发布内容" : "发布内容"}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            请核实并编辑以下资料。修改仅用于发布，不会改写右侧的原始
            SEO。草稿来源已保存，未提交的编辑刷新后会丢失。
          </p>
          {error && (
            <div
              role="alert"
              className="mt-4 rounded-xl bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-400"
            >
              {error}
            </div>
          )}
          <fieldset disabled={busy} className="mt-6 space-y-5">
            {(
              [
                ["name", "名称", "2–100 个字符"],
                ["tagline", "一句话介绍", "8–200 个字符"],
                ["description", "详细描述", "30–12000 个字符"],
              ] as const
            ).map(([key, label, hint]) => (
              <div key={key}>
                <label htmlFor={key} className="mb-2 block text-sm font-medium">
                  {label}{" "}
                  <span className="font-normal text-muted-foreground">
                    （必填，{hint}）
                  </span>
                </label>
                {key === "description" ? (
                  <textarea
                    id={key}
                    rows={8}
                    value={fields[key]}
                    onChange={(e) => update(key, e.target.value)}
                    aria-invalid={!!errors[key]}
                    aria-describedby={errors[key] ? `${key}-error` : undefined}
                    className={inputClass}
                  />
                ) : (
                  <input
                    id={key}
                    value={fields[key]}
                    onChange={(e) => update(key, e.target.value)}
                    aria-invalid={!!errors[key]}
                    aria-describedby={errors[key] ? `${key}-error` : undefined}
                    className={inputClass}
                  />
                )}
                {fieldError(key)}
              </div>
            ))}
            <fieldset
              aria-describedby={
                errors.categories ? "categories-error" : undefined
              }
            >
              <legend className="mb-2 text-sm font-medium">
                分类（必填，选择 1–3 项）
              </legend>
              <div className="flex flex-wrap gap-3">
                {categories.map((category) => (
                  <label
                    key={category}
                    className="flex cursor-pointer items-center gap-2 rounded-xl border border-input px-4 py-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={fields.categories.includes(category)}
                      onChange={(e) =>
                        update(
                          "categories",
                          e.target.checked
                            ? [...fields.categories, category]
                            : fields.categories.filter(
                                (item) => item !== category,
                              ),
                        )
                      }
                      className="accent-primary"
                    />
                    {category}
                  </label>
                ))}
              </div>
              {fieldError("categories")}
            </fieldset>
            <div>
              <p className="mb-2 text-sm font-medium">
                特色（选填，最多 8 项，每项 2–160 个字符）
              </p>
              <div className="space-y-2">
                {fields.preview_features.map((feature, index) => (
                  <div key={index}>
                    <div className="flex items-center gap-2">
                      <input
                        aria-label={`特色 ${index + 1}`}
                        value={feature}
                        onChange={(e) =>
                          update(
                            "preview_features",
                            fields.preview_features.map((item, i) =>
                              i === index ? e.target.value : item,
                            ),
                          )
                        }
                        className={inputClass}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          update(
                            "preview_features",
                            fields.preview_features.filter(
                              (_, i) => i !== index,
                            ),
                          )
                        }
                        aria-label={`删除特色 ${index + 1}`}
                        className="rounded-lg p-2 hover:bg-muted"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    {fieldError(`preview_features.${index}`)}
                  </div>
                ))}
              </div>
              {fieldError("preview_features")}
              <button
                type="button"
                disabled={fields.preview_features.length >= 8}
                onClick={() =>
                  update("preview_features", [...fields.preview_features, ""])
                }
                className="mt-2 inline-flex items-center gap-1 rounded-lg px-2 py-2 text-sm hover:bg-muted disabled:opacity-40"
              >
                <Plus className="h-4 w-4" />
                添加特色
              </button>
            </div>
            {(
              [
                ["developer", "开发者", "最多 100 个字符"],
                ["icon_url", "图标网址", "http(s) 或 /api/images/ 路径"],
                ["cover_url", "封面网址", "http(s) 或 /api/images/ 路径"],
              ] as const
            ).map(([key, label, hint]) => (
              <div key={key}>
                <label htmlFor={key} className="mb-2 block text-sm font-medium">
                  {label}{" "}
                  <span className="font-normal text-muted-foreground">
                    （选填）
                  </span>
                </label>
                <input
                  id={key}
                  value={fields[key]}
                  placeholder={hint}
                  onChange={(e) => update(key, e.target.value)}
                  aria-invalid={!!errors[key]}
                  aria-describedby={errors[key] ? `${key}-error` : undefined}
                  className={inputClass}
                />
                {fieldError(key)}
              </div>
            ))}
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-primary/25 bg-primary/5 p-4 text-sm leading-relaxed">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-1 h-4 w-4 shrink-0 accent-primary"
              />
              <span>
                我已核对发布内容，确认资料正确、描述有实际意义，不是错误页面、占位内容或无关信息。
                {draft.kind === "subpage"
                  ? "我确认添加子页面，不覆盖已有应用。"
                  : "我确认将以上内容公开发布。"}
              </span>
            </label>
            <p className="text-xs text-muted-foreground">
              任何编辑都会取消勾选，需要重新确认。只有点击下方按钮才会发布。
            </p>
            {Object.entries(errors)
              .filter(
                ([key]) =>
                  ![
                    "name",
                    "tagline",
                    "description",
                    "categories",
                    "preview_features",
                    "developer",
                    "icon_url",
                    "cover_url",
                  ].includes(key) && !key.startsWith("preview_features."),
              )
              .map(([key, message]) => (
                <p key={key} role="alert" className="text-sm text-red-600">
                  {message}
                </p>
              ))}
            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={!confirmed || busy}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40"
              >
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                {busy
                  ? "正在发布…"
                  : error
                    ? "确认并重试发布"
                    : draft.kind === "subpage"
                      ? "确认添加子页面"
                      : "确认发布"}
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="rounded-full border border-border px-5 py-3 text-sm hover:bg-muted"
              >
                取消
              </button>
            </div>
          </fieldset>
        </form>
        <aside className="min-w-0 space-y-4 rounded-2xl border border-border bg-muted/30 p-5 sm:p-6">
          <h2 className="text-lg font-semibold">原始来源 / SEO（只读）</h2>
          <p className="text-xs text-muted-foreground">
            {draft.source === "manual" ? "来自手动提供的资料" : "来自网址解析"}
            ，仅供核对，不等于最终发布内容。
          </p>
          <dl className="space-y-4 break-words text-sm">
            <div>
              <dt className="mb-1 text-muted-foreground">来源网址</dt>
              <dd>{draft.url}</dd>
            </div>
            <div>
              <dt className="mb-1 text-muted-foreground">原始标题</dt>
              <dd className="whitespace-pre-wrap">
                {draft.crawl.title || "未提取到标题"}
              </dd>
            </div>
            <div>
              <dt className="mb-1 text-muted-foreground">原始描述</dt>
              <dd className="whitespace-pre-wrap">
                {draft.crawl.description || "未提取到描述"}
              </dd>
            </div>
          </dl>
          <details open>
            <summary className="cursor-pointer text-sm font-medium">
              SEO 元数据
            </summary>
            <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap break-all rounded-xl bg-background p-3 text-xs">
              {seo ? JSON.stringify(seo, null, 2) : "未提供 SEO 元数据"}
            </pre>
          </details>
          <details>
            <summary className="cursor-pointer text-sm font-medium">
              原始正文
            </summary>
            <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap break-words rounded-xl bg-background p-3 font-sans text-sm">
              {draft.crawl.text || "未提取到正文，请自行补充有意义的发布内容。"}
            </pre>
          </details>
        </aside>
      </div>
    </div>
  );
}
