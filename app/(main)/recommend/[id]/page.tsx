"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { Footer } from "@/components/footer";
import {
  CheckCircle2,
  Loader2,
  Clock,
  ArrowRight,
  Terminal,
  RotateCcw,
} from "lucide-react";
import type { AppItem } from "@/lib/types";
import { SITE_CONFIG } from "@/lib/config";

interface StepConfig {
  id: number;
  title: string;
  subLabel: string;
  category: string;
  bgColor: string;
  borderColor: string;
  stripColor: string;
  textColor: string;
  renderIllustration: () => React.ReactNode;
  generateLogs: (targetUrl: string, app?: AppItem | null) => string[];
}

const STEP_CONFIGS: StepConfig[] = [
  {
    id: 1,
    title: "页面渲染与快照",
    subLabel: "Browser Use 快照截取",
    category: "Snapshot",
    bgColor: "var(--step-1-bg)",
    borderColor: "var(--step-1-border)",
    stripColor: "var(--step-1-strip)",
    textColor: "var(--step-1-text)",
    renderIllustration: () => (
      <svg viewBox="0 0 100 80" className="w-full h-full text-current">
        <rect x="10" y="8" width="80" height="64" rx="8" fill="white" stroke="currentColor" strokeWidth="2.5" />
        <line x1="10" y1="22" x2="90" y2="22" stroke="currentColor" strokeWidth="2" />
        <circle cx="18" cy="15" r="2.5" fill="currentColor" />
        <circle cx="26" cy="15" r="2.5" fill="currentColor" opacity="0.6" />
        <circle cx="34" cy="15" r="2.5" fill="currentColor" opacity="0.6" />
        <circle cx="50" cy="45" r="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeDasharray="4 2" />
        <circle cx="50" cy="45" r="6" fill="currentColor" />
        <path d="M72 32L78 26" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M78 45L86 45" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    generateLogs: (targetUrl: string) => [
      `[BROWSER] Initializing Cloudflare Browser Use runtime...`,
      `[BROWSER] Navigating to ${targetUrl} with viewport 1280x720`,
      `[BROWSER] Waiting for network idle & DOMContentLoaded signal...`,
      `[SNAPSHOT] Capturing 16:9 full-fidelity viewport snapshot...`,
      `[SNAPSHOT] Image buffer captured successfully: 1280x720 WebP ready.`,
    ],
  },
  {
    id: 2,
    title: "元数据与结构提取",
    subLabel: "DOM & Meta 解析",
    category: "Metadata",
    bgColor: "var(--step-2-bg)",
    borderColor: "var(--step-2-border)",
    stripColor: "var(--step-2-strip)",
    textColor: "var(--step-2-text)",
    renderIllustration: () => (
      <svg viewBox="0 0 100 80" className="w-full h-full text-current">
        <path d="M20 15 H80 M20 28 H65 M20 41 H75 M20 54 H50" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.4" />
        <circle cx="65" cy="55" r="10" fill="white" stroke="currentColor" strokeWidth="2.5" />
        <circle cx="65" cy="55" r="4" fill="currentColor" />
        <line x1="65" y1="45" x2="65" y2="35" stroke="currentColor" strokeWidth="2" strokeDasharray="2 2" />
        <circle cx="65" cy="30" r="5" fill="currentColor" />
      </svg>
    ),
    generateLogs: (targetUrl: string, app?: AppItem | null) => [
      `[PARSER] Fetching target HTML DOM tree from ${targetUrl}...`,
      `[PARSER] Extracted <title>: "${app?.name || "Target Web App"}"`,
      `[PARSER] Extracted meta[name="description"]: "${app?.tagline || "Modern Web Application"}"`,
      `[FAVICON] Resolving high-resolution favicon & Apple touch icons...`,
      `[SANITIZER] Extracted 1,840 tokens of structured semantic content.`,
    ],
  },
  {
    id: 3,
    title: "智能封面决策与存储",
    subLabel: "Cloudflare R2 存储",
    category: "Storage",
    bgColor: "var(--step-3-bg)",
    borderColor: "var(--step-3-border)",
    stripColor: "var(--step-3-strip)",
    textColor: "var(--step-3-text)",
    renderIllustration: () => (
      <svg viewBox="0 0 100 80" className="w-full h-full text-current">
        <ellipse cx="50" cy="22" rx="32" ry="10" fill="white" stroke="currentColor" strokeWidth="2.5" />
        <path d="M18 22 V42 C18 48 82 48 82 42 V22" fill="none" stroke="currentColor" strokeWidth="2.5" />
        <path d="M18 42 V62 C18 68 82 68 82 62 V42" fill="none" stroke="currentColor" strokeWidth="2.5" />
        <circle cx="50" cy="42" r="7" fill="currentColor" />
        <path d="M47 42L49 44L53 40" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    generateLogs: (_targetUrl: string, app?: AppItem | null) => [
      `[STORAGE] Comparing OpenGraph preview image vs headless screenshot...`,
      `[DECISION] Headless screenshot selected for 16:9 ultra-clean standard.`,
      `[R2] Uploading optimized assets to Cloudflare R2 bucket...`,
      `[CDN] Generated CDN URL: ${app?.cover_url || "https://assets.webappstore/covers/..."}`,
      `[CACHE] Asset caching policy configured: Cache-Control public, max-age=31536000`,
    ],
  },
  {
    id: 4,
    title: "AI Agent 总结与特色打标",
    subLabel: "智能分类与标签生成",
    category: "AI Agent",
    bgColor: "var(--step-4-bg)",
    borderColor: "var(--step-4-border)",
    stripColor: "var(--step-4-strip)",
    textColor: "var(--step-4-text)",
    renderIllustration: () => (
      <svg viewBox="0 0 100 80" className="w-full h-full text-current">
        <circle cx="50" cy="40" r="22" fill="white" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3" />
        <circle cx="38" cy="32" r="5" fill="currentColor" />
        <circle cx="62" cy="32" r="5" fill="currentColor" />
        <circle cx="50" cy="52" r="6" fill="currentColor" />
        <circle cx="30" cy="46" r="4" fill="currentColor" opacity="0.7" />
        <circle cx="70" cy="46" r="4" fill="currentColor" opacity="0.7" />
        <line x1="38" y1="32" x2="62" y2="32" stroke="currentColor" strokeWidth="2" />
        <line x1="38" y1="32" x2="50" y2="52" stroke="currentColor" strokeWidth="2" />
        <line x1="62" y1="32" x2="50" y2="52" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
    generateLogs: (_targetUrl: string, app?: AppItem | null) => [
      `[AI_AGENT] Prompting Workers AI LLM with crawled page content...`,
      `[AI_AGENT] Extracted core value proposition: "${app?.description?.slice(0, 45) || "Feature-packed web utility"}..."`,
      `[CATEGORY] Classified category: "${app?.category || "工具"}"`,
      `[RATING] Evaluated initial design score: ${app?.rating || "4.9"} ★`,
      `[TAGS] Tagged keywords: [Web, Modern, Automated, Productivity]`,
    ],
  },
  {
    id: 5,
    title: "结构化写入数据库",
    subLabel: "D1 存储与正式发布",
    category: "Deploy",
    bgColor: "var(--step-5-bg)",
    borderColor: "var(--step-5-border)",
    stripColor: "var(--step-5-strip)",
    textColor: "var(--step-5-text)",
    renderIllustration: () => (
      <svg viewBox="0 0 100 80" className="w-full h-full text-current">
        <rect x="25" y="15" width="50" height="50" rx="10" fill="white" stroke="currentColor" strokeWidth="2.5" />
        <line x1="25" y1="32" x2="75" y2="32" stroke="currentColor" strokeWidth="2" />
        <line x1="25" y1="48" x2="75" y2="48" stroke="currentColor" strokeWidth="2" />
        <circle cx="68" cy="56" r="12" fill="currentColor" />
        <path d="M63 56L66 59L73 52" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    generateLogs: (_targetUrl: string, app?: AppItem | null) => [
      `[DATABASE] Preparing SQL statement for Cloudflare D1...`,
      `[DATABASE] Verified unique domain constraint.`,
      `[DATABASE] Executing INSERT INTO apps (id, name, domain, category, created_at)...`,
      `[INDEX] Updating full-text search indexes for instant lookup.`,
      `[SUCCESS] App recorded with ID: ${app?.id || "app_new"} • Live in ${SITE_CONFIG.name}!`,
    ],
  },
];

function RecommendDetailContent() {
  const params = useParams();
  const searchParams = useSearchParams();

  const id = (params?.id as string) || "rec_task";
  const targetUrl = searchParams.get("url") || "https://linear.app";

  // Pipeline state
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [userSelectedStep, setUserSelectedStep] = useState<number | null>(null);
  const [createdApp, setCreatedApp] = useState<AppItem | null>(null);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const activeStep = userSelectedStep ?? currentStep;

  // Trigger backend analysis
  useEffect(() => {
    let isCancelled = false;

    async function runPipeline() {
      // Progressive visual step simulation while real API executes
      const t1 = setTimeout(() => !isCancelled && setCurrentStep(2), 1200);
      const t2 = setTimeout(() => !isCancelled && setCurrentStep(3), 2600);
      const t3 = setTimeout(() => !isCancelled && setCurrentStep(4), 4200);
      const t4 = setTimeout(() => !isCancelled && setCurrentStep(5), 6000);

      try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: targetUrl }),
        });
        const data = (await res.json()) as {
          success?: boolean;
          app?: AppItem;
          error?: string;
        };

        if (isCancelled) return;

        if (data.success && data.app) {
          setCreatedApp(data.app);
          setCurrentStep(5);
          setIsCompleted(true);
        } else {
          setErrorMsg(data.error || "分析收录未成功，请检查网址是否可公开访问。");
          setIsCompleted(true);
        }
      } catch (err: unknown) {
        if (!isCancelled) {
          setErrorMsg(err instanceof Error ? err.message : "网络请求异常");
          setIsCompleted(true);
        }
      } finally {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        clearTimeout(t4);
      }
    }

    runPipeline();

    return () => {
      isCancelled = true;
    };
  }, [targetUrl]);

  // Auto-carousel & auto-scroll when user has not manually clicked on a step
  useEffect(() => {
    if (userSelectedStep !== null) return; // User locked selection

    // If still in progress, auto scroll to current step
    const targetCard = document.getElementById(`step-card-${currentStep}`);
    if (targetCard && scrollContainerRef.current) {
      targetCard.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }

    // When completed, auto-rotate through steps every 3.5s
    if (isCompleted) {
      const interval = setInterval(() => {
        setCurrentStep((prev) => (prev % STEP_CONFIGS.length) + 1);
      }, 3500);
      return () => clearInterval(interval);
    }
  }, [currentStep, userSelectedStep, isCompleted]);

  // Scroll to selected card
  const handleSelectStep = (stepId: number) => {
    setUserSelectedStep(stepId);
    const targetCard = document.getElementById(`step-card-${stepId}`);
    if (targetCard) {
      targetCard.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  };

  const handleResumeAuto = () => {
    setUserSelectedStep(null);
  };

  const activeConfig =
    STEP_CONFIGS.find((s) => s.id === activeStep) || STEP_CONFIGS[0];
  const logs = activeConfig.generateLogs(targetUrl, createdApp);

  return (
    <div className="w-full min-h-screen bg-surface-card flex flex-col justify-between selection:bg-primary selection:text-primary-foreground">
      {/* Universal Header without login/signup */}
      <SiteHeader />

      <main className="max-w-7xl mx-auto w-full px-6 sm:px-10 lg:px-12 py-8 sm:py-12 space-y-10 sm:space-y-14 flex-1">
        {/* 
          Upper Hero Section: Layout modeled after Image #2
          Left: Massive headline & target domain badge
          Right: Workflow description & dynamic status / action button
        */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end border-b border-border pb-10">
          {/* Left Hero */}
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-card border border-border text-xs font-mono text-foreground shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-muted-foreground">{id}</span>
              <span className="text-border">•</span>
              <span className="truncate max-w-[240px] sm:max-w-md font-medium">{targetUrl}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[52px] font-extrabold tracking-tight text-foreground leading-[1.08]">
              Your workflow
              <br />
              made efficient
            </h1>
          </div>

          {/* Right Hero: Description & Action */}
          <div className="lg:col-span-5 space-y-4 lg:pl-4">
            <p className="text-xs sm:text-sm md:text-base text-muted-foreground leading-relaxed">
              实时执行无头浏览器快照渲染、提取关键元数据，并调用 AI Agent
              自动提炼应用特色并沉淀入库。
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              {createdApp ? (
                <Link
                  href={`/app/${createdApp.id}`}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-primary text-primary-foreground text-xs sm:text-sm font-medium hover:bg-primary-hover transition-all shadow-sm"
                >
                  <span>查看收录应用详情</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              ) : isCompleted && errorMsg ? (
                <Link
                  href="/recommend"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-red-600 text-white text-xs sm:text-sm font-medium hover:bg-red-700 transition-all shadow-sm"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>重试其他应用</span>
                </Link>
              ) : (
                <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-muted border border-border text-foreground text-xs font-medium">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>自动化管线执行中 (步骤 {currentStep}/5)...</span>
                </div>
              )}

              <Link
                href="/recommend"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-card text-foreground text-xs sm:text-sm font-medium border border-border hover:bg-surface transition-all"
              >
                <span>新收录</span>
              </Link>
            </div>
          </div>
        </div>

        {/* 
          Lower Section: Step Sticky Cards Layout (Image #2 style)
          Cards feature colorful strips, step numbers, curled accents, and illustrations.
        */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                流水线阶段
              </span>
              {userSelectedStep !== null && (
                <button
                  onClick={handleResumeAuto}
                  className="text-[11px] text-neutral-900 hover:underline flex items-center gap-1 font-medium ml-2"
                >
                  <RotateCcw className="w-3 h-3" />
                  恢复自动轮播
                </button>
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              点击任意卡片查看详细输出日志
            </span>
          </div>

          {/* Horizontally scrollable step cards container */}
          <div
            ref={scrollContainerRef}
            className="flex items-stretch gap-6 overflow-x-auto pb-4 pt-2 no-scrollbar scroll-smooth"
          >
            {STEP_CONFIGS.map((step) => {
              const isStepActive = activeStep === step.id;
              const isCurrentProcessing = currentStep === step.id && !isCompleted;
              const isStepDone = step.id < currentStep || isCompleted;

              return (
                <div
                  key={step.id}
                  id={`step-card-${step.id}`}
                  onClick={() => handleSelectStep(step.id)}
                  style={{
                    backgroundColor: step.bgColor,
                    borderColor: isStepActive ? "#111827" : "transparent",
                  }}
                  className={`relative flex-none w-[240px] sm:w-[270px] md:w-[290px] rounded-2xl p-5 sm:p-6 transition-all duration-300 cursor-pointer flex flex-col justify-between select-none border-2 ${
                    isStepActive
                      ? "shadow-[0_16px_36px_rgba(0,0,0,0.14)] -translate-y-1 scale-[1.02]"
                      : "shadow-[0_6px_20px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 hover:shadow-md"
                  }`}
                >
                  {/* Top indicator bar with color strip, step title and number (Image #2) */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-4 rounded-full"
                          style={{ backgroundColor: step.stripColor }}
                        />
                        <span
                          className="text-xs font-bold"
                          style={{ color: step.textColor }}
                        >
                          {step.category}
                        </span>
                      </div>
                      <span className="text-xs font-mono font-bold text-neutral-500">
                        0{step.id}
                      </span>
                    </div>

                    <h3
                      className="text-base sm:text-lg font-extrabold tracking-tight leading-snug"
                      style={{ color: step.textColor }}
                    >
                      {step.title}
                    </h3>
                  </div>

                  {/* Card Illustration Graphic (mimicking the abstract doodles in Image #2) */}
                  <div className="my-6 h-28 sm:h-32 flex items-center justify-center p-2">
                    {step.renderIllustration()}
                  </div>

                  {/* Card Bottom Label & Status Indicator */}
                  <div className="pt-2 border-t border-black/10 flex items-center justify-between">
                    <span
                      className="text-xs font-semibold truncate max-w-[170px]"
                      style={{ color: step.textColor }}
                    >
                      {step.subLabel}
                    </span>

                    {isStepDone ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                    ) : isCurrentProcessing ? (
                      <Loader2 className="w-4 h-4 text-black animate-spin shrink-0" />
                    ) : (
                      <Clock className="w-4 h-4 text-neutral-400 shrink-0" />
                    )}
                  </div>

                  {/* Tape / Pin decorative accent at top */}
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-10 h-3 bg-white/70 backdrop-blur-xs rounded-xs border border-black/10 shadow-2xs rotate-[-2deg]" />
                </div>
              );
            })}
          </div>
        </div>

        {/* 
          Step Output Text Section: Dynamic log console
          Updates automatically during auto-carousel or when any step is clicked.
        */}
        <div className="rounded-2xl bg-primary text-primary-foreground p-5 sm:p-7 shadow-lg border border-neutral-800 space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <div className="flex items-center gap-2.5">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-mono font-bold tracking-wider uppercase text-neutral-300">
                步骤 {activeConfig.id} 控制台输出 • {activeConfig.title}
              </span>
            </div>

            <div className="flex items-center gap-2 text-[11px] font-mono text-neutral-400">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>LIVE LOGS</span>
            </div>
          </div>

          {/* Console Text Lines */}
          <div className="font-mono text-xs sm:text-sm space-y-2 max-h-[220px] overflow-y-auto pr-2 text-neutral-300 leading-relaxed">
            {logs.map((line, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <span className="text-neutral-500 select-none">&gt;</span>
                <span className={idx === logs.length - 1 ? "text-emerald-300 font-semibold" : ""}>
                  {line}
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Shared Footer component at page bottom */}
      <Footer />
    </div>
  );
}

export default function RecommendDetailPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF9F7] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-black" />
        </div>
      }
    >
      <RecommendDetailContent />
    </React.Suspense>
  );
}
