import Link from "next/link";
import { getAllApps } from "@/lib/db";
import type { AppItem } from "@/lib/types";
import { ChevronRight, Sparkles, PlusCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const allApps = await getAllApps();

  const featuredApps = allApps.filter((a: AppItem) => a.featured);
  const trendingApps = allApps.filter((a: AppItem) => a.trending);
  const heroApp = featuredApps[0] || allApps[0];
  const listApps = trendingApps.length > 0 ? trendingApps.slice(0, 6) : allApps.slice(0, 6);

  // Today date format: e.g. "9月6日 星期日"
  const now = new Date();
  const month = now.getMonth() + 1;
  const date = now.getDate();
  const dayNames = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
  const dayName = dayNames[now.getDay()];
  const dateString = `${month}月${date}日 ${dayName}`;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10">
      {/* Today Header */}
      <div className="border-b border-[#E5E5EA] pb-4">
        <p className="text-xs font-semibold tracking-wider text-[#86868B] uppercase">
          {dateString}
        </p>
        <h1 className="text-4xl font-extrabold text-[#1D1D1F] tracking-tight mt-1">
          Today
        </h1>
      </div>

      {/* Empty State when no apps are in DB */}
      {allApps.length === 0 ? (
        <div className="bg-[#F5F5F7] rounded-3xl p-10 md:p-14 border border-[#E5E5EA] text-center space-y-6 shadow-sm">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-blue-50 text-[#0071E3] flex items-center justify-center shadow-md border border-blue-100">
            <Sparkles className="w-10 h-10" />
          </div>

          <div className="space-y-2 max-w-lg mx-auto">
            <h2 className="text-2xl font-extrabold text-[#1D1D1F] tracking-tight">
              欢迎使用 Web App Store
            </h2>
            <p className="text-sm text-[#86868B] leading-relaxed">
              当前内置数据已全部清空。你可以点击下方或左下角侧边栏底部的【推荐工具】，输入任意网站 URL，AI 自动化流程将为您截取快照并收录！
            </p>
          </div>

          <div className="pt-2">
            <Link
              href="/recommend"
              className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-[#0071E3] hover:bg-[#0077ED] text-white font-bold text-sm shadow-md transition-all hover:shadow-lg hover:scale-105"
            >
              <PlusCircle className="w-4 h-4" />
              <span>开始 AI 一键自动化收录</span>
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Top Grid: Hero Feature Card + Trending Apps Card */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Hero Feature Card (Image #1 style) */}
            {heroApp && (
              <div className="lg:col-span-7 flex flex-col">
                <Link
                  href={`/app/${heroApp.id}`}
                  className="group relative flex-1 min-h-[440px] rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-[#E5E5EA] flex flex-col justify-between p-7 bg-gradient-to-br from-[#FF2D55]/90 via-[#AF52DE]/90 to-[#5856D6] text-white"
                >
                  {/* Background Cover Overlay */}
                  <div
                    className="absolute inset-0 bg-cover bg-center opacity-35 mix-blend-overlay group-hover:scale-105 transition-transform duration-700"
                    style={{ backgroundImage: `url(${heroApp.cover_url})` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  {/* Card Top Text */}
                  <div className="relative z-10 space-y-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-white/80">
                      时下热门 • 精选主打
                    </span>
                    <h2 className="text-2xl lg:text-3xl font-extrabold leading-snug tracking-tight max-w-md">
                      {heroApp.name}：{heroApp.tagline}
                    </h2>
                  </div>

                  {/* Card Bottom: App Icons Strip & Quick Look */}
                  <div className="relative z-10 mt-auto pt-6">
                    <div className="flex items-center justify-between bg-white/15 backdrop-blur-md p-3 rounded-2xl border border-white/20">
                      <div className="flex items-center gap-3">
                        <img
                          src={heroApp.icon_url}
                          alt={heroApp.name}
                          className="w-12 h-12 rounded-xl object-cover shadow-md"
                        />
                        <div>
                          <h3 className="font-bold text-sm leading-tight text-white">
                            {heroApp.name}
                          </h3>
                          <p className="text-xs text-white/80 line-clamp-1">
                            {heroApp.category} • {heroApp.rating}★ ({heroApp.rating_count})
                          </p>
                        </div>
                      </div>
                      <span className="px-4 py-1.5 rounded-full bg-white text-[#0071E3] font-bold text-xs shadow hover:bg-white/90 transition">
                        查看
                      </span>
                    </div>
                  </div>
                </Link>
              </div>
            )}

            {/* Right: Trending Games / Apps List (Image #1 style) */}
            <div className="lg:col-span-5 bg-[#F5F5F7] rounded-3xl p-6 border border-[#E5E5EA] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-xs font-bold text-[#86868B] uppercase tracking-wider">
                      时下热门
                    </span>
                    <h2 className="text-xl font-bold text-[#1D1D1F] tracking-tight">
                      好游戏 畅快玩
                    </h2>
                  </div>
                  <Link
                    href="/category/游戏"
                    className="text-xs font-semibold text-[#0071E3] hover:underline flex items-center gap-0.5"
                  >
                    查看全部 <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {/* List items */}
                <div className="divide-y divide-[#E5E5EA]">
                  {listApps.map((app: AppItem, index: number) => (
                    <div
                      key={app.id}
                      className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3 group"
                    >
                      <Link
                        href={`/app/${app.id}`}
                        className="flex items-center gap-3 flex-1 min-w-0"
                      >
                        <img
                          src={app.icon_url}
                          alt={app.name}
                          className="w-11 h-11 rounded-xl object-cover shadow-sm group-hover:scale-105 transition-transform"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-sm text-[#1D1D1F] truncate group-hover:text-[#0071E3] transition-colors">
                              {app.name}
                            </span>
                            {index === 0 && (
                              <span className="text-[10px] px-1 py-0.5 bg-[#FF9500]/15 text-[#FF9500] font-bold rounded">
                                灵宠降世
                              </span>
                            )}
                            {index === 1 && (
                              <span className="text-[10px] px-1 py-0.5 bg-[#34C759]/15 text-[#34C759] font-bold rounded">
                                重磅更新
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[#86868B] truncate mt-0.5">
                            {app.tagline || app.description.slice(0, 30)}
                          </p>
                        </div>
                      </Link>
                      <Link
                        href={`/app/${app.id}`}
                        className="px-3.5 py-1 rounded-full bg-[#E5E5EA] hover:bg-[#0071E3] hover:text-white text-[#0071E3] text-xs font-bold transition-all shrink-0"
                      >
                        查看
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Section: 今日活动进行时 (Image #1 style) */}
          <div className="space-y-4 pt-4">
            <div>
              <h2 className="text-2xl font-bold text-[#1D1D1F] tracking-tight">
                今日活动进行时
              </h2>
              <p className="text-sm text-[#86868B]">
                新鲜节目、电影、游戏和更多精彩
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {allApps.slice(0, 2).map((app: AppItem, index: number) => (
                <Link
                  key={app.id}
                  href={`/app/${app.id}`}
                  className="group relative h-80 rounded-3xl overflow-hidden border border-[#E5E5EA] shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-end p-6"
                >
                  <div
                    className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-700"
                    style={{
                      backgroundImage: `url(${app.cover_url})`,
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

                  <div className="relative z-10 space-y-2">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-white text-xs font-bold tracking-wide ${
                        index === 0 ? "bg-[#FF9500]" : "bg-[#AF52DE]"
                      }`}
                    >
                      {index === 0 ? "进行中" : "现已推出"}
                    </span>
                    <p className="text-xs font-bold text-white/80 uppercase tracking-wider">
                      官方收录 • Web App
                    </p>
                    <h3 className="text-xl font-extrabold text-white leading-tight">
                      {app.name}：{app.tagline}
                    </h3>
                    <p className="text-xs text-white/80 line-clamp-2">
                      {app.description.slice(0, 100)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
