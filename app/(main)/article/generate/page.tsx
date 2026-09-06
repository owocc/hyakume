"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { SiteHeader } from "@/components/site-header";
import {
  Sparkles,
  ArrowRight,
  RotateCcw,
  Volume2,
  VolumeX,
  BookOpen,
  ArrowLeft,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import type { ArticleItem, AppItem } from "@/lib/types";

// Soft realistic typewriter mechanical click sound generator using Web Audio API
function playTypewriterClick(audioCtx: AudioContext | null, isMuted: boolean) {
  if (!audioCtx || isMuted) return;
  try {
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(140 + Math.random() * 80, audioCtx.currentTime);

    filter.type = "bandpass";
    filter.frequency.setValueAtTime(1200 + Math.random() * 400, audioCtx.currentTime);
    filter.Q.setValueAtTime(3, audioCtx.currentTime);

    gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.045);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.05);
  } catch {}
}

function playTypewriterBell(audioCtx: AudioContext | null, isMuted: boolean) {
  if (!audioCtx || isMuted) return;
  try {
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(2400, audioCtx.currentTime);

    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.65);
  } catch {}
}

const PERSPECTIVES = [
  { id: "精选推荐", label: "精选推荐 (Curated Review)", desc: "综合全貌与产品核心优势" },
  { id: "深度评测", label: "深度评测 (Deep Dive)", desc: "架构细节、体验亮点与使用场景" },
  { id: "开源解读", label: "开源解读 (Open Source)", desc: "针对代码生态、技术选型与贡献价值" },
  { id: "功能解析", label: "功能解析 (Feature Guide)", desc: "核心工作流与高效技巧指南" },
];

function TypewriterGeneratorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, isPending: sessionLoading } = useSession();

  const queryAppId = searchParams.get("appId") || "";
  const queryUrl = searchParams.get("url") || "";

  const [targetInput, setTargetInput] = useState(queryAppId || queryUrl || "");
  const [selectedTag, setSelectedTag] = useState<string>("精选推荐");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [typedLogs, setTypedLogs] = useState<string[]>([]);
  const [createdArticle, setCreatedArticle] = useState<ArticleItem | null>(null);
  const [loadedApp, setLoadedApp] = useState<AppItem | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [activeKeyIndex, setActiveKeyIndex] = useState<number | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const paperScrollRef = useRef<HTMLDivElement>(null);

  // Initialize Web Audio Context
  useEffect(() => {
    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        audioCtxRef.current = new AudioContextClass();
      }
    } catch {}
    return () => {
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  // Preload App info if appId supplied
  useEffect(() => {
    if (queryAppId) {
      fetch(`/api/apps/${queryAppId}`)
        .then(async (res) => {
          if (!res.ok) return;
          const json = (await res.json()) as { success?: boolean; app?: AppItem };
          if (json.success && json.app) {
            setLoadedApp(json.app);
            setTargetInput(json.app.name || json.app.url);
          }
        })
        .catch(() => {});
    }
  }, [queryAppId]);

  // Auto-scroll the paper as lines are typed
  useEffect(() => {
    if (paperScrollRef.current) {
      paperScrollRef.current.scrollTop = paperScrollRef.current.scrollHeight;
    }
  }, [typedLogs]);

  // Handle typing key animations
  const triggerKeyStroke = () => {
    playTypewriterClick(audioCtxRef.current, isMuted);
    setActiveKeyIndex(Math.floor(Math.random() * 11));
    setTimeout(() => setActiveKeyIndex(null), 80);
  };

  const startTypewriterProcess = async () => {
    if (!session?.user) {
      const current = window.location.pathname + window.location.search;
      router.push(`/login?redirect=${encodeURIComponent(current)}`);
      return;
    }

    const clean = targetInput.trim();
    if (!clean) {
      setErrorMsg("请提供应用名称、ID 或网址");
      return;
    }

    setIsGenerating(true);
    setProgress(5);
    setTypedLogs([]);
    setCreatedArticle(null);
    setErrorMsg("");

    // Simulate typing paper feed line
    triggerKeyStroke();
    setTypedLogs([`>> [CARRIAGE_FEED] Rolling vintage manuscript paper into platen...`]);
    const delay = (ms: number): Promise<void> => {
      const { promise, resolve } = Promise.withResolvers<void>();
      setTimeout(resolve, ms);
      return promise;
    };
    try {
      await delay(600);
      triggerKeyStroke();
      setProgress(20);
      setTypedLogs((prev) => [
        ...prev,
        `>> [TARGET_CALIBRATED] Target profile: "${clean}"`,
        `>> [PERSPECTIVE_SELECTED] Editorial angle: "${selectedTag}"`,
      ]);

      await delay(800);
      triggerKeyStroke();
      setProgress(40);
      setTypedLogs((prev) => [
        ...prev,
        `>> [ANALYZING_ARCHITECTURE] Parsing feature set & key attributes...`,
        `>> [INDEPENDENT_STORYTELLING] Inking tailored narrative sections...`,
      ]);

      // Call dedicated Article Generation API
      const res = await fetch("/api/articles/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appId: loadedApp?.id || (clean.startsWith("http") ? undefined : clean),
          url: clean.startsWith("http") ? clean : loadedApp?.url,
          tag: selectedTag,
        }),
      });

      if (!res.ok) {
        const errJson = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(errJson.error || "文章生成未成功，请稍后重试");
      }

      const data = (await res.json()) as {
        success: boolean;
        article: ArticleItem;
        app?: AppItem;
      };

      if (!data.success || !data.article) {
        throw new Error("生成服务返回异常");
      }

      await delay(600);
      triggerKeyStroke();
      setProgress(70);
      setTypedLogs((prev) => [
        ...prev,
        `>> [HEADLINE_INKED] "${data.article.title}"`,
        `>> [SUMMARY_COMPOSED] "${data.article.summary?.slice(0, 70)}..."`,
      ]);

      await delay(600);
      triggerKeyStroke();
      setProgress(90);
      setTypedLogs((prev) => [
        ...prev,
        `>> [VERIFYING_LINKS] Validated ${(data.article.links?.length || 0)} official resources.`,
        `>> [AUTHOR_STAMPED] Inked attribution to @${session.user.name || "You"}.`,
      ]);

      await delay(500);
      playTypewriterBell(audioCtxRef.current, isMuted);
      setProgress(100);
      setTypedLogs((prev) => [
        ...prev,
        `----------------------------------------------------`,
        `[MANUSCRIPT_FINALIZED] 3-Minute Editorial Piece Ready.`,
      ]);
      setCreatedArticle(data.article);
      if (data.app) setLoadedApp(data.app);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "生成发生异常");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#edeae2] dark:bg-[#121310] text-neutral-900 dark:text-neutral-100 flex flex-col justify-between selection:bg-[#788863] selection:text-white transition-colors duration-200">
      {/* Universal Floating Header */}
      <SiteHeader />

      <main className="max-w-5xl mx-auto w-full px-4 sm:px-6 pt-24 pb-16 flex flex-col items-center flex-1">
        {/* Top Control Bar */}
        <div className="w-full flex items-center justify-between pb-6 border-b border-neutral-300 dark:border-neutral-800/80">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-mono font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>RETURN TO DASHBOARD</span>
          </Link>

          {/* Sound Mute Toggle */}
          <button
            type="button"
            onClick={() => setIsMuted(!isMuted)}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/70 dark:bg-card/70 border border-neutral-300 dark:border-neutral-700 text-xs font-mono font-medium text-neutral-700 dark:text-neutral-300 hover:bg-white dark:hover:bg-card transition shadow-2xs cursor-pointer"
            title={isMuted ? "开启打字机机械音效" : "静音打字机音效"}
          >
            {isMuted ? (
              <>
                <VolumeX className="w-3.5 h-3.5 text-neutral-400" />
                <span>MUTE: ON</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5 text-[#788863]" />
                <span>CLACK SOUND: ON</span>
              </>
            )}
          </button>
        </div>

        {/* Perspective & Target Selection Bar */}
        <div className="w-full max-w-2xl mt-6 p-4 rounded-2xl bg-white/80 dark:bg-card/80 border border-neutral-300/80 dark:border-neutral-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-neutral-700 dark:text-neutral-300 uppercase flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#788863]" />
              <span>EDITORIAL MANUSCRIPT DESK (独立文章生成台)</span>
            </span>
            {loadedApp && (
              <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>已绑定: {loadedApp.name}</span>
              </span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2">
            <input
              type="text"
              value={targetInput}
              onChange={(e) => {
                setTargetInput(e.target.value);
                if (errorMsg) setErrorMsg("");
              }}
              placeholder="输入待评测应用名称或网址 (如: Linear, Figma, https://...)"
              disabled={isGenerating}
              className="flex-1 w-full px-4 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#788863]/30"
            />

            {/* Tag / Perspective Selector */}
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              disabled={isGenerating}
              className="w-full sm:w-auto px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-medium text-foreground cursor-pointer focus:outline-none"
            >
              {PERSPECTIVES.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={startTypewriterProcess}
              disabled={isGenerating || !targetInput.trim()}
              className="w-full sm:w-auto px-5 py-2 rounded-xl bg-[#788863] hover:bg-[#687754] active:scale-95 disabled:opacity-50 text-white text-xs font-mono font-bold shadow-xs transition cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>TYPING...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>START TYPEWRITER</span>
                </>
              )}
            </button>
          </div>

          {errorMsg && (
            <p className="text-xs text-red-500 font-medium">{errorMsg}</p>
          )}
        </div>

        {/* 
          ========================================================================
          RETRO TYPEWRITER & MANUSCRIPT PAPER (Replicating Image #1)
          - Top: Warm cream tall paper with ruled lines & typewriter typography
          - Bottom: Vintage olive sage-green mechanical typewriter body
          ========================================================================
        */}
        <div className="w-full max-w-lg mt-8 flex flex-col items-center relative select-none">
          {/* 
            THE MANUSCRIPT PAPER SHEET (Curved top edge, cream color #f6f2ea)
            Emerging from the platen roller cylinder
          */}
          <div
            ref={paperScrollRef}
            className="w-[88%] sm:w-[92%] h-[420px] sm:h-[480px] bg-[#faf7ee] text-[#2c2b29] rounded-t-3xl shadow-lg border-x border-t border-[#e2dccf] p-6 sm:p-8 flex flex-col justify-between overflow-y-auto relative transition-all duration-300 font-mono text-xs"
            style={{
              boxShadow: "0 10px 30px -5px rgba(0, 0, 0, 0.15), inset 0 0 40px rgba(0, 0, 0, 0.02)",
            }}
          >
            {/* Header Line on the Paper (Exact replication from Image #1) */}
            <div>
              <div className="flex items-center justify-between text-[11px] font-mono tracking-wider text-[#636159] pb-2">
                <span>omont.2026</span>
                <span>ai editorial office</span>
              </div>
              <div className="w-full h-px bg-[#4a4945] mb-5" />

              {/* Typed Content Area */}
              <div className="space-y-3 font-mono leading-relaxed min-h-[220px]">
                {typedLogs.length === 0 ? (
                  <div className="pt-8 text-center space-y-3 opacity-60">
                    <p className="text-xs tracking-wide">
                      Awaiting manuscript instruction.
                    </p>
                    <p className="text-[11px] text-[#858277]">
                      Click [START TYPEWRITER] above to ink a new recommendation.
                    </p>
                  </div>
                ) : (
                  typedLogs.map((log, idx) => (
                    <div
                      key={idx}
                      className={`animate-in fade-in duration-150 ${
                        log.startsWith(">> [HEADLINE")
                          ? "font-bold text-sm text-[#11100e] border-l-2 border-[#788863] pl-2 py-0.5 my-2"
                          : log.startsWith(">> [SUMMARY")
                          ? "italic text-xs text-[#44423d] pl-2"
                          : log.startsWith("[MANUSCRIPT")
                          ? "text-[#788863] font-bold"
                          : "text-[#4a473f]"
                      }`}
                    >
                      {log}
                    </div>
                  ))
                )}

                {/* Blinking Mechanical Typewriter Cursor */}
                {isGenerating && (
                  <span className="inline-block w-2 h-3.5 bg-[#2c2b29] animate-pulse ml-0.5 align-middle" />
                )}
              </div>
            </div>

            {/* Bottom Footer Typography on the Paper (Exact replication from Image #1) */}
            <div className="pt-4 mt-auto">
              <div className="text-[11px] font-mono text-[#54524c]">boring office</div>
              <div className="w-full border-b border-dotted border-[#827f76] my-1" />
              <div className="text-[11px] font-mono text-[#6e6b63] tracking-wider flex items-center justify-between">
                <span>old memory of new time ....</span>
                {progress > 0 && <span>[{progress}%]</span>}
              </div>
            </div>
          </div>

          {/* 
            THE MECHANICAL TYPEWRITER BODY AT THE BOTTOM (Exact replication from Image #1)
            - Metallic platen roller with black rubber & chrome spring paper bail
            - Vintage sage-green chassis with rounded curves
            - Circular knurled knobs on left and right
            - Fan arc of metallic typebar hammers
            - Embossed "OMONT" badge
            - Mechanical circular keycaps at the front
          */}
          <div className="w-full bg-[#b8c5a2] rounded-3xl p-4 sm:p-6 shadow-2xl border-t-2 border-[#cfdcba] relative flex flex-col items-center -mt-2 z-10">
            {/* Left & Right Platen Roller Knobs */}
            <div className="absolute -left-3.5 top-6 w-5 sm:w-6 h-12 bg-neutral-300 rounded-lg border border-neutral-400 shadow-md flex flex-col justify-around py-1">
              <span className="w-full h-px bg-neutral-400" />
              <span className="w-full h-px bg-neutral-400" />
              <span className="w-full h-px bg-neutral-400" />
            </div>
            <div className="absolute -right-3.5 top-6 w-5 sm:w-6 h-12 bg-neutral-300 rounded-lg border border-neutral-400 shadow-md flex flex-col justify-around py-1">
              <span className="w-full h-px bg-neutral-400" />
              <span className="w-full h-px bg-neutral-400" />
              <span className="w-full h-px bg-neutral-400" />
            </div>

            {/* Platen Carriage Bar with Silver Clips */}
            <div className="w-full h-4 bg-neutral-800 rounded-md border-t border-neutral-600 flex items-center justify-between px-8 mb-3 shadow-inner">
              <span className="w-3 h-2 bg-neutral-400 rounded-xs" />
              <span className="w-16 h-1 bg-neutral-500 rounded-full" />
              <span className="w-3 h-2 bg-neutral-400 rounded-xs" />
            </div>

            {/* Center Fan of Mechanical Typebar Hammers */}
            <div className="w-48 sm:w-64 h-10 bg-neutral-900/40 rounded-t-full border-t border-neutral-700/50 flex items-center justify-center relative overflow-hidden my-1">
              {/* Radial Typebars */}
              <div className="absolute inset-0 flex justify-center items-end opacity-40">
                {[-45, -30, -15, 0, 15, 30, 45].map((deg, i) => (
                  <div
                    key={i}
                    className="w-0.5 h-9 bg-neutral-300 origin-bottom"
                    style={{ transform: `rotate(${deg}deg)` }}
                  />
                ))}
              </div>
            </div>

            {/* Embossed Brand Name Badge (OMONT) */}
            <div className="my-2 text-center">
              <span className="text-xs sm:text-sm font-serif font-black tracking-[0.25em] text-[#73825e] uppercase drop-shadow-xs">
                OMONT
              </span>
            </div>

            {/* Row of Round Mechanical Keys (matching Image #1) */}
            <div className="flex items-center justify-center gap-1.5 sm:gap-2.5 pt-2 pb-1">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((keyIdx) => (
                <div
                  key={keyIdx}
                  className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#f4efe4] border-2 border-neutral-400 shadow-sm flex items-center justify-center transition-all ${
                    activeKeyIndex === keyIdx ? "scale-90 translate-y-1 bg-neutral-300" : ""
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-neutral-300/60" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 
          ========================================================================
          RESULT CARD & CTAs: Revealed upon manuscript finalization
          ========================================================================
        */}
        {createdArticle && (
          <div className="w-full max-w-lg mt-8 p-5 sm:p-6 rounded-3xl bg-white dark:bg-card border border-emerald-500/30 shadow-xl space-y-4 animate-in slide-in-from-bottom-3 duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  文稿已印制完成并入库
                </span>
              </div>
              <span className="text-[11px] font-mono text-muted-foreground">
                {createdArticle.read_time}
              </span>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-foreground">
                {createdArticle.title}
              </h3>
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                {createdArticle.summary}
              </p>
            </div>

            {/* Direct Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
              <Link
                href={`/article/${createdArticle.id}`}
                className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-[#788863] hover:bg-[#687754] text-white font-semibold text-xs transition shadow-sm flex items-center justify-center gap-2 active:scale-95 text-center"
              >
                <BookOpen className="w-4 h-4" />
                <span>立即阅读正式文章</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>

              <Link
                href="/dashboard"
                className="w-full sm:w-auto py-2.5 px-4 rounded-xl border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-medium transition text-center"
              >
                返回控制台
              </Link>

              <button
                type="button"
                onClick={startTypewriterProcess}
                className="w-full sm:w-auto p-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 transition cursor-pointer flex items-center justify-center"
                title="重新生成"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function TypewriterGeneratorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#edeae2]" />}>
      <TypewriterGeneratorContent />
    </Suspense>
  );
}
