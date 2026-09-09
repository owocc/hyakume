"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { CheckCircle2, Loader2, Lock, RotateCcw, Upload } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { SiteHeader } from "@/components/site-header";
import { Footer } from "@/components/footer";
import { IngestionReview } from "@/components/ingestion-review";
import { IngestionManual } from "@/components/ingestion-manual";
import type { IngestionDraft, ReviewResponse } from "@/lib/ingestion/types";

function Workflow({
  id,
  targetUrl,
  manual,
  draftId,
}: {
  id: string;
  targetUrl: string;
  manual: boolean;
  draftId: string;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<IngestionDraft | null>(null);
  const [publishedId, setPublishedId] = useState("");
  const [loading, setLoading] = useState(!manual || !!draftId);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const acceptedDraft = useRef("");
  const currentUrl = draft?.url || targetUrl;
  const returnUrl = `/recommend${currentUrl ? `?url=${encodeURIComponent(currentUrl)}` : ""}`;

  const acceptDraft = useCallback(
    (next: IngestionDraft) => {
      acceptedDraft.current = next.id;
      setDraft(next);
      setError("");
      setLoading(false);
      const query = new URLSearchParams({ draftId: next.id, url: next.url });
      if (manual) query.set("mode", "manual");
      router.replace(
        `/recommend/${encodeURIComponent(id)}?${query.toString()}`,
      );
    },
    [id, manual, router],
  );

  useEffect(() => {
    if (draftId && acceptedDraft.current === draftId) return;
    if (manual && !draftId) {
      setLoading(false);
      return;
    }
    if (!draftId && !targetUrl) {
      setLoading(false);
      setError("缺少来源网址。请返回填写网址，或使用手动录入。");
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setError("");
    async function prepare() {
      try {
        const response = draftId
          ? await fetch(`/api/analyze?draftId=${encodeURIComponent(draftId)}`, {
              signal: controller.signal,
              cache: "no-store",
            })
          : await fetch("/api/analyze", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ url: targetUrl, taskId: id }),
              signal: controller.signal,
            });
        const data = (await response.json()) as ReviewResponse;
        if (controller.signal.aborted) return;
        if (!response.ok || !data.success)
          throw new Error(
            data.error ||
              (response.status === 401
                ? "登录已失效，请重新登录后重试。"
                : "无法准备草稿，请检查网址或使用手动录入。"),
          );
        if (data.publishedAppId) setPublishedId(data.publishedAppId);
        else if (data.draft) acceptDraft(data.draft);
        else
          throw new Error(
            "服务未返回可核对的草稿，未自动发布。请重试或使用手动录入。",
          );
      } catch (cause) {
        if (!controller.signal.aborted)
          setError(
            cause instanceof Error ? cause.message : "网络请求异常，请重试。",
          );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void prepare();
    return () => controller.abort();
  }, [id, targetUrl, manual, draftId, attempt, acceptDraft]);

  const stage = publishedId ? 2 : draft ? 1 : 0;
  return (
    <>
      <header className="space-y-4 border-b border-border pb-7">
        <p className="text-xs font-medium text-muted-foreground">
          网址收录 · 人工核对后发布
        </p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {publishedId
            ? "发布成功"
            : draft
              ? "核对并完善发布内容"
              : manual
                ? "手动录入"
                : "准备发布草稿"}
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          解析和上传只生成草稿。核实资料并明确确认后，内容才会公开。
        </p>
        {currentUrl && (
          <p className="break-all rounded-xl border border-border bg-card px-3 py-2 text-sm">
            {currentUrl}
          </p>
        )}
        <ol aria-label="发布阶段" className="grid grid-cols-3 gap-2 pt-2">
          {["准备资料", "核对草稿", "已发布"].map((label, index) => (
            <li
              key={label}
              aria-current={stage === index ? "step" : undefined}
              className={`flex items-center justify-center gap-2 rounded-xl border px-2 py-3 text-xs sm:text-sm ${stage === index ? "border-primary/40 bg-primary/10 font-medium" : "border-border text-muted-foreground"}`}
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-current text-xs">
                {index + 1}
              </span>
              {label}
            </li>
          ))}
        </ol>
      </header>
      {loading ? (
        <section
          role="status"
          className="rounded-2xl border border-border bg-card p-8 text-center"
        >
          <Loader2 className="mx-auto h-7 w-7 animate-spin text-primary" />
          <h2 className="mt-4 font-medium">
            {draftId ? "正在加载已保存的草稿…" : "正在解析网址并准备草稿…"}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            正在等待服务器结果，本页不会自动发布。
          </p>
          <button
            type="button"
            onClick={() => router.push(returnUrl)}
            className="mt-5 rounded-full border border-border px-5 py-2 text-sm hover:bg-muted"
          >
            取消并返回
          </button>
        </section>
      ) : publishedId ? (
        <section
          role="status"
          className="rounded-2xl border border-primary/25 bg-card p-8 text-center"
        >
          <CheckCircle2 className="mx-auto h-10 w-10 text-primary" />
          <h2 className="mt-4 text-xl font-semibold">
            {draft?.kind === "subpage"
              ? "子页面已添加，原应用资料未被覆盖"
              : "内容已发布"}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            服务器已确认发布结果。
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href={`/app/${encodeURIComponent(publishedId)}`}
              className="rounded-full bg-primary px-5 py-3 text-sm text-primary-foreground"
            >
              查看收录详情
            </Link>
            <Link
              href={`/article/generate?appId=${encodeURIComponent(publishedId)}`}
              className="rounded-full border border-border px-5 py-3 text-sm hover:bg-muted"
            >
              撰写相关文章
            </Link>
            <Link
              href="/recommend"
              className="rounded-full border border-border px-5 py-3 text-sm hover:bg-muted"
            >
              继续收录
            </Link>
          </div>
        </section>
      ) : draft ? (
        <IngestionReview
          key={draft.id}
          draft={draft}
          onPublished={setPublishedId}
          onCancel={() => router.push(returnUrl)}
        />
      ) : error ? (
        <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
          <h2 className="text-lg font-semibold">
            {draftId ? "草稿加载失败" : "暂时无法准备草稿"}
          </h2>
          <p
            role="alert"
            className="mt-3 whitespace-pre-wrap break-words text-sm text-red-600 dark:text-red-400"
          >
            {error}
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            未能取得服务器结果。可以重试加载，或保留网址改用上传文件 /
            手动填写。
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setAttempt((value) => value + 1)}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm text-primary-foreground"
            >
              <RotateCcw className="h-4 w-4" />
              重试
            </button>
            <Link
              href={`/recommend/${encodeURIComponent(id)}?mode=manual${currentUrl ? `&url=${encodeURIComponent(currentUrl)}` : ""}`}
              className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-3 text-sm hover:bg-muted"
            >
              <Upload className="h-4 w-4" />
              上传文件 / 手动录入
            </Link>
            <Link
              href={returnUrl}
              className="rounded-full border border-border px-5 py-3 text-sm hover:bg-muted"
            >
              取消
            </Link>
          </div>
        </section>
      ) : manual ? (
        <IngestionManual
          initialUrl={targetUrl}
          onDraft={acceptDraft}
          onCancel={() => router.push(returnUrl)}
        />
      ) : null}
    </>
  );
}

function RecommendDetailContent() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const { data: session, isPending } = useSession();
  const id = params.id;
  const targetUrl = searchParams.get("url") || "";
  const draftId = searchParams.get("draftId") || "";
  const manual = searchParams.get("mode") === "manual";
  const isArticleTask = id.startsWith("art_") || id.startsWith("article_");
  const returnUrl = `/recommend/${encodeURIComponent(id)}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;

  useEffect(() => {
    if (!isPending && session?.user && isArticleTask) {
      router.replace(
        `/article/generate?taskId=${encodeURIComponent(id)}${targetUrl ? `&url=${encodeURIComponent(targetUrl)}` : ""}`,
      );
    }
  }, [isPending, session?.user, isArticleTask, id, targetUrl, router]);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 space-y-7 px-4 pb-12 pt-28 sm:px-8 sm:pt-32">
        {isPending ? (
          <div
            role="status"
            className="flex items-center justify-center gap-2 py-20 text-sm text-muted-foreground"
          >
            <Loader2 className="h-5 w-5 animate-spin" />
            正在确认登录状态…
          </div>
        ) : !session?.user ? (
          <section className="mx-auto max-w-lg rounded-2xl border border-border bg-card p-8 text-center">
            <Lock className="mx-auto h-8 w-8 text-primary" />
            <h1 className="mt-4 text-xl font-semibold">登录后准备并核对资料</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              登录前不会解析网址、上传资料或读取草稿。
            </p>
            <Link
              href={`/login?redirect=${encodeURIComponent(returnUrl)}`}
              className="mt-6 inline-block rounded-full bg-primary px-6 py-3 text-sm text-primary-foreground"
            >
              登录以继续
            </Link>
          </section>
        ) : isArticleTask ? (
          <p
            role="status"
            className="py-20 text-center text-sm text-muted-foreground"
          >
            正在前往打字机文章生成台…
          </p>
        ) : (
          <Workflow
            key={`${id}:${manual}`}
            id={id}
            targetUrl={targetUrl}
            manual={manual}
            draftId={draftId}
          />
        )}
      </main>
      <Footer />
    </div>
  );
}

export default function RecommendDetailPage() {
  return (
    <Suspense
      fallback={
        <div
          role="status"
          className="min-h-screen bg-background p-10 text-center text-muted-foreground"
        >
          正在加载…
        </div>
      }
    >
      <RecommendDetailContent />
    </Suspense>
  );
}
