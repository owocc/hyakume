"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { SiteHeader } from "@/components/site-header";
import { Footer } from "@/components/footer";
import {
  Sparkles,
  ArrowRight,
  RotateCcw,
  Volume2,
  VolumeX,
  BookOpen,
  CheckCircle2,
  Loader2,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import type { ArticleItem, AppItem, PipelineTaskItem } from "@/lib/types";

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
  const queryTaskId = searchParams.get("taskId") || "";

  const [targetInput, setTargetInput] = useState(queryAppId || queryUrl || "");
  const [selectedTag, setSelectedTag] = useState<string>("精选推荐");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [typedLogs, setTypedLogs] = useState<string[]>([]);
  const [createdArticle, setCreatedArticle] = useState<ArticleItem | null>(null);
  const [loadedApp, setLoadedApp] = useState<AppItem | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isConfigOpen, setIsConfigOpen] = useState<boolean>(false);
  const [isZoomed, setIsZoomed] = useState<boolean>(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const paperScrollRef = useRef<HTMLDivElement>(null);
  const currentRunId = useRef<number>(0);
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

  // Support tracking taskId on typewriter page
  useEffect(() => {
    if (!queryTaskId) return;

    let isSubscribed = true;

    async function syncTask() {
      try {
        const res = await fetch(`/api/user/tasks?taskId=${encodeURIComponent(queryTaskId)}`);
        if (!res.ok) return;
        const json = (await res.json()) as { success?: boolean; task?: PipelineTaskItem };
        if (!json.success || !json.task || !isSubscribed) return;

        const t = json.task;
        if (t.url) setTargetInput(t.url);
        if (t.progress) setProgress(t.progress);

        setTypedLogs((prev) => {
          const logMsg = `>> [TASK_SYNC] ${t.step_name} (${t.progress}%)`;
          return prev.includes(logMsg) ? prev : [...prev, logMsg];
        });

        if (t.status === "processing") {
          setIsGenerating(true);
          playTypewriterClick(audioCtxRef.current, isMuted);
        } else if (t.status === "completed") {
          setIsGenerating(false);
          setProgress(100);
          playTypewriterBell(audioCtxRef.current, isMuted);
          if (t.article_id) {
            const artRes = await fetch(`/api/articles/${t.article_id}`);
            if (artRes.ok) {
              const artJson = (await artRes.json()) as { success?: boolean; article?: ArticleItem };
              if (artJson.article && isSubscribed) {
                setCreatedArticle(artJson.article);
              }
            }
          }
        } else if (t.status === "failed") {
          setIsGenerating(false);
          setErrorMsg(t.error || "打字机印制中断");
        }
      } catch {}
    }

    syncTask();

    const timer = setInterval(syncTask, 2000);
    return () => {
      isSubscribed = false;
      clearInterval(timer);
    };
  }, [queryTaskId, isMuted]);
  useEffect(() => {
    if (paperScrollRef.current) {
      paperScrollRef.current.scrollTop = paperScrollRef.current.scrollHeight;
    }
  }, [typedLogs]);

  // Handle typing key animations
  const triggerKeyStroke = () => {
    playTypewriterClick(audioCtxRef.current, isMuted);
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

    const taskId =
      queryTaskId ||
      "art_task_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

    if (!queryTaskId) {
      const newUrl = `/article/generate?taskId=${taskId}&url=${encodeURIComponent(clean)}`;
      window.history.replaceState(null, "", newUrl);
    }

    const runId = ++currentRunId.current;

    setIsGenerating(true);
    setProgress(5);
    setTypedLogs([]);
    setCreatedArticle(null);
    setErrorMsg("");

    const delay = (ms: number): Promise<void> => {
      const { promise, resolve } = Promise.withResolvers<void>();
      setTimeout(resolve, ms);
      return promise;
    };

    // True mechanical typewriter typing function (character-by-character with audible clicks)
    const typeLine = async (line: string, charSpeed = 20) => {
      if (currentRunId.current !== runId) return;
      setTypedLogs((prev) => [...prev, ""]);

      for (let i = 0; i < line.length; i++) {
        if (currentRunId.current !== runId) return;
        const char = line[i];
        setTypedLogs((prev) => {
          const next = [...prev];
          next[next.length - 1] = (next[next.length - 1] || "") + char;
          return next;
        });

        // Realistic mechanical hammer strike clicks
        if (char !== " " && (i % 2 === 0 || char === "." || char === ":")) {
          playTypewriterClick(audioCtxRef.current, isMuted);
        }

        // Micro-jitter in typing cadence to feel organic and mechanical
        const jitter = Math.random() * 10 - 4;
        await delay(Math.max(8, charSpeed + jitter));
      }

      // Short pause as carriage resets/feeds line
      await delay(90);
    };

    try {
      await delay(250);
      setProgress(15);
      await typeLine(`>> [TARGET_CALIBRATED] Profile: "${clean}"`, 16);
      await typeLine(`>> [PERSPECTIVE_SELECTED] Angle: "${selectedTag}"`, 16);

      setProgress(35);
      await typeLine(`>> [ANALYZING_ARCHITECTURE] Parsing feature set & key attributes...`, 16);
      await typeLine(`>> [INDEPENDENT_STORYTELLING] Inking tailored narrative sections...`, 16);

      // Call dedicated Article Generation API
      const res = await fetch("/api/articles/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appId:
            clean.startsWith("http://") || clean.startsWith("https://")
              ? loadedApp && loadedApp.url === clean
                ? loadedApp.id
                : undefined
              : loadedApp?.id || clean,
          url:
            clean.startsWith("http://") || clean.startsWith("https://")
              ? clean
              : loadedApp?.url,
          tag: selectedTag,
          taskId,
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

      setProgress(65);
      await typeLine(`>> [HEADLINE_INKED] "${data.article.title}"`, 16);
      await typeLine(`>> [SUMMARY_COMPOSED] "${data.article.summary?.slice(0, 65)}..."`, 16);

      setProgress(85);
      await typeLine(`>> [VERIFYING_LINKS] Validated ${(data.article.links?.length || 0)} official resources.`, 16);
      await typeLine(`>> [AUTHOR_STAMPED] Inked attribution to @${session.user.name || "You"}.`, 16);

      setProgress(100);
      playTypewriterBell(audioCtxRef.current, isMuted);
      await typeLine(`----------------------------------------------------`, 8);
      await typeLine(`[MANUSCRIPT_FINALIZED] Editorial Piece Ready.`, 16);

      setCreatedArticle(data.article);
      if (data.app) setLoadedApp(data.app);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "生成发生异常");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="w-full bg-[#edeae2] dark:bg-[#121310] text-neutral-900 dark:text-neutral-100 flex flex-col selection:bg-[#788863] selection:text-white transition-colors duration-200">
      {/* 100dvh Main Typewriter Viewport Section */}
      <div className="min-h-[100dvh] w-full flex flex-col justify-between relative flex-none">
        {/* Universal Floating Header */}
        <SiteHeader />

        <main className="max-w-5xl mx-auto w-full px-4 sm:px-6 pt-20 sm:pt-24 pb-8 sm:pb-12 flex flex-col items-center justify-center flex-1 my-auto">
        {/* Collapsible Perspective & Target Selection Bar */}
        <div className="w-full max-w-xl flex flex-col items-center">
          {!isConfigOpen ? (
            <div className="inline-flex items-center gap-2 p-1.5 pl-3.5 rounded-full bg-white/80 dark:bg-card/80 backdrop-blur-md border border-neutral-300/80 dark:border-neutral-800 shadow-xs hover:border-[#788863]/50 transition-all">
              {/* Clickable info trigger */}
              <button
                type="button"
                onClick={() => setIsConfigOpen(true)}
                className="inline-flex items-center gap-2 text-xs font-mono text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition cursor-pointer pr-1"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#788863]" />
                <span className="truncate max-w-[200px] sm:max-w-[280px]">
                  {targetInput ? (
                    <>
                      <span className="text-foreground font-semibold">{targetInput}</span>
                      <span className="text-muted-foreground ml-1.5 font-normal">({selectedTag})</span>
                    </>
                  ) : (
                    <span>设定生成目标 (Editorial Setup)</span>
                  )}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
              </button>

              {/* Compact Action Button */}
              <button
                type="button"
                onClick={targetInput ? startTypewriterProcess : () => setIsConfigOpen(true)}
                disabled={isGenerating}
                className="px-3.5 py-1 rounded-full bg-[#788863] hover:bg-[#687754] active:scale-95 disabled:opacity-50 text-white text-[11px] font-mono font-bold shadow-2xs transition cursor-pointer flex items-center gap-1 shrink-0"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>TYPING...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3" />
                    <span>{targetInput ? "START" : "SET"}</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            /* Expanded Configuration Card */
            <div className="w-full p-4 sm:p-5 rounded-2xl bg-white/90 dark:bg-card/90 backdrop-blur-md border border-neutral-300/80 dark:border-neutral-800 shadow-md space-y-3 animate-in fade-in zoom-in-98 duration-150">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-neutral-700 dark:text-neutral-300 uppercase flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#788863]" />
                  <span>EDITORIAL MANUSCRIPT DESK (独立文章生成台)</span>
                </span>
                <div className="flex items-center gap-2">
                  {loadedApp && (
                    <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>已绑定: {loadedApp.name}</span>
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsConfigOpen(false)}
                    className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                    title="收起配置"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2">
                <input
                  type="text"
                  value={targetInput}
                  onChange={(e) => {
                    const val = e.target.value;
                    setTargetInput(val);
                    if (errorMsg) setErrorMsg("");
                    if (loadedApp && loadedApp.url !== val && loadedApp.name !== val && loadedApp.id !== val) {
                      setLoadedApp(null);
                    }
                  }}
                  placeholder="输入任意目标网址或应用名称 (如: https://linear.app)"
                  disabled={isGenerating}
                  className="flex-1 w-full px-3.5 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#788863]/30"
                />

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
                  onClick={() => {
                    startTypewriterProcess();
                    setIsConfigOpen(false);
                  }}
                  disabled={isGenerating || !targetInput.trim()}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#788863] hover:bg-[#687754] active:scale-95 disabled:opacity-50 text-white text-xs font-mono font-bold shadow-xs transition cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
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
          )}
        </div>

        {/* 
          ========================================================================
          RETRO TYPEWRITER & MANUSCRIPT PAPER (Replicating Image #1)
          - Top: Warm cream tall paper with ruled lines & typewriter typography
          - Bottom: Vintage olive sage-green mechanical typewriter body
          ========================================================================
        */}
        <div
          onClick={() => setIsZoomed((prev) => !prev)}
          title={isZoomed ? "点击复位缩小" : "点击放大打字机"}
          className={`w-full max-w-[410px] mt-6 sm:mt-8 relative select-none transition-all duration-300 ease-out origin-center ${
            isZoomed
              ? "scale-115 sm:scale-135 md:scale-145 translate-y-[20%] z-30 cursor-zoom-out drop-shadow-2xl"
              : "scale-100 translate-y-0 z-10 cursor-zoom-in hover:scale-[1.02]"
          }`}
        >
          {/* Quick Zoom Toggle Badge */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsZoomed(!isZoomed);
            }}
            className="absolute -top-2.5 -right-2.5 z-30 p-1.5 rounded-full bg-white/90 dark:bg-neutral-800/90 backdrop-blur-md border border-neutral-300/80 dark:border-neutral-700/80 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white shadow-xs transition hover:scale-110 active:scale-95 cursor-pointer"
            title={isZoomed ? "缩小复位" : "放大打字机"}
          >
            {isZoomed ? (
              <ZoomOut className="w-3.5 h-3.5" />
            ) : (
              <ZoomIn className="w-3.5 h-3.5" />
            )}
          </button>
          <div className="w-full relative drop-shadow-2xl">
            <video
              src="/typewriter.webm"
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-auto object-contain pointer-events-none"
            />
          </div>

          {/* Text Overlay (Transparent, absolutely positioned over the video's white paper) */}
          <style>{`
            @keyframes typeWriterFollow {
              0% { transform: translateX(0); }
              35% { transform: translateX(-3.8%); }
              65% { transform: translateX(-3.8%); }
              100% { transform: translateX(0); }
            }
          `}</style>
          <div
            ref={paperScrollRef}
            className="absolute top-[2%] left-[25%] w-[60%] h-[54%] text-[#2c2b29] p-3 sm:p-5 flex flex-col justify-between overflow-y-auto z-10 font-serif text-xs"
            style={{
              animation: "typeWriterFollow 20.084s infinite linear"
            }}
          >
            {/* Header Line on the Paper (Exact replication from Image #1) */}
            <div>
              <div className="flex items-center justify-between text-[11px] font-serif tracking-wider text-[#636159] pb-2">
                <span>omont.2026</span>
                <span>ai editorial office</span>
              </div>
              <div className="w-full h-px bg-[#4a4945] mb-5" />

              {/* Typed Content Area */}
              <div className="space-y-3 font-serif leading-relaxed min-h-[220px]">
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
                      className={`${
                        log.startsWith(">> [HEADLINE")
                          ? "font-bold text-sm text-[#11100e] border-l-2 border-[#788863] pl-2 py-0.5 my-2"
                          : log.startsWith(">> [SUMMARY")
                          ? "italic text-xs text-[#44423d] pl-2"
                          : log.startsWith("[MANUSCRIPT")
                          ? "text-[#788863] font-bold"
                          : "text-[#4a473f]"
                      }`}
                    >
                      <span>{log}</span>
                      {/* Dynamic typewriter ribbon cursor pinned to active character */}
                      {isGenerating && idx === typedLogs.length - 1 && (
                        <span className="inline-block w-1.5 h-3 bg-[#2c2b29] animate-pulse ml-0.5 align-middle shadow-xs" />
                      )}
                    </div>
                  ))
                )}

                {/* Initial blinking cursor before first line starts */}
                {isGenerating && typedLogs.length === 0 && (
                  <span className="inline-block w-1.5 h-3 bg-[#2c2b29] animate-pulse ml-0.5 align-middle" />
                )}
              </div>
            </div>
            {/* Bottom Footer Typography on the Paper (Exact replication from Image #1) */}
            <div className="pt-4 mt-auto">
              <div className="text-[11px] font-serif text-[#54524c]">boring office</div>
              <div className="w-full border-b border-dotted border-[#827f76] my-1" />
              <div className="text-[11px] font-serif text-[#6e6b63] tracking-wider flex items-center justify-between">
                <span>old memory of new time ....</span>
                {progress > 0 && <span>[{progress}%]</span>}
              </div>
            </div>
          </div>

        </div>

        {/* 
          ========================================================================
          RESULT CARD & CTAs: Revealed upon manuscript finalization
          ========================================================================
        */}
        {createdArticle && (
          <div className="w-full max-w-[410px] mt-8 p-5 sm:p-6 rounded-3xl bg-white dark:bg-card border border-emerald-500/30 shadow-xl space-y-4 animate-in slide-in-from-bottom-3 duration-300">
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

      {/* Shared Footer Section (Revealed upon scrolling down) */}
      <Footer />

      {/* Floating Mechanical Sound Mute Toggle */}
      <button
        type="button"
        onClick={() => setIsMuted(!isMuted)}
        className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/80 dark:bg-card/80 backdrop-blur-md border border-neutral-300/80 dark:border-neutral-700/80 text-xs font-mono font-medium text-neutral-700 dark:text-neutral-300 hover:bg-white dark:hover:bg-card transition shadow-sm cursor-pointer active:scale-95"
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
  );
}

export default function TypewriterGeneratorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#edeae2]" />}>
      <TypewriterGeneratorContent />
    </Suspense>
  );
}
