"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useSession } from "@/lib/auth-client";
import { FloatingBooks } from "@/components/floating-books";
import { Footer } from "@/components/footer";
import { SiteHeader } from "@/components/site-header";
import { Globe, ArrowRight, Lock, Loader2, Upload } from "lucide-react";
import { Logo } from "@/components/logo";
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
  const { data: session, isPending } = useSession();
  const t = useTranslations("recommend");

  useEffect(() => {
    setUrl(queryUrl);
  }, [queryUrl]);

  const startPipeline = (target: string, manual = false) => {
    if (isPending) return;
    const recId = "rec_" + crypto.randomUUID();
    const query = new URLSearchParams();
    if (target) query.set("url", target);
    if (manual) query.set("mode", "manual");
    const destination = `/recommend/${recId}?${query.toString()}`;
    if (!session?.user) {
      router.push(`/login?redirect=${encodeURIComponent(destination)}`);
      return;
    }
    router.push(destination);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (isPending) return;
    let target = url.trim();
    try {
      if (!target) throw new Error();
      if (!/^[a-z][a-z\d+.-]*:/i.test(target)) target = `https://${target}`;
      const parsed = new URL(target);
      if (!["http:", "https:"].includes(parsed.protocol)) throw new Error();
      target = parsed.toString();
    } catch {
      setError(t("errorInvalidUrl"));
      return;
    }
    startPipeline(target);
  };

  const handleSelectPreset = (presetUrl: string) => {
    if (isPending) return;
    setUrl(presetUrl);
    setError("");
    startPipeline(presetUrl);
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
                aria-label="来源网址"
                aria-invalid={!!error}
                aria-describedby={error ? "recommend-url-error" : undefined}
                inputMode="url"
                autoComplete="url"
                disabled={isPending}
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
              disabled={isPending}
              className="w-full sm:w-auto px-6 py-3 sm:py-2.5 rounded-xl sm:rounded-full bg-primary text-primary-foreground text-xs sm:text-sm font-medium hover:bg-primary-hover active:scale-[0.98] transition-all flex items-center justify-center gap-2 shrink-0 shadow-sm disabled:opacity-50 disabled:cursor-wait"
            >
              <span>
                {isPending
                  ? "确认登录状态…"
                  : session?.user
                    ? "解析并核对"
                    : "登录后解析"}
              </span>
              {isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <ArrowRight className="w-3.5 h-3.5" />
              )}
            </button>
          </form>

          {error && (
            <p
              id="recommend-url-error"
              role="alert"
              className="text-xs text-red-500 font-medium mt-2.5 animate-fade-in"
            >
              {error}
            </p>
          )}

          <p className="mt-4 text-center text-xs leading-relaxed text-muted-foreground">
            先生成可编辑草稿，核对并明确确认后才会公开发布。
          </p>
          <button
            type="button"
            disabled={isPending}
            onClick={() => startPipeline(url.trim(), true)}
            className="mt-3 inline-flex items-center justify-center gap-2 rounded-full border border-border bg-card/95 px-5 py-2.5 text-sm font-medium shadow-xs hover:bg-muted disabled:cursor-wait disabled:opacity-50"
          >
            <Upload className="h-4 w-4" />
            上传文件 / 手动录入
          </button>

          {!session?.user && !isPending && (
            <div className="flex items-center gap-1.5 mt-2.5 text-[11px] text-muted-foreground/90 bg-muted/40 px-3 py-1 rounded-full border border-border/50">
              <Lock className="w-3 h-3 text-amber-500" />
              <span>解析和上传需要登录，资料会保留至登录后继续</span>
            </div>
          )}
          {/* Quick Preset Chips */}
          <div className="mt-3 sm:mt-5 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 px-2">
            <span className="text-xs text-muted-foreground font-medium mr-1">
              {t("presetLabel")}
            </span>
            {PRESET_URLS.map((preset) => (
              <button
                key={preset.name}
                type="button"
                disabled={isPending}
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
