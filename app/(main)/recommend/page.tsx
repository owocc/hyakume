"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useSession } from "@/lib/auth-client";
import { FloatingBooks } from "@/components/floating-books";
import { Footer } from "@/components/footer";
import { SiteHeader } from "@/components/site-header";
import { Globe, ArrowRight, Lock, X, FileText, RefreshCw, ExternalLink, Loader2, Sparkles } from "lucide-react";
import { Logo } from "@/components/logo";
import type { AppItem } from "@/lib/types";
const PRESET_URLS = [
  { name: "GitHub", url: "https://github.com" },
  { name: "Vercel", url: "https://vercel.com" },
  { name: "Figma", url: "https://www.figma.com" },
  { name: "Linear", url: "https://linear.app" },
  { name: "Excalidraw", url: "https://excalidraw.com" },
];

function RecommendInputContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryUrl = searchParams.get("url") || "";
  const [url, setUrl] = useState(queryUrl);
  const [error, setError] = useState("");
  const [checkingApp, setCheckingApp] = useState(false);
  const [existingAppPrompt, setExistingAppPrompt] = useState<{
    app: AppItem;
    targetUrl: string;
  } | null>(null);
  const { data: session, isPending } = useSession();
  const t = useTranslations("recommend");

  useEffect(() => {
    if (queryUrl && !url) {
      setUrl(queryUrl);
    }
  }, [queryUrl, url]);

  const startPipeline = (target: string, writeArticle: boolean) => {
    const recId = "rec_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    try {
      fetch("/api/user/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: recId, url: target, status: "processing", step: 1, progress: 20 }),
      }).catch(() => {});
    } catch {}
    router.push(`/recommend/${recId}?url=${encodeURIComponent(target)}&writeArticle=${writeArticle}`);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanUrl = url.trim();

    if (!cleanUrl) {
      setError(t("errorInvalidUrl"));
      return;
    }

    // Auto prepend https:// if missing
    let target = cleanUrl;
    if (!target.startsWith("http://") && !target.startsWith("https://")) {
      target = `https://${target}`;
    }

    // Check if user is logged in
    if (!session?.user) {
      const returnUrl = `/recommend?url=${encodeURIComponent(target)}`;
      router.push(`/login?redirect=${encodeURIComponent(returnUrl)}`);
      return;
    }

    // Check if application already exists in DB to prevent unwanted duplicate articles
    setCheckingApp(true);
    try {
      const checkRes = await fetch(`/api/analyze?url=${encodeURIComponent(target)}`);
      if (checkRes.ok) {
        const checkJson = (await checkRes.json()) as { exists?: boolean; app?: AppItem };
        if (checkJson.exists && checkJson.app) {
          setExistingAppPrompt({ app: checkJson.app, targetUrl: target });
          setCheckingApp(false);
          return;
        }
      }
    } catch {}
    setCheckingApp(false);

    // Brand new app: proceed directly
    startPipeline(target, true);
  };

  const handleSelectPreset = async (presetUrl: string) => {
    setUrl(presetUrl);
    setError("");

    if (!session?.user) {
      const returnUrl = `/recommend?url=${encodeURIComponent(presetUrl)}`;
      router.push(`/login?redirect=${encodeURIComponent(returnUrl)}`);
      return;
    }

    setCheckingApp(true);
    try {
      const checkRes = await fetch(`/api/analyze?url=${encodeURIComponent(presetUrl)}`);
      if (checkRes.ok) {
        const checkJson = (await checkRes.json()) as { exists?: boolean; app?: AppItem };
        if (checkJson.exists && checkJson.app) {
          setExistingAppPrompt({ app: checkJson.app, targetUrl: presetUrl });
          setCheckingApp(false);
          return;
        }
      }
    } catch {}
    setCheckingApp(false);

    startPipeline(presetUrl, true);
  };
  return (
    <div className="w-full bg-background text-foreground flex flex-col selection:bg-primary selection:text-primary-foreground transition-colors duration-200">
      {/* Split Island Floating Header */}
      <SiteHeader />

      {/* 
        Hero Section: Strict 100dvh height, no overflow, no internal scroll.
        Floating books surround the canvas, center has sleek input box without text.
      */}
      <div className="h-[100dvh] max-h-[100dvh] w-full flex flex-col justify-between overflow-hidden relative flex-none">
        {/* Floating books background */}
        <FloatingBooks />

        {/* Top Branding */}
        <header className="pt-12 sm:pt-14 md:pt-16 px-4 sm:px-6 flex justify-center items-center z-10 flex-none">
          <Logo variant="hero" href="/" />
        </header>

        {/* Center: Sleek Modern Input Bar without headline text */}
        <section className="px-4 sm:px-6 py-4 w-full max-w-2xl mx-auto z-10 flex flex-col items-center my-auto">
          <form
            onSubmit={handleSubmit}
            className="w-full bg-card/95 backdrop-blur-md rounded-2xl sm:rounded-full border border-input shadow-xs p-2 sm:p-2.5 flex flex-col sm:flex-row items-center gap-2 sm:gap-3 transition-all focus-within:border-primary focus-within:ring-4 focus-within:ring-ring/10"
          >
            <div className="flex items-center gap-3 flex-1 w-full pl-3 sm:pl-4">
              <Globe className="w-5 h-5 text-foreground shrink-0" />
              <input
                type="text"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  if (error) setError("");
                }}
                placeholder={t("urlPlaceholder")}
                className="w-full bg-transparent text-sm sm:text-base text-foreground placeholder-muted-foreground focus:outline-none"
                autoFocus
              />
            </div>

            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-3 sm:py-2.5 rounded-xl sm:rounded-full bg-primary text-primary-foreground text-xs sm:text-sm font-medium hover:bg-primary-hover active:scale-[0.98] transition-all flex items-center justify-center gap-2 shrink-0 shadow-sm"
            >
              <span>{t("submitButton")}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {error && (
            <p className="text-xs text-red-500 font-medium mt-2.5 animate-fade-in">
              {error}
            </p>
          )}

          {!session?.user && !isPending && (
            <div className="flex items-center gap-1.5 mt-2.5 text-[11px] text-muted-foreground/90 bg-muted/40 px-3 py-1 rounded-full border border-border/50">
              <Lock className="w-3 h-3 text-amber-500" />
              <span>发布需要账号登录，点击发布将为您跳转至登录页</span>
            </div>
          )}
          {/* Quick Preset Chips */}
          <div className="mt-3 sm:mt-5 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 px-2">
            <span className="text-xs text-muted-foreground font-medium mr-1">{t("presetLabel")}</span>
            {PRESET_URLS.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => handleSelectPreset(preset.url)}
                className="px-2.5 sm:px-3 py-1 rounded-full bg-card/85 backdrop-blur-xs border border-border text-[11px] sm:text-xs text-foreground font-medium hover:bg-muted hover:border-input transition-all shadow-2xs"
              >
                {preset.name}
              </button>
            ))}
          </div>
        </section>

        {/* Bottom space balance */}
        <div className="h-10 sm:h-14 flex-none" aria-hidden="true" />
      </div>

      {/* 
        Separate Footer Section: Shared with / landing page.
        Revealed upon scrolling down from the 100dvh hero viewport.
      */}
      <Footer />

      {/* Modal Dialog: When app is already recorded, ask whether to generate a new article */}
      {existingAppPrompt && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-150 relative">
            {/* Close button */}
            <button
              type="button"
              onClick={() => setExistingAppPrompt(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header with App Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <img
                  src={existingAppPrompt.app.icon_url}
                  alt={existingAppPrompt.app.name}
                  className="w-12 h-12 rounded-2xl object-cover bg-secondary border border-border shadow-xs shrink-0"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-foreground truncate">
                      {existingAppPrompt.app.name}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-secondary text-[10px] font-semibold text-muted-foreground">
                      {existingAppPrompt.app.category}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {existingAppPrompt.app.tagline || existingAppPrompt.app.url}
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 leading-relaxed space-y-1">
                <p className="font-semibold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>检测到该应用已在平台收录</span>
                </p>
                <p className="text-muted-foreground">
                  为防止生成过多重复文章，您可以自主选择：仅刷新应用数据，或者为您生成一篇专属的新推荐解读文章。
                </p>
              </div>
            </div>

            {/* Choices */}
            <div className="space-y-2.5 pt-1">
              {/* Option A: Only update app info */}
              <button
                type="button"
                onClick={() => {
                  const target = existingAppPrompt.targetUrl;
                  setExistingAppPrompt(null);
                  startPipeline(target, false);
                }}
                className="w-full p-3 rounded-2xl border border-border hover:border-neutral-400 dark:hover:border-neutral-600 bg-secondary/50 hover:bg-secondary transition flex items-center justify-between group cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-background border border-border flex items-center justify-center text-muted-foreground group-hover:text-foreground">
                    <RefreshCw className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-foreground">仅刷新应用信息</div>
                    <div className="text-[11px] text-muted-foreground">更新截图与元数据，不重复生成文章</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
              </button>

              {/* Option B: Write a new dedicated article */}
              <button
                type="button"
                onClick={() => {
                  const target = existingAppPrompt.targetUrl;
                  setExistingAppPrompt(null);
                  startPipeline(target, true);
                }}
                className="w-full p-3 rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition flex items-center justify-between group cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-xs">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-rose-600 dark:text-rose-400">编写一篇新的专属推荐文章</div>
                    <div className="text-[11px] text-rose-500/80 dark:text-rose-400/80">由 AI 深度解析并归属到您的账号下</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-rose-500 group-hover:translate-x-0.5 transition-transform" />
              </button>

              {/* Option C: Directly view existing app */}
              <button
                type="button"
                onClick={() => {
                  const id = existingAppPrompt.app.id;
                  setExistingAppPrompt(null);
                  router.push(`/app/${id}`);
                }}
                className="w-full py-2 text-center text-xs font-medium text-muted-foreground hover:text-foreground transition flex items-center justify-center gap-1"
              >
                <ExternalLink className="w-3 h-3" />
                <span>无需更新，直接查看商店中已有页面</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RecommendInputPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <RecommendInputContent />
    </Suspense>
  );
}
