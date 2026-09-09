"use client";

import { useRef, useState } from "react";
import { FileText, Loader2, Upload } from "lucide-react";
import type { IngestionDraft, ReviewResponse } from "@/lib/ingestion/types";

const MAX_BYTES = 1024 * 1024;
const inputClass =
  "w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/20";

export function IngestionManual({
  initialUrl,
  onDraft,
  onCancel,
}: {
  initialUrl: string;
  onDraft: (draft: IngestionDraft) => void;
  onCancel: () => void;
}) {
  const [url, setUrl] = useState(initialUrl);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const selection = useRef(0);
  const fileInput = useRef<HTMLInputElement>(null);

  async function selectFile(next: File | null) {
    const version = ++selection.current;
    setError("");
    setFieldErrors({});
    setPreview("");
    setFile(null);
    if (!next) return;
    if (!/\.(html?|txt|md|json)$/i.test(next.name) || next.size > MAX_BYTES) {
      setError(
        "请选择 .html、.htm、.txt、.md 或 .json 文件，大小不能超过 1 MB。",
      );
      if (fileInput.current) fileInput.current.value = "";
      return;
    }
    setFile(next);
    try {
      const text = await next.text();
      if (selection.current === version) setPreview(text.slice(0, 6000));
    } catch {
      if (selection.current === version) {
        setFile(null);
        setError("无法读取文件，请重新选择。");
        if (fileInput.current) fileInput.current.value = "";
      }
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setError("");
    setFieldErrors({});
    let target = url.trim();
    try {
      if (!target) throw new Error();
      if (!/^[a-z][a-z\d+.-]*:/i.test(target)) target = `https://${target}`;
      const parsed = new URL(target);
      if (!["http:", "https:"].includes(parsed.protocol)) throw new Error();
      target = parsed.toString();
    } catch {
      setFieldErrors({ url: "请输入有效的 http(s) 来源网址。" });
      return;
    }
    if (new TextEncoder().encode(content).byteLength > MAX_BYTES) {
      setFieldErrors({ content: "粘贴内容不能超过 1 MB。" });
      return;
    }
    setBusy(true);
    try {
      const body = new FormData();
      body.set("url", target);
      if (file) body.set("file", file);
      if (content.trim()) body.set("content", content);
      const response = await fetch("/api/analyze/manual", {
        method: "POST",
        body,
      });
      const data = (await response.json()) as ReviewResponse;
      if (!response.ok || !data.success || !data.draft) {
        setFieldErrors(data.fieldErrors || {});
        throw new Error(
          data.error ||
            (response.status === 401
              ? "登录已失效，请重新登录后重试。"
              : "无法准备草稿，请检查资料后重试。"),
        );
      }
      onDraft(data.draft);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "网络异常，请重试。");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      noValidate
      className="mx-auto max-w-3xl rounded-2xl border border-border bg-card p-5 sm:p-8"
    >
      <h2 className="flex items-center gap-2 text-xl font-semibold">
        <Upload className="h-5 w-5" />
        手动提供资料
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        网页无法解析？上传页面文件或粘贴资料，也可以只填写网址，进入空白表单自行编辑。此步骤只准备草稿，不会发布。
      </p>
      {error && (
        <p
          role="alert"
          className="mt-4 rounded-xl bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-400"
        >
          {error}
        </p>
      )}
      <fieldset disabled={busy} className="mt-6 space-y-5">
        <div>
          <label
            htmlFor="manual-url"
            className="mb-2 block text-sm font-medium"
          >
            来源网址（必填）
          </label>
          <input
            id="manual-url"
            type="text"
            inputMode="url"
            autoComplete="url"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setFieldErrors({});
            }}
            placeholder="https://…"
            className={inputClass}
            aria-invalid={!!fieldErrors.url}
            aria-describedby={fieldErrors.url ? "manual-url-error" : undefined}
          />
          {fieldErrors.url && (
            <p id="manual-url-error" className="mt-2 text-sm text-red-600">
              {fieldErrors.url}
            </p>
          )}
        </div>
        <div>
          <label
            htmlFor="manual-file"
            className="mb-2 block text-sm font-medium"
          >
            上传文件（选填，最大 1 MB）
          </label>
          <input
            ref={fileInput}
            id="manual-file"
            type="file"
            accept=".html,.htm,.txt,.md,.json"
            onChange={(e) => void selectFile(e.target.files?.[0] || null)}
            className="block w-full min-w-0 rounded-xl border border-dashed border-input p-4 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-muted file:px-3 file:py-2 file:text-foreground"
            aria-describedby="manual-file-help"
          />
          <p
            id="manual-file-help"
            className="mt-2 text-xs leading-relaxed text-muted-foreground"
          >
            支持 HTML、TXT、Markdown 和 JSON。JSON 仅导入
            name、tagline、description、categories、preview_features、developer、icon_url、cover_url，其他字段会忽略。分类为
            WEB / AI / 工具。
          </p>
          {file && (
            <div className="mt-3 rounded-xl border border-border p-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="flex min-w-0 items-center gap-2">
                  <FileText className="h-4 w-4 shrink-0" />
                  <span className="break-all">
                    {file.name} · {(file.size / 1024).toFixed(1)} KB
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    void selectFile(null);
                    if (fileInput.current) fileInput.current.value = "";
                  }}
                  className="rounded-lg px-2 py-1 hover:bg-muted"
                >
                  移除
                </button>
              </div>
              <details className="mt-3">
                <summary className="cursor-pointer text-xs text-muted-foreground">
                  纯文本预览（最多前 6000 字符，不会执行 HTML）
                </summary>
                <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-all rounded-lg bg-muted p-3 text-xs">
                  {preview || "文件为空或正在读取…"}
                </pre>
              </details>
            </div>
          )}
        </div>
        <div>
          <label
            htmlFor="manual-content"
            className="mb-2 block text-sm font-medium"
          >
            粘贴资料（选填，最大 1 MB）
          </label>
          <textarea
            id="manual-content"
            rows={8}
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              setFieldErrors({});
            }}
            placeholder="粘贴网页文字、产品说明或 HTML 源码…"
            className={inputClass}
            aria-invalid={!!fieldErrors.content}
          />
        </div>
        {Object.entries(fieldErrors)
          .filter(([key]) => key !== "url")
          .map(([key, message]) => (
            <p key={key} role="alert" className="text-sm text-red-600">
              {message}
            </p>
          ))}
        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {busy ? "正在准备草稿…" : error ? "重试准备草稿" : "准备可编辑草稿"}
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
  );
}
