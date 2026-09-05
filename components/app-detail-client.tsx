"use client";

import { useState } from "react";
import { Share2, ExternalLink, ChevronDown, Check, UserCheck, UserX } from "lucide-react";
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

  const handleShare = async () => {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!reviewForm.title || !reviewForm.content) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/apps/${app.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reviewForm),
      });
      const data = (await res.json()) as { success: boolean; review: ReviewItem };
      if (data.success && data.review) {
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
    <div className="space-y-12 pb-20">
      {/* 1. Hero / Header Section (Image #4) */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#7C4A1E] via-[#4A260E] to-[#1C130C] text-white p-8 lg:p-10 shadow-lg border border-black/10">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-overlay"
          style={{ backgroundImage: `url(${app.cover_url})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

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

          {/* Action buttons */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <a
              href={app.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 md:flex-none px-6 py-2.5 rounded-full bg-black hover:bg-neutral-800 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2"
            >
              <span>访问网站</span>
              <ExternalLink className="w-4 h-4" />
            </a>

            <button
              onClick={handleShare}
              className="px-5 py-2.5 rounded-full bg-white/20 hover:bg-white/30 text-white font-semibold text-sm backdrop-blur-md transition flex items-center justify-center gap-1.5 border border-white/20 shadow-sm"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-green-400" />
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

      {/* 2. Metadata / Key Metrics Row (Image #4) */}
      <div className="grid grid-cols-3 md:grid-cols-6 divide-y md:divide-y-0 md:divide-x divide-[#E5E5EA] border-y border-[#E5E5EA] py-4 text-center">
        {/* Metric 1: Rating */}
        <div className="py-2 md:py-0 px-2 flex flex-col items-center justify-center">
          <span className="text-[11px] font-medium text-[#86868B]">
            {app.rating_count} 个评分
          </span>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-lg font-bold text-[#1D1D1F]">{app.rating}</span>
            <div className="flex text-[#FF9500] text-xs">
              {"★".repeat(Math.round(app.rating))}
            </div>
          </div>
        </div>

        {/* Metric 2: Age */}
        <div className="py-2 md:py-0 px-2 flex flex-col items-center justify-center">
          <span className="text-[11px] font-medium text-[#86868B]">年龄分级</span>
          <span className="text-lg font-bold text-[#1D1D1F] mt-0.5">
            {app.age_rating}
          </span>
        </div>

        {/* Metric 3: Ranking */}
        <div className="py-2 md:py-0 px-2 flex flex-col items-center justify-center">
          <span className="text-[11px] font-medium text-[#86868B]">排行榜</span>
          <span className="text-sm font-bold text-[#1D1D1F] mt-0.5 truncate max-w-[120px]">
            {app.ranking || `#1 ${(app.categories || [app.category || "WEB"]).join(" · ")}`}
          </span>
        </div>

        {/* Metric 4: Developer */}
        <div className="py-2 md:py-0 px-2 flex flex-col items-center justify-center">
          <span className="text-[11px] font-medium text-[#86868B]">开发者</span>
          <span className="text-xs font-semibold text-[#1D1D1F] mt-1.5 truncate max-w-[120px]">
            {app.developer}
          </span>
        </div>

        {/* Metric 5: Language */}
        <div className="py-2 md:py-0 px-2 flex flex-col items-center justify-center">
          <span className="text-[11px] font-medium text-[#86868B]">语言</span>
          <span className="text-lg font-bold text-[#1D1D1F] mt-0.5">ZH</span>
          <span className="text-[10px] text-[#86868B]">简体中文</span>
        </div>

        {/* Metric 6: Size */}
        <div className="py-2 md:py-0 px-2 flex flex-col items-center justify-center">
          <span className="text-[11px] font-medium text-[#86868B]">大小 / 平台</span>
          <span className="text-lg font-bold text-[#1D1D1F] mt-0.5">
            {app.size || "Web App"}
          </span>
        </div>
      </div>

      {/* 3. Media Gallery (Screenshots & Showcase) (Image #4) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-[#86868B]">
          <div className="flex items-center gap-1 cursor-pointer hover:text-[#1D1D1F]">
            <span>iPhone、iPad 专区预览</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none snap-x">
          {/* Main 16:9 Cover Banner */}
          <div className="snap-start shrink-0 w-[520px] h-[292px] rounded-2xl overflow-hidden border border-[#E5E5EA] shadow-sm relative group bg-black">
            <img
              src={app.cover_url}
              alt="Cover Preview"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200";
              }}
              className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-4">
              <span className="text-xs font-semibold text-white/90 bg-black/40 backdrop-blur px-2.5 py-1 rounded-md">
                16:9 高清预览
              </span>
            </div>
          </div>
          {/* Screenshot Cards */}
          {(app.screenshots || []).map((img, i) => (
            <div
              key={i}
              className="snap-start shrink-0 w-[180px] h-[292px] rounded-2xl overflow-hidden border border-[#E5E5EA] shadow-sm bg-gray-100 group relative"
            >
              <img
                src={img}
                alt={`Screenshot ${i + 1}`}
                className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
              />
            </div>
          ))}
        </div>
      </div>

      {/* 4. Description Section (Image #3 & #4) */}
      <div className="space-y-3 border-t border-[#E5E5EA] pt-6">
        <h2 className="text-lg font-bold text-[#1D1D1F]">
          【应用介绍】
        </h2>
        <div className="relative">
          <p
            className={`text-sm text-[#1D1D1F] leading-relaxed whitespace-pre-line ${
              !descExpanded ? "line-clamp-4" : ""
            }`}
          >
            {app.description}
          </p>
          <button
            onClick={() => setDescExpanded(!descExpanded)}
            className="text-xs font-semibold text-black hover:underline mt-2 inline-block cursor-pointer"
          >
            {descExpanded ? "收起" : "更多"}
          </button>
        </div>
      </div>

      {/* 5. Events Section (活动) (Image #3) */}
      {app.events && app.events.length > 0 && (
        <div className="space-y-4 border-t border-[#E5E5EA] pt-6">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-[#1D1D1F]">活动</h2>
            <span className="text-xs font-bold text-black">
              {app.events[0].badge || "现已推出"}
            </span>
          </div>

          <div className="relative h-64 rounded-2xl overflow-hidden border border-[#E5E5EA] shadow-sm group">
            <img
              src={app.events[0].image || app.cover_url}
              alt="Event Key Art"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex flex-col justify-end p-6 text-white space-y-1">
              <span className="text-xs font-bold text-orange-400 uppercase tracking-wider">
                {app.events[0].tag || "重磅更新"}
              </span>
              <h3 className="text-lg font-bold leading-snug">
                {app.events[0].title}
              </h3>
              <p className="text-xs text-white/80 line-clamp-2 max-w-2xl">
                {app.events[0].desc}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 6. Ratings & Reviews (评分及评论) (Image #3) */}
      <div className="space-y-6 border-t border-[#E5E5EA] pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <h2 className="text-lg font-bold text-[#1D1D1F]">
              评分及评论
            </h2>
            <span className="text-sm text-[#86868B] font-normal">&gt;</span>
          </div>
          <button
            onClick={() => setShowReviewModal(true)}
            className="text-xs font-semibold text-black hover:underline"
          >
            撰写评论
          </button>
        </div>

        {/* Rating Breakdown */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-8 bg-[#F5F5F7] p-6 rounded-2xl">
          <div>
            <div className="text-5xl font-extrabold text-[#1D1D1F]">
              {app.rating}
            </div>
            <div className="text-xs text-[#86868B] mt-1 font-medium">
              满分 5 分
            </div>
            <div className="text-xs text-[#86868B] mt-0.5">
              {app.rating_count} 个评分
            </div>
          </div>

          {/* Star bars */}
          <div className="flex-1 max-w-md space-y-1.5">
            {[5, 4, 3, 2, 1].map((stars) => {
              const widths = [85, 10, 3, 1, 1];
              return (
                <div key={stars} className="flex items-center gap-2 text-xs">
                  <span className="w-8 text-right font-medium text-[#86868B]">
                    {"★".repeat(stars)}
                  </span>
                  <div className="flex-1 h-1.5 bg-[#E5E5EA] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#86868B] rounded-full"
                      style={{ width: `${widths[5 - stars]}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* User Review Cards (2-column layout matching Image #3) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reviews.slice(0, 4).map((rev) => (
            <div
              key={rev.id}
              className="bg-[#F5F5F7] p-5 rounded-2xl space-y-2 border border-[#E5E5EA]"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-[#1D1D1F]">
                  {rev.title}
                </span>
                <span className="text-xs text-[#86868B]">{rev.date}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="text-[#FF9500]">
                  {"★".repeat(rev.rating)}
                  {"☆".repeat(5 - rev.rating)}
                </div>
                <span className="text-[#86868B] font-medium">{rev.author}</span>
              </div>
              <p className="text-xs text-[#1D1D1F] leading-relaxed line-clamp-4">
                {rev.content}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-[#1D1D1F]">撰写评论</h3>
            <form onSubmit={handleReviewSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-[#86868B] block mb-1">
                  昵称
                </label>
                <input
                  type="text"
                  value={reviewForm.author}
                  onChange={(e) =>
                    setReviewForm({ ...reviewForm, author: e.target.value })
                  }
                  placeholder="吃葡萄糖的小猫"
                  className="w-full px-3 py-2 text-xs border border-[#E5E5EA] rounded-xl focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#86868B] block mb-1">
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
                  className="w-full px-3 py-2 text-xs border border-[#E5E5EA] rounded-xl focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#86868B] block mb-1">
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
                          : "text-gray-300"
                      }
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-[#86868B] block mb-1">
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
                  className="w-full px-3 py-2 text-xs border border-[#E5E5EA] rounded-xl focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="px-4 py-1.5 text-xs font-semibold text-[#86868B] hover:bg-gray-100 rounded-full"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-1.5 text-xs font-bold bg-black text-white rounded-full hover:bg-neutral-800 disabled:opacity-50"
                >
                  {submitting ? "提交中..." : "发表评论"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. What's New (新功能) (Image #2) */}
      <div className="space-y-3 border-t border-[#E5E5EA] pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <h2 className="text-lg font-bold text-[#1D1D1F]">新功能</h2>
            <span className="text-sm text-[#86868B] font-normal">&gt;</span>
          </div>
          <div className="text-right text-xs text-[#86868B] space-x-2">
            <span>版本 {app.version}</span>
            <span>•</span>
            <span>{app.version_date}</span>
          </div>
        </div>
        <p className="text-xs text-[#1D1D1F] leading-relaxed whitespace-pre-line">
          {app.release_notes}
        </p>
      </div>

      {/* 8. App Privacy (App 隐私) (Image #2) */}
      <div className="space-y-4 border-t border-[#E5E5EA] pt-6">
        <div className="flex items-center gap-1.5">
          <h2 className="text-lg font-bold text-[#1D1D1F]">App 隐私</h2>
          <span className="text-sm text-[#86868B] font-normal">&gt;</span>
        </div>
        <p className="text-xs text-[#86868B] leading-relaxed">
          开发者“{app.developer}”已表明该 App 的隐私规范可能包括下述数据处理方式。有关更多信息，请参阅
          <a
            href={app.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-black hover:underline ml-1"
          >
            开发者隐私政策
          </a>
          。
        </p>

        {/* 2 Privacy Cards Side by Side (Matching Image #2) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Linked Data Card */}
          <div className="bg-[#F5F5F7] p-6 rounded-2xl border border-[#E5E5EA] text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-neutral-100 flex items-center justify-center text-black">
              <UserCheck className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-sm text-[#1D1D1F]">与你关联的数据</h3>
            <p className="text-xs text-[#86868B] max-w-xs mx-auto">
              开发者可能会收集以下数据，且数据与你的身份关联：
            </p>
            <div className="flex flex-wrap justify-center gap-2 pt-2">
              {(app.privacy_linked || ["联系信息", "用户内容", "标识符"]).map(
                (item) => (
                  <span
                    key={item}
                    className="text-xs px-3 py-1 bg-white rounded-lg border border-[#E5E5EA] font-medium text-[#1D1D1F]"
                  >
                    {item}
                  </span>
                )
              )}
            </div>
          </div>

          {/* Not Linked Data Card */}
          <div className="bg-[#F5F5F7] p-6 rounded-2xl border border-[#E5E5EA] text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-neutral-100 flex items-center justify-center text-black">
              <UserX className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-sm text-[#1D1D1F]">
              未与你关联的数据
            </h3>
            <p className="text-xs text-[#86868B] max-w-xs mx-auto">
              开发者可能会收集以下数据，但数据不会关联你的身份：
            </p>
            <div className="flex flex-wrap justify-center gap-2 pt-2">
              {(app.privacy_not_linked || ["位置", "使用数据", "诊断"]).map(
                (item) => (
                  <span
                    key={item}
                    className="text-xs px-3 py-1 bg-white rounded-lg border border-[#E5E5EA] font-medium text-[#1D1D1F]"
                  >
                    {item}
                  </span>
                )
              )}
            </div>
          </div>
        </div>

        <p className="text-[11px] text-[#86868B] pt-1">
          隐私规范可能因你使用的功能或你的年龄等因素而异。
          <a href="#" className="text-black hover:underline ml-1">
            进一步了解
          </a>
        </p>
      </div>

      {/* 9. Accessibility (辅助功能) (Image #2) */}
      <div className="space-y-2 border-t border-[#E5E5EA] pt-6">
        <h2 className="text-lg font-bold text-[#1D1D1F]">辅助功能</h2>
        <p className="text-xs text-[#86868B]">
          开发者尚未表明此 App 支持哪些辅助功能。
          <a href="#" className="text-black hover:underline ml-1">
            进一步了解
          </a>
        </p>
      </div>

      {/* 10. Information Grid (信息) (Image #5) */}
      <div className="space-y-4 border-t border-[#E5E5EA] pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#1D1D1F]">信息</h2>
          <a
            href={app.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-black hover:underline"
          >
            隐私政策 ↗
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs bg-[#F5F5F7] p-6 rounded-2xl border border-[#E5E5EA]">
          {/* Row 1 */}
          <div>
            <span className="text-[#86868B] block mb-0.5">提供者</span>
            <span className="font-semibold text-[#1D1D1F]">{app.developer}</span>
          </div>
          <div>
            <span className="text-[#86868B] block mb-0.5">大小</span>
            <span className="font-semibold text-[#1D1D1F]">{app.size}</span>
          </div>
          <div>
            <span className="text-[#86868B] block mb-0.5">类别</span>
            <span className="font-semibold text-[#1D1D1F]">
              {(app.categories || [app.category || "WEB"]).join("、")}
            </span>
          </div>

          {/* Row 2 */}
          <div>
            <span className="text-[#86868B] block mb-0.5">兼容性</span>
            <span className="font-semibold text-[#1D1D1F]">
              {app.compatibility}
            </span>
          </div>
          <div>
            <span className="text-[#86868B] block mb-0.5">语言</span>
            <span className="font-semibold text-[#1D1D1F]">{app.languages}</span>
          </div>
          <div>
            <span className="text-[#86868B] block mb-0.5">年龄分级</span>
            <span className="font-semibold text-[#1D1D1F]">{app.age_rating}</span>
          </div>

          {/* Row 3 */}
          <div>
            <span className="text-[#86868B] block mb-0.5">App内购买</span>
            <span className="font-semibold text-[#1D1D1F]">是</span>
          </div>
          <div className="md:col-span-2">
            <span className="text-[#86868B] block mb-0.5">版权</span>
            <span className="font-semibold text-[#1D1D1F]">
              Copyright © {new Date().getFullYear()} {app.developer}. All Rights Reserved.
            </span>
          </div>
        </div>
      </div>

      {/* 11. Related Topics (相关专题) (Image #5) */}
      {app.related_topics && app.related_topics.length > 0 && (
        <div className="space-y-4 border-t border-[#E5E5EA] pt-6">
          <h2 className="text-lg font-bold text-[#1D1D1F]">相关专题</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {app.related_topics.map((topic, i) => (
              <div
                key={i}
                className="relative h-64 rounded-2xl overflow-hidden border border-[#E5E5EA] shadow-sm group cursor-pointer"
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

      {/* 12. More from Developer (更多来自"..."的 App) (Image #5) */}
      {otherApps.length > 0 && (
        <div className="space-y-4 border-t border-[#E5E5EA] pt-6">
          <div className="flex items-center gap-1.5">
            <h2 className="text-lg font-bold text-[#1D1D1F]">
              更多来自&quot;{app.developer}&quot;的 App
            </h2>
            <span className="text-sm text-[#86868B] font-normal">&gt;</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {otherApps.slice(0, 3).map((item) => (
              <a
                key={item.id}
                href={`/app/${item.id}`}
                className="bg-[#F5F5F7] hover:bg-[#EAEAEA] p-4 rounded-2xl border border-[#E5E5EA] flex items-center justify-between gap-3 group transition"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={item.icon_url}
                    alt={item.name}
                    className="w-12 h-12 rounded-xl object-cover shadow-sm group-hover:scale-105 transition shrink-0"
                  />
                  <div className="min-w-0">
                    <span className="font-bold text-sm text-[#1D1D1F] truncate block">
                      {item.name}
                    </span>
                    <span className="text-xs text-[#86868B] truncate block">
                      {item.tagline || item.category}
                    </span>
                  </div>
                </div>
                <span className="px-4 py-1 rounded-full bg-white text-black font-bold text-xs shadow-sm shrink-0">
                  查看
                </span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
