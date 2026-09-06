"use client";

import { useState, useEffect, useMemo } from "react";
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
  Tablet,
  Smartphone,
  Layers,
  Sparkles,
  Code2,
  PlusCircle,
} from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import type { AppItem, ReviewItem } from "@/lib/types";

interface Props {
  app: AppItem;
  initialReviews: ReviewItem[];
  otherApps: AppItem[];
}

export function AppDetailClient({ app, initialReviews, otherApps }: Props) {
  const locale = useLocale();
  const t = useTranslations("appDetail");
  const [descExpanded, setDescExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [reviews, setReviews] = useState<ReviewItem[]>(initialReviews);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [userRating, setUserRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [hasRated, setHasRated] = useState<boolean>(false);
  const [ratingSubmitting, setRatingSubmitting] = useState<boolean>(false);
  const [previewTab, setPreviewTab] = useState<"devices" | "subpages">("devices");
  const [activeSubpageScreenshot, setActiveSubpageScreenshot] = useState<string | null>(null);
  const [ratingSuccessMessage, setRatingSuccessMessage] = useState<string>("");
  const [reviewForm, setReviewForm] = useState({
    title: "",
    author: "",
    rating: 5,
    content: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);
  const [failedImages, setFailedImages] = useState<Record<number, boolean>>({});

  const tCommon = useTranslations("common");

  // Accurate rating statistics derived from database reviews & app data
  const totalRatingsCount =
    reviews.length > 0
      ? reviews.length
      : parseInt(String(app.rating_count), 10) || 0;

  const averageScore = useMemo(() => {
    if (reviews.length === 0) {
      return typeof app.rating === "number" && !isNaN(app.rating)
        ? app.rating
        : 5.0;
    }
    const sum = reviews.reduce((acc, r) => acc + (r.rating || 5), 0);
    return Number((sum / reviews.length).toFixed(1));
  }, [reviews, app.rating]);

  const starCounts = useMemo(() => {
    const counts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => {
      const s = Math.min(5, Math.max(1, r.rating || 5));
      counts[s] = (counts[s] || 0) + 1;
    });
    return counts;
  }, [reviews]);

  const starWidths = useMemo(() => {
    if (reviews.length === 0) {
      return { 5: 85, 4: 10, 3: 3, 2: 1, 1: 1 };
    }
    const total = reviews.length;
    return {
      5: Math.round((starCounts[5] / total) * 100),
      4: Math.round((starCounts[4] / total) * 100),
      3: Math.round((starCounts[3] / total) * 100),
      2: Math.round((starCounts[2] / total) * 100),
      1: Math.round((starCounts[1] / total) * 100),
    };
  }, [reviews.length, starCounts]);

  // Quick 1-click rating submission (defaults to 5 stars)
  const handleQuickRate = async (ratingToSubmit: number) => {
    setUserRating(ratingToSubmit);
    setRatingSubmitting(true);
    try {
      const res = await fetch(`/api/apps/${app.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating: ratingToSubmit,
          title: `${ratingToSubmit} Stars`,
          content: `Rated ${ratingToSubmit} stars`,
          author: "Verified User",
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as { review: ReviewItem };
        setReviews((prev) => [data.review, ...prev]);
        setHasRated(true);
        setRatingSuccessMessage(t("rateThanks"));
        setTimeout(() => setRatingSuccessMessage(""), 4000);
      }
    } catch (err) {
      console.error("Failed to submit rating:", err);
    } finally {
      setRatingSubmitting(false);
    }
  };

  // Collect valid non-placeholder images and deduplicate
  const rawImages: string[] = [];
  if (app.screenshots && Array.isArray(app.screenshots)) {
    for (const s of app.screenshots) {
      if (
        s &&
        s.trim().length > 0 &&
        !s.includes("photo-1551288049-bebda4e38f71")
      ) {
        rawImages.push(s);
      }
    }
  }
  if (
    app.seo_image &&
    app.seo_image.trim().length > 0 &&
    !app.seo_image.includes("photo-1551288049-bebda4e38f71")
  ) {
    rawImages.push(app.seo_image);
  }
  if (
    app.cover_url &&
    app.cover_url.trim().length > 0 &&
    !app.cover_url.includes("photo-1551288049-bebda4e38f71")
  ) {
    rawImages.push(app.cover_url);
  }

  // Deduplicate images
  const previewImages = Array.from(new Set(rawImages));
  const allImagesFailed =
    previewImages.length > 0 &&
    previewImages.every((_, i) => failedImages[i]);
  // Detect device category (PC, Tablet, Mobile) from screenshot URL or index
  const getImageDevice = (url: string, index: number) => {
    if (url.includes("-pc-")) return { type: "pc", label: t("previewDesktop"), icon: Laptop };
    if (url.includes("-tablet-")) return { type: "tablet", label: t("previewTablet"), icon: Tablet };
    if (url.includes("-mobile-")) return { type: "mobile", label: t("previewMobile"), icon: Smartphone };
    if (previewImages.length === 3) {
      if (index === 0) return { type: "pc", label: t("previewDesktop"), icon: Laptop };
      if (index === 1) return { type: "tablet", label: t("previewTablet"), icon: Tablet };
      if (index === 2) return { type: "mobile", label: t("previewMobile"), icon: Smartphone };
    }
    return null;
  };


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
      <div className="relative w-full rounded-none overflow-hidden text-white px-4 sm:px-10 lg:px-16 py-8 sm:py-12 lg:py-16 border-b border-border/40 shadow-xs bg-neutral-900">
        {/* Blurred ambient cover background */}
        {app.cover_url && (
          <div
            className="absolute inset-0 bg-cover bg-center scale-110 blur-3xl opacity-60 pointer-events-none"
            style={{ backgroundImage: `url(${app.cover_url})` }}
          />
        )}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-end justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 sm:gap-6">
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
              className="w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 rounded-2xl sm:rounded-[28px] object-cover shadow-2xl border border-white/20 shrink-0 bg-white"
            />
            <div className="space-y-1.5">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white">
                {app.name}
              </h1>
              <p className="text-sm sm:text-base text-gray-200 font-medium">
                {app.tagline}
              </p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-white/20 text-white backdrop-blur-md">
                  {app.price || t("freeWebApp")}
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
              <span>{t("visitWebsite")}</span>
              <ExternalLink className="w-4 h-4 stroke-[2.5]" />
            </a>

            <button
              onClick={handleShare}
              className="px-5 py-2.5 rounded-full bg-white/20 hover:bg-white/30 text-white font-semibold text-sm backdrop-blur-md transition flex items-center justify-center gap-1.5 border border-white/20 shadow-sm cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-green-300" />
                  <span>{t("copied")}</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  <span>{t("share")}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Body Container */}
      <div className="w-full px-4 sm:px-10 lg:px-16 py-6 sm:py-8 space-y-8 sm:space-y-12">
        {/* 2. Metadata / Key Metrics Row: 3 items (Rating, Age, Size/Platform). 排行榜、开发者、语言已移除 */}
        <div className="grid grid-cols-3 divide-x divide-border border-y border-border py-3 sm:py-4 text-center">
          {/* Metric 1: Rating (真实评分) */}
          <div className="py-1 sm:py-2 md:py-0 px-1 sm:px-2 flex flex-col items-center justify-center">
            <span className="text-[10px] sm:text-[11px] font-medium text-muted-foreground">
              {t("ratingsCount", { count: totalRatingsCount })}
            </span>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-base sm:text-lg font-bold text-foreground">
                {averageScore.toFixed(1)}
              </span>
              <div className="flex text-[#FF9500] text-xs">
                {"★".repeat(Math.min(5, Math.max(1, Math.round(averageScore))))}
              </div>
            </div>
          </div>

          {/* Metric 2: Age Rating */}
          <div className="py-1 sm:py-2 md:py-0 px-1 sm:px-2 flex flex-col items-center justify-center">
            <span className="text-[10px] sm:text-[11px] font-medium text-muted-foreground">
              {t("ageRating")}
            </span>
            <span className="text-base sm:text-lg font-bold text-foreground mt-0.5">
              {app.age_rating || "12+"}
            </span>
          </div>

          {/* Metric 3: Size / Platform */}
          <div className="py-1 sm:py-2 md:py-0 px-1 sm:px-2 flex flex-col items-center justify-center">
            <span className="text-[10px] sm:text-[11px] font-medium text-muted-foreground">
              {t("sizePlatform")}
            </span>
            <span className="text-base sm:text-lg font-bold text-foreground mt-0.5">
              {app.size || "Web App"}
            </span>
          </div>
        </div>

        {/* 3. Media Gallery (Screenshots & Showcase & Subpages) */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-foreground">{t("preview")}</h2>

            {/* View switcher between Device Screenshots and Subpages */}
            <div className="inline-flex p-1 bg-secondary/80 rounded-xl border border-border text-xs font-medium">
              <button
                onClick={() => setPreviewTab("devices")}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  previewTab === "devices"
                    ? "bg-card text-foreground font-semibold shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                多端预览
              </button>
              <button
                onClick={() => setPreviewTab("subpages")}
                className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                  previewTab === "subpages"
                    ? "bg-card text-foreground font-semibold shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span>更多收录页面</span>
                <span className="px-1.5 py-0.2 rounded-full bg-primary/15 text-primary text-[10px] font-bold">
                  {app.subpages?.length || 0}
                </span>
              </button>
            </div>
          </div>

          {previewTab === "subpages" ? (
            /* Subpages Showcase */
            app.subpages && app.subpages.length > 0 ? (
              <div className="space-y-3">
                <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 no-scrollbar scroll-smooth snap-x touch-pan-x">
                  {app.subpages.map((sub, i) => (
                    <div
                      key={sub.id || i}
                      className="snap-start shrink-0 w-[280px] sm:w-[340px] rounded-2xl overflow-hidden border border-border shadow-xs bg-card group flex flex-col justify-between"
                    >
                      <div
                        className="relative h-[170px] sm:h-[200px] bg-muted overflow-hidden cursor-zoom-in group/img"
                        onClick={() => setActiveSubpageScreenshot(sub.screenshot)}
                        title="点击放大查看该页面截图"
                      >
                        <img
                          src={sub.screenshot}
                          alt={sub.title}
                          className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-black/75 backdrop-blur-xs text-white text-[10px] font-bold tracking-wide border border-white/20 shadow-xs">
                          🏷️ {sub.label || "核心页面"}
                        </div>
                      </div>

                      <div className="p-3.5 space-y-2.5 flex-1 flex flex-col justify-between">
                        <div className="space-y-0.5">
                          <h3
                            className="font-bold text-sm text-foreground truncate"
                            title={sub.title}
                          >
                            {sub.title}
                          </h3>
                          <p
                            className="text-xs font-mono text-muted-foreground truncate"
                            title={sub.path}
                          >
                            {sub.path}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-border flex items-center justify-between gap-2">
                          {sub.article_id || (app.articles && app.articles.length > 0) ? (
                            <a
                              href={`/article/${sub.article_id || app.articles?.[0]?.id}`}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>查看推荐解读</span>
                            </a>
                          ) : (
                            <span className="text-[11px] text-muted-foreground font-medium">
                              已完成快照收录
                            </span>
                          )}

                          <a
                            href={sub.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 font-medium transition"
                          >
                            <span>访问原页面</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground pt-1 border-t border-border/60">
                  <span>提示：点击任意截图即可全屏放大查看，已自动标注页面分类与特性。</span>
                  <a
                    href={`/recommend?url=${encodeURIComponent(app.url)}`}
                    className="text-primary hover:underline font-semibold inline-flex items-center gap-1"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>收纳更多子页面</span>
                  </a>
                </div>
              </div>
            ) : (
              <div className="w-full py-10 px-6 bg-card rounded-2xl border border-dashed border-border flex flex-col items-center justify-center text-center space-y-3 shadow-xs">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  <Layers className="w-6 h-6 stroke-[1.8]" />
                </div>
                <div className="space-y-1 max-w-md">
                  <p className="text-sm font-bold text-foreground">尚未收纳更多子页面快照</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    当前应用仅收纳了主站核心快照。在【推荐】提交该应用的具体子页面（如 /docs、/features 等），系统将自动完成页面截图收纳、标注提炼并生成深度推荐文章！
                  </p>
                </div>
                <a
                  href={`/recommend?url=${encodeURIComponent(app.url)}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary-hover transition shadow-2xs"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>为该应用收纳子页面</span>
                </a>
              </div>
            )
          ) : previewImages.length === 0 || allImagesFailed ? (
            <div className="w-full py-16 px-4 bg-card rounded-2xl border border-border flex flex-col items-center justify-center text-center space-y-2 select-none shadow-xs">
              <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-muted-foreground mb-1">
                <ImageOff className="w-6 h-6 stroke-[1.5]" />
              </div>
              <p className="text-sm font-semibold text-foreground">{t("noPreview")}</p>
              <p className="text-xs text-muted-foreground">{t("noPreviewDesc")}</p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 no-scrollbar scroll-smooth snap-x touch-pan-x">
                {previewImages.map((img, i) => {
                  const device = getImageDevice(img, i);
                  return (
                    <div
                      key={i}
                      onClick={() => {
                        if (!failedImages[i]) {
                          setActiveImageIndex(i);
                        }
                      }}
                      className="snap-start shrink-0 rounded-2xl overflow-hidden border border-border shadow-xs bg-card group relative cursor-zoom-in hover:border-primary/50 transition-colors"
                      title={device ? device.label : t("preview")}
                    >
                      {device && !failedImages[i] && (
                        <div className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-full bg-black/65 backdrop-blur-md text-white text-[11px] font-medium flex items-center gap-1.5 shadow-xs border border-white/15 pointer-events-none">
                          <device.icon className="w-3 h-3" />
                          <span>{device.label}</span>
                        </div>
                      )}
                      {failedImages[i] ? (
                        <div className="h-[200px] sm:h-[280px] md:h-[320px] w-[300px] sm:w-[460px] max-w-[85vw] bg-muted flex flex-col items-center justify-center text-muted-foreground gap-2 select-none border border-border">
                          <ImageOff className="w-8 h-8 stroke-[1.5]" />
                          <span className="text-xs font-medium">{t("noPreview")}</span>
                        </div>
                      ) : (
                        <img
                          src={img}
                          alt={`${app.name} preview ${i + 1}`}
                          onError={() => {
                            setFailedImages((prev) => ({ ...prev, [i]: true }));
                          }}
                          className="h-[200px] sm:h-[280px] md:h-[320px] w-auto max-w-[85vw] sm:max-w-[620px] object-cover transition duration-300 group-hover:scale-[1.01]"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1 flex-wrap">
                <span className="flex items-center gap-1.5 font-medium">
                  <Laptop className="w-3.5 h-3.5 text-primary" />
                  <span>{t("previewDesktop")}</span>
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <Tablet className="w-3.5 h-3.5 text-primary" />
                  <span>{t("previewTablet")}</span>
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <Smartphone className="w-3.5 h-3.5 text-primary" />
                  <span>{t("previewMobile")}</span>
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 4. Description Section */}
        <div className="space-y-3 border-t border-border pt-6">
          <h2 className="text-lg font-bold text-foreground">
            {t("aboutApp")}
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
              {descExpanded ? t("showLess") : t("showMore")}
            </button>
          </div>
        </div>

        {/* 4.5. What's New Section (if release notes exist) */}
        {app.release_notes && (
          <div className="space-y-3 border-t border-border pt-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">{t("whatsNew")}</h2>
              <span className="text-xs text-muted-foreground">
                {t("version")} {app.version || "1.0.0"}
              </span>
            </div>
            <p className="text-xs text-foreground/90 leading-relaxed whitespace-pre-line">
              {app.release_notes}
            </p>
          </div>
        )}

        {/* 5. Ratings & Reviews */}
        <div className="space-y-6 border-t border-border pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <h2 className="text-lg font-bold text-foreground">
                {t("ratingsReviews")}
              </h2>
              <span className="text-sm text-muted-foreground font-normal">&gt;</span>
            </div>
            <button
              onClick={() => setShowReviewModal(true)}
              className="text-xs font-semibold text-foreground hover:underline cursor-pointer"
            >
              {t("writeReview")}
            </button>
          </div>

          {/* Rating Breakdown & Real Interactive Rating Box */}
          <div className="bg-card border border-border p-4 sm:p-6 rounded-2xl shadow-xs space-y-5 sm:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-8">
              {/* Overall Score & Real Count */}
              <div className="shrink-0 min-w-[130px]">
                <div className="text-5xl font-extrabold text-foreground tracking-tight">
                  {averageScore.toFixed(1)}
                </div>
                <div className="text-xs text-muted-foreground mt-1 font-medium">
                  {t("outOf5")}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5 font-medium">
                  {t("totalRatings", { count: totalRatingsCount })}
                </div>
              </div>

              {/* Star bars */}
              <div className="flex-1 max-w-md space-y-1.5 w-full">
                {[5, 4, 3, 2, 1].map((stars) => {
                  const pct = starWidths[stars as 1 | 2 | 3 | 4 | 5];
                  const count = starCounts[stars as 1 | 2 | 3 | 4 | 5];
                  return (
                    <div key={stars} className="flex items-center gap-3 text-xs">
                      <div className="w-16 flex items-center justify-end gap-0.5 text-muted-foreground shrink-0 select-none">
                        {Array.from({ length: stars }).map((_, i) => (
                          <span key={i} className="text-[#FF9500] text-xs">
                            ★
                          </span>
                        ))}
                      </div>
                      <div className="flex-1 h-2 bg-secondary/80 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-muted-foreground/60 dark:bg-muted-foreground/40 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-8 text-right text-[11px] text-muted-foreground/70 shrink-0 font-mono">
                        {reviews.length > 0 ? count : `${pct}%`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Interactive Rating Component */}
            <div className="pt-5 border-t border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-0.5">
                <div className="text-sm font-bold text-foreground flex items-center gap-2">
                  <span>{t("tapToRate")}</span>
                  {hasRated && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium border border-emerald-500/20">
                      {t("rated", { rating: userRating })}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {ratingSuccessMessage ||
                    (hasRated ? t("rateThanks") : t("ratePrompt"))}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                {/* 5 Interactive Stars */}
                <div
                  className="flex items-center gap-1"
                  onMouseLeave={() => setHoverRating(0)}
                >
                  {[1, 2, 3, 4, 5].map((s) => {
                    const active = (hoverRating || userRating) >= s;
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setUserRating(s)}
                        onMouseEnter={() => setHoverRating(s)}
                        className="p-1 text-2xl transition-transform hover:scale-125 cursor-pointer focus:outline-none"
                        title={t("submitRating", { rating: s })}
                      >
                        <span
                          className={
                            active ? "text-[#FF9500]" : "text-muted-foreground/25"
                          }
                        >
                          ★
                        </span>
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => handleQuickRate(userRating)}
                  disabled={ratingSubmitting}
                  className="px-4 py-1.5 rounded-full text-xs font-bold bg-primary text-primary-foreground hover:opacity-90 shadow-2xs transition disabled:opacity-50 cursor-pointer"
                >
                  {ratingSubmitting
                    ? t("submitting")
                    : hasRated
                    ? t("updateRating")
                    : t("submitRating", { rating: userRating })}
                </button>
              </div>
            </div>
          </div>

          {/* User Review Cards (2-column layout) */}
          {reviews.length > 0 && (
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
                    <span className="text-muted-foreground font-medium">
                      {rev.author}
                    </span>
                  </div>
                  <p className="text-xs text-foreground/90 leading-relaxed line-clamp-4">
                    {rev.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Review Modal */}
        {showReviewModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
            <div className="bg-card border border-border text-foreground rounded-2xl sm:rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-bold text-foreground">{t("writeReview")}</h3>
              <form onSubmit={handleReviewSubmit} className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                    {t("reviewTitle")}
                  </label>
                  <input
                    type="text"
                    required
                    value={reviewForm.title}
                    onChange={(e) =>
                      setReviewForm({ ...reviewForm, title: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs border border-border rounded-xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                    {t("reviewAuthor")}
                  </label>
                  <input
                    type="text"
                    required
                    value={reviewForm.author}
                    onChange={(e) =>
                      setReviewForm({ ...reviewForm, author: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs border border-border rounded-xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                    {t("ratingsReviews")}
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
                          reviewForm.rating >= s
                            ? "text-[#FF9500]"
                            : "text-muted-foreground/30"
                        }
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                    {t("reviewContent")}
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={reviewForm.content}
                    onChange={(e) =>
                      setReviewForm({ ...reviewForm, content: e.target.value })
                    }
                    placeholder={t("reviewPlaceholder")}
                    className="w-full px-3 py-2 text-xs border border-border rounded-xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowReviewModal(false)}
                    className="px-4 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-secondary rounded-full cursor-pointer"
                  >
                    {t("cancel")}
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-1.5 text-xs font-bold bg-foreground text-background rounded-full hover:opacity-90 disabled:opacity-50 cursor-pointer"
                  >
                    {submitting ? t("submitting") : t("submitReview")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 6. App Privacy */}
        <div className="space-y-4 border-t border-border pt-6">
          <div className="flex items-center gap-1.5">
            <h2 className="text-lg font-bold text-foreground">{t("appPrivacy")}</h2>
            <span className="text-sm text-muted-foreground font-normal">&gt;</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {t("appPrivacyDesc")}
            <a
              href={app.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground hover:underline ml-1"
            >
              {t("privacyPolicy")}
            </a>
            .
          </p>

          {/* 2 Privacy Cards Side by Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Linked Data Card */}
            <div className="bg-card p-4 sm:p-6 rounded-2xl border border-border text-center space-y-3 shadow-xs">
              <div className="w-12 h-12 mx-auto rounded-full bg-secondary flex items-center justify-center text-foreground">
                <UserCheck className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-sm text-foreground">{t("dataLinked")}</h3>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                {t("dataLinkedDesc")}
              </p>
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                {(app.privacy_linked || ["Contact Info", "User Content", "Identifiers"]).map(
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
            <div className="bg-card p-4 sm:p-6 rounded-2xl border border-border text-center space-y-3 shadow-xs">
              <div className="w-12 h-12 mx-auto rounded-full bg-secondary flex items-center justify-center text-foreground">
                <UserX className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-sm text-foreground">
                {t("dataNotLinked")}
              </h3>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                {t("dataNotLinkedDesc")}
              </p>
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                {(app.privacy_not_linked || ["Location", "Usage Data", "Diagnostics"]).map(
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
            <a href="#" className="text-foreground hover:underline">
              {t("learnMore")}
            </a>
          </p>
        </div>

        {/* 7. Information Grid: 排行榜、开发者、语言已去除 */}
        <div className="space-y-4 border-t border-border pt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">{t("information")}</h2>
            <a
              href={app.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-foreground hover:underline"
            >
              {t("privacyPolicy")} ↗
            </a>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 text-xs bg-card p-4 sm:p-6 rounded-2xl border border-border shadow-xs">
            <div>
              <span className="text-muted-foreground block mb-0.5">{t("size")}</span>
              <span className="font-semibold text-foreground">{app.size || "Web App"}</span>
            </div>
            <div>
              <span className="text-muted-foreground block mb-0.5">{t("category")}</span>
              <span className="font-semibold text-foreground">
                {(app.categories || [app.category || "WEB"]).join(", ")}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block mb-0.5">{t("compatibility")}</span>
              <span className="font-semibold text-foreground">
                {app.compatibility || "Web Browser"}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block mb-0.5">{t("ageRating")}</span>
              <span className="font-semibold text-foreground">{app.age_rating || "12+"}</span>
            </div>
            <div>
              <span className="text-muted-foreground block mb-0.5">{t("inAppPurchases")}</span>
              <span className="font-semibold text-foreground">{t("yes")}</span>
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <span className="text-muted-foreground block mb-0.5">{t("copyright")}</span>
              <span className="font-semibold text-foreground">
                Copyright © {new Date().getFullYear()} {app.name}. All Rights Reserved.
              </span>
            </div>
          </div>
        </div>

        {/* 8. Related Topics / AI Generated Recommendation Articles (Image #1 replacement) */}
        {((app.articles && app.articles.length > 0) || (app.related_topics && app.related_topics.length > 0)) && (
          <div className="space-y-4 border-t border-border pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-foreground">
                  {locale === "zh-cn" ? "精选推荐解读" : "Editor's Deep Dive"}
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                  AI 自动生成
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Prefer real AI-generated articles if present, otherwise related topics */}
              {app.articles && app.articles.length > 0
                ? app.articles.map((article) => (
                    <a
                      key={article.id}
                      href={`/article/${article.id}`}
                      className="relative rounded-3xl overflow-hidden border border-border shadow-xs group h-64 flex flex-col justify-end p-5 transition-all hover:border-primary/50 block"
                    >
                      <img
                        src={article.cover_image || app.cover_url}
                        alt={article.title}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                      <div className="relative z-10 text-white space-y-1.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-white/80 px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-xs">
                            {article.tag || "精选推荐"}
                          </span>
                          {article.github_url && /^https?:\/\/(?:www\.)?github\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+/.test(article.github_url) && (
                            <span className="text-[10px] font-bold text-emerald-300 px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-xs flex items-center gap-1 border border-emerald-500/30">
                              <Code2 className="w-3 h-3" />
                              <span>GitHub 仓库</span>
                            </span>
                          )}
                          {article.x_url && (
                            <span className="text-[10px] font-bold text-sky-300 px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-xs flex items-center gap-1 border border-sky-500/30">
                              <Share2 className="w-3 h-3" />
                              <span>X 社区动态</span>
                            </span>
                          )}
                        </div>

                        <h3 className="text-base sm:text-lg font-bold leading-snug group-hover:text-primary-foreground transition">
                          {article.title}
                        </h3>
                        <p className="text-xs text-white/80 line-clamp-2 leading-relaxed">
                          {article.summary}
                        </p>

                        <div className="pt-1 flex items-center gap-1 text-xs font-semibold text-primary-foreground group-hover:translate-x-1 transition-transform">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>阅读推荐文章全文 →</span>
                        </div>
                      </div>
                    </a>
                  ))
                : app.related_topics?.map((topic, i) => {
                    const articleTargetId = topic.article_id || (app.articles && app.articles[0]?.id) || "";
                    const targetHref = articleTargetId
                      ? `/article/${articleTargetId}`
                      : `/recommend?url=${encodeURIComponent(app.url)}`;

                    return (
                      <a
                        key={i}
                        href={targetHref}
                        className="relative rounded-3xl overflow-hidden border border-border shadow-xs group h-64 cursor-pointer block"
                      >
                        <img
                          src={topic.image || app.cover_url}
                          alt={topic.title}
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

                        <div className="relative z-10 h-full flex flex-col justify-end p-5 text-white space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-white/70 px-2 py-0.5 rounded-full bg-white/20">
                              {topic.tag || "精选推荐"}
                            </span>
                            {topic.github_url && /^https?:\/\/(?:www\.)?github\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+/.test(topic.github_url) && (
                              <span className="text-[10px] font-bold text-emerald-300 px-2 py-0.5 rounded-full bg-black/40 flex items-center gap-1">
                                <Code2 className="w-3 h-3" />
                                <span>GitHub</span>
                              </span>
                            )}
                          </div>
                          <h3 className="text-base font-bold leading-snug">
                            {topic.title}
                          </h3>
                          <p className="text-xs text-white/80 line-clamp-2">
                            {topic.desc}
                          </p>
                          <div className="pt-1 flex items-center gap-1 text-xs font-semibold text-white/90 group-hover:translate-x-1 transition-transform">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>点击阅读深度文章 →</span>
                          </div>
                        </div>
                      </a>
                    );
                  })}
            </div>
          </div>
        )}

        {/* 9. Recommended Apps */}
        {otherApps.length > 0 && (
          <div className="space-y-4 border-t border-border pt-6">
            <div className="flex items-center gap-1.5">
              <h2 className="text-lg font-bold text-foreground">
                {t("recommendedApps")}
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
                    {tCommon("view")}
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
          className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-8 animate-fade-in select-none"
        >
          <button
            onClick={() => setActiveImageIndex(null)}
            className="absolute top-3 right-3 sm:top-6 sm:right-6 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer z-50 border border-white/20"
            aria-label="Close"
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
              className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer z-50 border border-white/20"
              aria-label="Previous"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          )}

          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-5xl max-h-[85vh] w-full h-full flex flex-col items-center justify-center"
          >
            <img
              src={previewImages[activeImageIndex]}
              alt={`${app.name} preview full ${activeImageIndex + 1}`}
              className="max-h-[80vh] max-w-full w-auto h-auto object-contain rounded-2xl shadow-2xl border border-white/10"
            />
            {(() => {
              const dev = getImageDevice(previewImages[activeImageIndex], activeImageIndex);
              return (
                <div className="flex items-center gap-2 mt-3">
                  {dev && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 text-white text-xs font-medium border border-white/20">
                      <dev.icon className="w-3 h-3" />
                      {dev.label}
                    </span>
                  )}
                  <span className="text-white/60 text-xs font-mono">
                    {activeImageIndex + 1} / {previewImages.length}
                  </span>
                </div>
              );
            })()}
          </div>

          {previewImages.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveImageIndex((prev) =>
                  prev !== null && prev < previewImages.length - 1
                    ? prev + 1
                    : 0
                );
              }}
              className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer z-50 border border-white/20"
              aria-label="Next"
            >
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          )}
        </div>
      )}

      {/* Subpage Screenshot Viewer Modal */}
      {activeSubpageScreenshot && (
        <div
          onClick={() => setActiveSubpageScreenshot(null)}
          className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-8 animate-fade-in select-none cursor-zoom-out"
        >
          <button
            onClick={() => setActiveSubpageScreenshot(null)}
            className="absolute top-3 right-3 sm:top-6 sm:right-6 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer z-50 border border-white/20"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-5xl max-h-[85vh] w-full h-full flex flex-col items-center justify-center cursor-default"
          >
            <img
              src={activeSubpageScreenshot}
              alt="子页面快照"
              className="max-h-[80vh] max-w-full w-auto h-auto object-contain rounded-2xl shadow-2xl border border-white/10"
            />
            <div className="flex items-center gap-2 mt-3 text-white/70 text-xs font-medium">
              <span>收录子页面快照</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
