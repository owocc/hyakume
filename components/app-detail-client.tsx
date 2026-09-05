"use client";

import { useState, useEffect } from "react";
import {
  Share2,
  ExternalLink,
  Check,
  UserCheck,
  UserX,
  X,
  ChevronLeft,
  ChevronRight,
  ImageOff,
  Laptop,
} from "lucide-react";
import type { AppItem, ReviewItem } from "@/lib/types";

interface Props {
  app: AppItem;
  initialReviews: ReviewItem[];
  otherApps: AppItem[];
}

export function AppDetailClient({ app, initialReviews, otherApps }: Props) {
  const [descExpanded, setDescExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [reviews, setReviews] = useState<ReviewItem[]>(initialReviews);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    title: "",
    author: "",
    rating: 5,
    content: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);
  const [failedImages, setFailedImages] = useState<Record<number, boolean>>({});

  // Collect valid non-placeholder images and deduplicate
  const rawImages: string[] = [];
  if (app.screenshots && Array.isArray(app.screenshots)) {
    for (const s of app.screenshots) {
      if (s && s.trim().length > 0 && !s.includes("photo-1551288049-bebda4e38f71")) {
        rawImages.push(s);
      }
    }
  }
  if (app.seo_image && app.seo_image.trim().length > 0 && !app.seo_image.includes("photo-1551288049-bebda4e38f71")) {
    rawImages.push(app.seo_image);
  }
  if (app.cover_url && app.cover_url.trim().length > 0 && !app.cover_url.includes("photo-1551288049-bebda4e38f71")) {
    rawImages.push(app.cover_url);
  }

  // Deduplicate images
  const previewImages = Array.from(new Set(rawImages));
  const allImagesFailed = previewImages.length > 0 && previewImages.every((_, i) => failedImages[i]);

  // Keyboard navigation for Lightbox
  useEffect(() => {
    if (activeImageIndex === null) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveImageIndex(null);
      } else if (e.key === "ArrowLeft") {
        setActiveImageIndex((prev) =>
          prev !== null && prev > 0 ? prev - 1 : previewImages.length - 1
        );
      } else if (e.key === "ArrowRight") {
        setActiveImageIndex((prev) =>
          prev !== null && prev < previewImages.length - 1 ? prev + 1 : 0
        );
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeImageIndex, previewImages.length]);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: app.name,
          text: app.tagline || app.description,
          url: window.location.href,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewForm.title || !reviewForm.author || !reviewForm.content) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/apps/${app.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reviewForm),
      });
      if (res.ok) {
        const data = (await res.json()) as { review: ReviewItem };
        setReviews([data.review, ...reviews]);
        setShowReviewModal(false);
        setReviewForm({ title: "", author: "", rating: 5, content: "" });
      }
    } catch (err) {
      console.error("Failed to submit review:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full bg-background text-foreground transition-colors duration-200">
      {/* 1. App Store Hero Header Banner with Backdrop Cover Blur */}
      <div className="relative w-full rounded-none overflow-hidden text-white px-6 sm:px-10 lg:px-16 py-12 lg:py-16 border-b border-border/40 shadow-xs bg-neutral-900">
        {/* Blurred ambient cover background */}
        {app.cover_url && (
          <div
            className="absolute inset-0 bg-cover bg-center scale-110 blur-3xl opacity-60 pointer-events-none"
            style={{ backgroundImage: `url(${app.cover_url})` }}
          />
        )}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
          <div className="flex items-start gap-6">
            <img
              src={app.icon_url}
              alt={app.name}
              onError={(e) => {
                try {
                  const host = new URL(app.url).hostname;
                  (e.target as HTMLImageElement).src = `https://www.google.com/s2/favicons?domain=${host}&sz=128`;
                } catch {
                  // ignore
                }
              }}
              className="w-28 h-28 lg:w-32 lg:h-32 rounded-[28px] object-cover shadow-2xl border border-white/20 shrink-0 bg-white"
            />
            <div className="space-y-1.5">
              <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-white">
                {app.name}
              </h1>
              <p className="text-base text-gray-200 font-medium">
                {app.tagline}
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-white/20 text-white backdrop-blur-md">
                  {app.price || "免费 · Web App"}
                </span>
                {(app.categories || [app.category || "WEB"]).map((cat) => (
                  <span
                    key={cat}
                    className="text-xs font-semibold px-2 py-0.5 rounded-md bg-white/15 text-white border border-white/20 backdrop-blur-sm"
                  >
                    {cat}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-3 w-full md:w-auto shrink-0 pt-2 md:pt-0">
            <a
              href={app.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 md:flex-none px-7 py-2.5 rounded-full bg-white text-black hover:bg-neutral-100 font-bold text-sm shadow-xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
            >
              <span>访问网站</span>
              <ExternalLink className="w-4 h-4 stroke-[2.5]" />
            </a>

            <button
              onClick={handleShare}
              className="px-5 py-2.5 rounded-full bg-white/20 hover:bg-white/30 text-white font-semibold text-sm backdrop-blur-md transition flex items-center justify-center gap-1.5 border border-white/20 shadow-sm"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-green-300" />
                  <span>已复制</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  <span>分享</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Body Container */}
      <div className="w-full px-6 sm:px-10 lg:px-16 py-8 space-y-12">
        {/* 2. Metadata / Key Metrics Row (Image #2) */}
        <div className="grid grid-cols-3 md:grid-cols-6 divide-y md:divide-y-0 md:divide-x divide-border border-y border-border py-4 text-center">
          {/* Metric 1: Rating */}
          <div className="py-2 md:py-0 px-2 flex flex-col items-center justify-center">
            <span className="text-[11px] font-medium text-muted-foreground">
              {app.rating_count} 个评分
            </span>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-lg font-bold text-foreground">{app.rating}</span>
              <div className="flex text-[#FF9500] text-xs">
                {"★".repeat(Math.round(app.rating))}
              </div>
            </div>
          </div>

          {/* Metric 2: Age */}
          <div className="py-2 md:py-0 px-2 flex flex-col items-center justify-center">
            <span className="text-[11px] font-medium text-muted-foreground">年龄分级</span>
            <span className="text-lg font-bold text-foreground mt-0.5">
              {app.age_rating}
            </span>
          </div>

          {/* Metric 3: Ranking */}
          <div className="py-2 md:py-0 px-2 flex flex-col items-center justify-center">
            <span className="text-[11px] font-medium text-muted-foreground">排行榜</span>
            <span className="text-sm font-bold text-foreground mt-0.5 truncate max-w-[120px]">
              {app.ranking || `#1 ${(app.categories || [app.category || "WEB"]).join(" · ")}`}
            </span>
          </div>

          {/* Metric 4: Developer */}
          <div className="py-2 md:py-0 px-2 flex flex-col items-center justify-center">
            <span className="text-[11px] font-medium text-muted-foreground">开发者</span>
            <span className="text-xs font-semibold text-foreground mt-1.5 truncate max-w-[120px]">
              {app.developer}
            </span>
          </div>

          {/* Metric 5: Language */}
          <div className="py-2 md:py-0 px-2 flex flex-col items-center justify-center">
            <span className="text-[11px] font-medium text-muted-foreground">语言</span>
            <span className="text-lg font-bold text-foreground mt-0.5">ZH</span>
            <span className="text-[10px] text-muted-foreground">简体中文</span>
          </div>

          {/* Metric 6: Size */}
          <div className="py-2 md:py-0 px-2 flex flex-col items-center justify-center">
            <span className="text-[11px] font-medium text-muted-foreground">大小 / 平台</span>
            <span className="text-lg font-bold text-foreground mt-0.5">
              {app.size || "Web App"}
            </span>
          </div>
        </div>

        {/* 3. Media Gallery (Screenshots & Showcase) */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-foreground">预览</h2>

          {previewImages.length === 0 || allImagesFailed ? (
            <div className="w-full py-16 px-4 bg-card rounded-2xl border border-border flex flex-col items-center justify-center text-center space-y-2 select-none shadow-xs">
              <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-muted-foreground mb-1">
                <ImageOff className="w-6 h-6 stroke-[1.5]" />
              </div>
              <p className="text-sm font-semibold text-foreground">该应用无预览图</p>
              <p className="text-xs text-muted-foreground">开发者暂未提供此 Web App 的界面预览截图</p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none snap-x">
                {previewImages.map((img, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      if (!failedImages[i]) {
                        setActiveImageIndex(i);
                      }
                    }}
                    className="snap-start shrink-0 rounded-2xl overflow-hidden border border-border shadow-xs bg-card group relative cursor-zoom-in hover:border-primary/50 transition-colors"
                    title="点击查看大图"
                  >
                    {failedImages[i] ? (
                      <div className="h-[260px] sm:h-[320px] w-[460px] max-w-[85vw] bg-muted flex flex-col items-center justify-center text-muted-foreground gap-2 select-none border border-border">
                        <ImageOff className="w-8 h-8 stroke-[1.5]" />
                        <span className="text-xs font-medium">预览图加载失败</span>
                      </div>
                    ) : (
                      <img
                        src={img}
                        alt={`预览图片 ${i + 1}`}
                        onError={() => {
                          setFailedImages((prev) => ({ ...prev, [i]: true }));
                        }}
                        className="h-[260px] sm:h-[320px] w-auto max-w-[620px] object-cover transition duration-300 group-hover:scale-[1.01]"
                      />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
                <Laptop className="w-3.5 h-3.5" />
                <span>Web 桌面端预览</span>
              </div>
            </div>
          )}
        </div>

        {/* 4. Description Section */}
        <div className="space-y-3 border-t border-border pt-6">
          <h2 className="text-lg font-bold text-foreground">
            【应用介绍】
          </h2>
          <div className="relative">
            <p
              className={`text-sm text-foreground/90 leading-relaxed whitespace-pre-line ${
                !descExpanded ? "line-clamp-4" : ""
              }`}
            >
              {app.description}
            </p>
            <button
              onClick={() => setDescExpanded(!descExpanded)}
              className="text-xs font-semibold text-foreground hover:underline mt-2 inline-block cursor-pointer"
            >
              {descExpanded ? "收起" : "更多"}
            </button>
          </div>
        </div>

        {/* 5. Ratings & Reviews (Image #3) */}
        <div className="space-y-6 border-t border-border pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <h2 className="text-lg font-bold text-foreground">
                评分及评论
              </h2>
              <span className="text-sm text-muted-foreground font-normal">&gt;</span>
            </div>
            <button
              onClick={() => setShowReviewModal(true)}
              className="text-xs font-semibold text-foreground hover:underline"
            >
              撰写评论
            </button>
          </div>

          {/* Rating Breakdown */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-8 bg-card border border-border p-6 rounded-2xl shadow-xs">
            <div>
              <div className="text-5xl font-extrabold text-foreground">
                {app.rating}
              </div>
              <div className="text-xs text-muted-foreground mt-1 font-medium">
                满分 5 分
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {app.rating_count} 个评分
              </div>
            </div>

            {/* Star bars */}
            <div className="flex-1 max-w-md space-y-1.5">
              {[5, 4, 3, 2, 1].map((stars) => {
                const widths = [85, 10, 3, 1, 1];
                return (
                  <div key={stars} className="flex items-center gap-2 text-xs">
                    <span className="w-8 text-right font-medium text-muted-foreground">
                      {"★".repeat(stars)}
                    </span>
                    <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-muted-foreground rounded-full"
                        style={{ width: `${widths[5 - stars]}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* User Review Cards (2-column layout) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviews.slice(0, 4).map((rev) => (
              <div
                key={rev.id}
                className="bg-card p-5 rounded-2xl space-y-2 border border-border shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-foreground">
                    {rev.title}
                  </span>
                  <span className="text-xs text-muted-foreground">{rev.date}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div className="text-[#FF9500]">
                    {"★".repeat(rev.rating)}
                    {"☆".repeat(5 - rev.rating)}
                  </div>
                  <span className="text-muted-foreground font-medium">{rev.author}</span>
                </div>
                <p className="text-xs text-foreground/90 leading-relaxed line-clamp-4">
                  {rev.content}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Review Modal */}
        {showReviewModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-card border border-border text-foreground rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <h3 className="text-lg font-bold text-foreground">撰写评论</h3>
              <form onSubmit={handleReviewSubmit} className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                    昵称
                  </label>
                  <input
                    type="text"
                    value={reviewForm.author}
                    onChange={(e) =>
                      setReviewForm({ ...reviewForm, author: e.target.value })
                    }
                    placeholder="吃葡萄糖的小猫"
                    className="w-full px-3 py-2 text-xs border border-border rounded-xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                    标题
                  </label>
                  <input
                    type="text"
                    required
                    value={reviewForm.title}
                    onChange={(e) =>
                      setReviewForm({ ...reviewForm, title: e.target.value })
                    }
                    placeholder="希望改进"
                    className="w-full px-3 py-2 text-xs border border-border rounded-xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                    评分 (1-5)
                  </label>
                  <div className="flex gap-2 text-xl cursor-pointer">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() =>
                          setReviewForm({ ...reviewForm, rating: s })
                        }
                        className={
                          s <= reviewForm.rating
                            ? "text-[#FF9500]"
                            : "text-muted-foreground/40"
                        }
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                    内容
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={reviewForm.content}
                    onChange={(e) =>
                      setReviewForm({ ...reviewForm, content: e.target.value })
                    }
                    placeholder="写下你对这款应用的真实体验与建议..."
                    className="w-full px-3 py-2 text-xs border border-border rounded-xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowReviewModal(false)}
                    className="px-4 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-secondary rounded-full"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-1.5 text-xs font-bold bg-foreground text-background rounded-full hover:opacity-90 disabled:opacity-50"
                  >
                    {submitting ? "提交中..." : "发表评论"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 6. App Privacy (Image #3) */}
        <div className="space-y-4 border-t border-border pt-6">
          <div className="flex items-center gap-1.5">
            <h2 className="text-lg font-bold text-foreground">App 隐私</h2>
            <span className="text-sm text-muted-foreground font-normal">&gt;</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            开发者“{app.developer}”已表明该 App 的隐私规范可能包括下述数据处理方式。有关更多信息，请参阅
            <a
              href={app.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground hover:underline ml-1"
            >
              开发者隐私政策
            </a>
            。
          </p>

          {/* 2 Privacy Cards Side by Side (Image #3) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Linked Data Card */}
            <div className="bg-card p-6 rounded-2xl border border-border text-center space-y-3 shadow-xs">
              <div className="w-12 h-12 mx-auto rounded-full bg-secondary flex items-center justify-center text-foreground">
                <UserCheck className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-sm text-foreground">与你关联的数据</h3>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                开发者可能会收集以下数据，且数据与你的身份关联：
              </p>
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                {(app.privacy_linked || ["联系信息", "用户内容", "标识符"]).map(
                  (item) => (
                    <span
                      key={item}
                      className="text-xs px-3 py-1 bg-secondary rounded-lg border border-border font-medium text-foreground"
                    >
                      {item}
                    </span>
                  )
                )}
              </div>
            </div>

            {/* Not Linked Data Card */}
            <div className="bg-card p-6 rounded-2xl border border-border text-center space-y-3 shadow-xs">
              <div className="w-12 h-12 mx-auto rounded-full bg-secondary flex items-center justify-center text-foreground">
                <UserX className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-sm text-foreground">
                未与你关联的数据
              </h3>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                开发者可能会收集以下数据，但数据不会关联你的身份：
              </p>
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                {(app.privacy_not_linked || ["位置", "使用数据", "诊断"]).map(
                  (item) => (
                    <span
                      key={item}
                      className="text-xs px-3 py-1 bg-secondary rounded-lg border border-border font-medium text-foreground"
                    >
                      {item}
                    </span>
                  )
                )}
              </div>
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground pt-1">
            隐私规范可能因你使用的功能或你的年龄等因素而异。
            <a href="#" className="text-foreground hover:underline ml-1">
              进一步了解
            </a>
          </p>
        </div>

        {/* 7. Information Grid (Image #3) */}
        <div className="space-y-4 border-t border-border pt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">信息</h2>
            <a
              href={app.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-foreground hover:underline"
            >
              隐私政策 ↗
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs bg-card p-6 rounded-2xl border border-border shadow-xs">
            <div>
              <span className="text-muted-foreground block mb-0.5">提供者</span>
              <span className="font-semibold text-foreground">{app.developer}</span>
            </div>
            <div>
              <span className="text-muted-foreground block mb-0.5">大小</span>
              <span className="font-semibold text-foreground">{app.size}</span>
            </div>
            <div>
              <span className="text-muted-foreground block mb-0.5">类别</span>
              <span className="font-semibold text-foreground">
                {(app.categories || [app.category || "WEB"]).join("、")}
              </span>
            </div>

            <div>
              <span className="text-muted-foreground block mb-0.5">兼容性</span>
              <span className="font-semibold text-foreground">
                {app.compatibility}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block mb-0.5">语言</span>
              <span className="font-semibold text-foreground">{app.languages}</span>
            </div>
            <div>
              <span className="text-muted-foreground block mb-0.5">年龄分级</span>
              <span className="font-semibold text-foreground">{app.age_rating}</span>
            </div>

            <div>
              <span className="text-muted-foreground block mb-0.5">App内购买</span>
              <span className="font-semibold text-foreground">是</span>
            </div>
            <div className="md:col-span-2">
              <span className="text-muted-foreground block mb-0.5">版权</span>
              <span className="font-semibold text-foreground">
                Copyright © {new Date().getFullYear()} {app.developer}. All Rights Reserved.
              </span>
            </div>
          </div>
        </div>

        {/* 8. Related Topics (Image #4) */}
        {app.related_topics && app.related_topics.length > 0 && (
          <div className="space-y-4 border-t border-border pt-6">
            <h2 className="text-lg font-bold text-foreground">相关专题</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {app.related_topics.map((topic, i) => (
                <div
                  key={i}
                  className="relative h-64 rounded-2xl overflow-hidden border border-border shadow-xs group cursor-pointer"
                >
                  <img
                    src={topic.image || app.cover_url}
                    alt={topic.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex flex-col justify-end p-5 text-white space-y-1">
                    <span className="text-[11px] font-bold text-white/80 uppercase tracking-wider">
                      {topic.tag || "必备精选"}
                    </span>
                    <h3 className="text-base font-bold leading-snug">
                      {topic.title}
                    </h3>
                    <p className="text-xs text-white/80 line-clamp-2">
                      {topic.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 9. More from Developer (Image #4) */}
        {otherApps.length > 0 && (
          <div className="space-y-4 border-t border-border pt-6">
            <div className="flex items-center gap-1.5">
              <h2 className="text-lg font-bold text-foreground">
                更多来自&quot;{app.developer}&quot;的 App
              </h2>
              <span className="text-sm text-muted-foreground font-normal">&gt;</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {otherApps.slice(0, 3).map((item) => (
                <a
                  key={item.id}
                  href={`/app/${item.id}`}
                  className="bg-card hover:bg-surface p-4 rounded-2xl border border-border flex items-center justify-between gap-3 group transition shadow-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={item.icon_url}
                      alt={item.name}
                      className="w-12 h-12 rounded-xl object-cover shadow-xs group-hover:scale-105 transition shrink-0"
                    />
                    <div className="min-w-0">
                      <span className="font-bold text-sm text-foreground truncate block">
                        {item.name}
                      </span>
                      <span className="text-xs text-muted-foreground truncate block">
                        {item.tagline || item.category}
                      </span>
                    </div>
                  </div>
                  <span className="px-4 py-1 rounded-full bg-secondary hover:bg-primary hover:text-primary-foreground text-foreground border border-border font-bold text-xs shadow-2xs shrink-0 transition-colors">
                    查看
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Lightbox / Large Image Viewer Modal */}
      {activeImageIndex !== null && previewImages[activeImageIndex] && (
        <div
          onClick={() => setActiveImageIndex(null)}
          className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 sm:p-8 animate-fade-in select-none"
        >
          <button
            onClick={() => setActiveImageIndex(null)}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer z-50 border border-white/20"
            aria-label="关闭大图"
          >
            <X className="w-5 h-5" />
          </button>

          {previewImages.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveImageIndex((prev) =>
                  prev !== null && prev > 0 ? prev - 1 : previewImages.length - 1
                );
              }}
              className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer z-50 border border-white/20"
              aria-label="上一张"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-5xl max-h-[85vh] w-full h-full flex flex-col items-center justify-center"
          >
            <img
              src={previewImages[activeImageIndex]}
              alt={`大图查看 ${activeImageIndex + 1}`}
              className="max-w-full max-h-[80vh] w-auto h-auto object-contain rounded-xl shadow-2xl"
            />
            {previewImages.length > 1 && (
              <div className="absolute bottom-2 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-xs text-white/90 font-medium">
                {activeImageIndex + 1} / {previewImages.length}
              </div>
            )}
          </div>

          {previewImages.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveImageIndex((prev) =>
                  prev !== null && prev < previewImages.length - 1 ? prev + 1 : 0
                );
              }}
              className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer z-50 border border-white/20"
              aria-label="下一张"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
