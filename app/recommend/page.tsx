"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  Mic,
  Camera,
  Sparkles,
  Loader2,
  CheckCircle2,
  ExternalLink,
  ArrowRight,
  Globe,
  Database,
  Image as ImageIcon,
  Bot,
  AlertCircle,
} from "lucide-react";
import type { AppItem } from "@/lib/types";

interface PipelineStep {
  step: number;
  name: string;
  desc: string;
  status: "pending" | "processing" | "completed";
}

const INITIAL_STEPS: PipelineStep[] = [
  {
    step: 1,
    name: "Cloudflare Browser Use 快照渲染",
    desc: "调用无头浏览器渲染目标网页，自动截取 16:9 页面高清快照",
    status: "pending",
  },
  {
    step: 2,
    name: "网页元数据与内容提取",
    desc: "读取网页 Title、Meta Description、Favicon 与主体结构文本",
    status: "pending",
  },
  {
    step: 3,
    name: "封面图决策与 R2 存储处理",
    desc: "优先使用优质 SEO 大图（节省空间），无 SEO 图则上传 16:9 截图至 Cloudflare R2",
    status: "pending",
  },
  {
    step: 4,
    name: "AI Agent 总结应用功能与特色",
    desc: "智能提炼应用标语、功能特色、App Store 类别标签与隐私规范",
    status: "pending",
  },
  {
    step: 5,
    name: "结构化写入 Cloudflare D1 数据库",
    desc: "持久化存储为标准 Web App，生成专属精美详情页",
    status: "pending",
  },
];

const PRESET_URLS = [
  { name: "GitHub", url: "https://github.com", desc: "全球开源开发者协作平台" },
  { name: "Vercel", url: "https://vercel.com", desc: "现代 Web 极速部署平台" },
  { name: "Excalidraw", url: "https://excalidraw.com", desc: "手绘风格虚拟白板工具" },
  { name: "Figma", url: "https://www.figma.com", desc: "全平台协同 UI 设计工具" },
];

export default function RecommendPage() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [steps, setSteps] = useState<PipelineStep[]>(INITIAL_STEPS);
  const [createdApp, setCreatedApp] = useState<AppItem | null>(null);
  const [usedSeoImage, setUsedSeoImage] = useState<boolean | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const handlePaste = async () => {
    try {
      if (navigator.clipboard) {
        const text = await navigator.clipboard.readText();
        if (text) setUrl(text.trim());
      }
    } catch {
      // ignore
    }
  };

  const handleAnalyze = async (targetUrl?: string) => {
    const submitUrl = (targetUrl || url).trim();
    if (!submitUrl) return;

    setLoading(true);
    setErrorMsg("");
    setCreatedApp(null);
    setUsedSeoImage(null);

    // Reset steps
    const initial = INITIAL_STEPS.map((s, idx) => ({
      ...s,
      status: idx === 0 ? ("processing" as const) : ("pending" as const),
    }));
    setSteps(initial);

    // Progressive step timer simulation for smooth visual feedback
    const timer1 = setTimeout(() => {
      setSteps((prev) =>
        prev.map((s) =>
          s.step === 1
            ? { ...s, status: "completed" }
            : s.step === 2
            ? { ...s, status: "processing" }
            : s
        )
      );
    }, 700);

    const timer2 = setTimeout(() => {
      setSteps((prev) =>
        prev.map((s) =>
          s.step <= 2
            ? { ...s, status: "completed" }
            : s.step === 3
            ? { ...s, status: "processing" }
            : s
        )
      );
    }, 1400);

    const timer3 = setTimeout(() => {
      setSteps((prev) =>
        prev.map((s) =>
          s.step <= 3
            ? { ...s, status: "completed" }
            : s.step === 4
            ? { ...s, status: "processing" }
            : s
        )
      );
    }, 2200);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: submitUrl }),
      });

      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);

      const data = (await response.json()) as {
        success: boolean;
        alreadyExists?: boolean;
        app?: AppItem;
        crawl?: { usedSeoImage: boolean };
        error?: string;
      };

      if (!response.ok || !data.success || !data.app) {
        throw new Error(data.error || "网页分析失败，请检查网址是否正确");
      }

      if (data.alreadyExists) {
        setSteps((prev) => prev.map((s) => ({ ...s, status: "completed" })));
        router.push(`/app/${data.app.id}`);
        return;
      }

      setSteps((prev) => prev.map((s) => ({ ...s, status: "completed" })));
      setCreatedApp(data.app);
      setUsedSeoImage(Boolean(data.crawl?.usedSeoImage));
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    } catch (err) {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      setErrorMsg(err instanceof Error ? err.message : "分析失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full py-16 px-6 max-w-4xl mx-auto flex flex-col items-center justify-center space-y-10">
      {/* 1. Brand Logo matching Image #7 Google style */}
      <div className="text-center space-y-3">
        {/* Google style multicolored wordmark */}
        <div className="flex items-center justify-center gap-1 select-none font-bold text-5xl md:text-6xl tracking-tight">
          <span className="text-[#4285F4]">A</span>
          <span className="text-[#EA4335]">p</span>
          <span className="text-[#FBBC05]">p</span>
          <span className="text-[#4285F4]">S</span>
          <span className="text-[#34A853]">t</span>
          <span className="text-[#EA4335]">o</span>
          <span className="text-[#4285F4]">r</span>
          <span className="text-[#FBBC05]">e</span>
          <span className="ml-2 text-3xl font-extrabold bg-gradient-to-r from-[#4285F4] to-[#AF52DE] bg-clip-text text-transparent">
            AI
          </span>
        </div>
        <p className="text-sm text-[#86868B] max-w-md mx-auto">
          输入任意网站 URL，Cloudflare Browser Use 与 AI Agent 将全自动生成收录详情
        </p>
      </div>

      {/* 2. Google Style Centered Stadium Search Bar (Image #7) */}
      <div className="w-full max-w-2xl">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAnalyze();
          }}
          className="relative group"
        >
          <div className="relative flex items-center bg-white border border-[#D2D2D7] rounded-full shadow-sm hover:shadow-md focus-within:shadow-lg focus-within:border-[#4285F4] transition-all px-4 py-3 gap-3">
            {/* Left Plus Icon (Paste) */}
            <button
              type="button"
              onClick={handlePaste}
              title="粘贴剪贴板网址"
              className="p-1 rounded-full text-[#86868B] hover:text-[#1D1D1F] hover:bg-[#F5F5F7] transition cursor-pointer"
            >
              <Plus className="w-5 h-5" />
            </button>

            {/* Input box */}
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="输入或粘贴网站 URL (例如 https://excalidraw.com)"
              disabled={loading}
              className="flex-1 bg-transparent border-none text-sm md:text-base text-[#1D1D1F] placeholder-[#86868B] focus:outline-none"
            />

            {/* Right Icons: Mic, Camera, AI Mode */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="p-1 text-[#86868B] hover:text-[#1D1D1F] transition"
                title="语音搜索"
              >
                <Mic className="w-4 h-4" />
              </button>
              <button
                type="button"
                className="p-1 text-[#86868B] hover:text-[#1D1D1F] transition"
                title="图像识别"
              >
                <Camera className="w-4 h-4" />
              </button>

              {/* AI Mode / AI 一键收录 Pill Button */}
              <button
                type="submit"
                disabled={loading || !url.trim()}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#F5F5F7] hover:bg-[#0071E3] hover:text-white text-[#1D1D1F] text-xs font-bold transition-all disabled:opacity-40 shadow-xs cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>处理中...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-[#0071E3] group-hover:text-white" />
                    <span>AI Mode</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Quick Sample URL Chips */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-4 text-xs text-[#86868B]">
          <span>快速尝试:</span>
          {PRESET_URLS.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => {
                setUrl(preset.url);
                handleAnalyze(preset.url);
              }}
              disabled={loading}
              className="px-3 py-1 bg-[#F5F5F7] hover:bg-[#E5E5EA] text-[#1D1D1F] rounded-full transition font-medium border border-[#E5E5EA] disabled:opacity-50 cursor-pointer"
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Error Banner */}
      {errorMsg && (
        <div className="w-full max-w-2xl p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-xs text-red-700">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 4. Automated Workflow Stepper Card */}
      {(loading || createdApp) && (
        <div className="w-full max-w-2xl bg-[#F5F5F7] rounded-3xl p-6 border border-[#E5E5EA] shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#E5E5EA] pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#0071E3]" />
              <h3 className="font-bold text-sm text-[#1D1D1F]">
                AI 一键自动化执行流程
              </h3>
            </div>
            {loading && (
              <span className="text-xs text-[#0071E3] font-semibold flex items-center gap-1.5">
                <Loader2 className="w-3 h-3 animate-spin" />
                正在运行 Cloudflare 边缘工作流...
              </span>
            )}
            {createdApp && (
              <span className="text-xs text-[#34C759] font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                收录完成并已入库
              </span>
            )}
          </div>

          {/* Stepper list */}
          <div className="space-y-3">
            {steps.map((s) => {
              const isCompleted = s.status === "completed";
              const isProcessing = s.status === "processing";
              return (
                <div
                  key={s.step}
                  className={`flex items-start gap-3 p-3 rounded-xl transition-all ${
                    isProcessing
                      ? "bg-white border border-[#0071E3]/30 shadow-xs"
                      : isCompleted
                      ? "bg-white/60"
                      : "opacity-60"
                  }`}
                >
                  <div className="pt-0.5">
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-[#34C759]" />
                    ) : isProcessing ? (
                      <Loader2 className="w-4 h-4 text-[#0071E3] animate-spin" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-gray-300 flex items-center justify-center text-[10px] text-gray-400 font-bold">
                        {s.step}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-bold ${
                          isProcessing
                            ? "text-[#0071E3]"
                            : isCompleted
                            ? "text-[#1D1D1F]"
                            : "text-[#86868B]"
                        }`}
                      >
                        {s.name}
                      </span>
                      {s.step === 3 && isCompleted && usedSeoImage !== null && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold bg-blue-50 text-[#0071E3]">
                          {usedSeoImage
                            ? "已使用 SEO 原图 (节省 R2 空间)"
                            : "已自动截图并上传至 R2"}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#86868B] mt-0.5">
                      {s.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. Result Showcase Card */}
      {createdApp && (
        <div className="w-full max-w-2xl bg-white rounded-3xl p-6 border-2 border-[#34C759]/40 shadow-lg space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold px-2.5 py-1 bg-green-50 text-[#34C759] rounded-lg">
              🎉 Web App 收录成功！
            </span>
            <span className="text-xs text-[#86868B]">
              已持久化存储至 Cloudflare D1
            </span>
          </div>

          {/* App Card Preview */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 p-4 rounded-2xl bg-[#F5F5F7] border border-[#E5E5EA]">
            <img
              src={createdApp.icon_url}
              alt={createdApp.name}
              className="w-16 h-16 rounded-2xl object-cover shadow-md border border-[#E5E5EA]"
            />
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="text-lg font-extrabold text-[#1D1D1F] truncate">
                  {createdApp.name}
                </h4>
                <div className="flex flex-wrap gap-1">
                  {(createdApp.categories || [createdApp.category]).map((c) => (
                    <span
                      key={c}
                      className="text-xs px-2 py-0.5 rounded bg-white text-[#0071E3] font-bold border border-[#E5E5EA]"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
              <p className="text-xs text-[#86868B] line-clamp-1">
                {createdApp.tagline}
              </p>
              <div className="flex items-center gap-3 text-xs text-[#86868B] pt-0.5">
                <span>评分 {createdApp.rating} ★</span>
                <span>•</span>
                <span>{createdApp.developer}</span>
              </div>
            </div>
          </div>

          {/* 16:9 Cover Thumbnail */}
          <div className="relative h-44 rounded-2xl overflow-hidden border border-[#E5E5EA] shadow-xs">
            <img
              src={createdApp.cover_url}
              alt="Generated Cover"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-4">
              <span className="text-xs font-bold text-white bg-black/40 backdrop-blur px-2.5 py-1 rounded">
                {usedSeoImage ? "SEO 优质封面" : "Cloudflare R2 16:9 截图封面"}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <a
              href={createdApp.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-full border border-[#E5E5EA] hover:bg-gray-50 text-xs font-semibold text-[#1D1D1F] flex items-center gap-1.5 transition"
            >
              <span>访问原网站</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <Link
              href={`/app/${createdApp.id}`}
              className="px-6 py-2 rounded-full bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition"
            >
              <span>立即查看 App Store 详情页</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* 6. Technical Architecture Footer Badges */}
      <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-[#86868B] pt-4 border-t border-[#E5E5EA]/60 w-full">
        <span className="flex items-center gap-1">
          <Globe className="w-3.5 h-3.5 text-[#0071E3]" />
          vinext (Next.js on Vite)
        </span>
        <span>•</span>
        <span className="flex items-center gap-1">
          <Bot className="w-3.5 h-3.5 text-[#34A853]" />
          Cloudflare Browser Use
        </span>
        <span>•</span>
        <span className="flex items-center gap-1">
          <Database className="w-3.5 h-3.5 text-[#FBBC05]" />
          Cloudflare D1 Database
        </span>
        <span>•</span>
        <span className="flex items-center gap-1">
          <ImageIcon className="w-3.5 h-3.5 text-[#EA4335]" />
          Cloudflare R2 Storage
        </span>
      </div>
    </div>
  );
}
