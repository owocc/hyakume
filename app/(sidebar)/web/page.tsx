import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { getAllApps } from "@/lib/db";
import type { AppItem } from "@/lib/types";
import { Sparkles, PlusCircle } from "lucide-react";
import { HeroFeaturedCard } from "@/components/hero-featured-card";
import { formatLocalizedDate } from "@/lib/date";

export const dynamic = "force-dynamic";

export default async function WebPage() {
  const [locale, t, tCommon, allWebApps, allApps] = await Promise.all([
    getLocale(),
    getTranslations("web"),
    getTranslations("common"),
    getAllApps({ category: "web" }),
    getAllApps(),
  ]);

  const appsPool = allWebApps.length > 0 ? allWebApps : allApps;

  const featuredWeb = appsPool.filter((a: AppItem) => a.featured);
  const heroApp = featuredWeb[0] || appsPool[0];
  const secondHeroApp = featuredWeb[1] || appsPool[1] || heroApp;
  const thirdHeroApp = featuredWeb[2] || appsPool[2] || heroApp;

  const popularWeb = appsPool.slice(0, 5);
  const modernTools = appsPool.length > 5 ? appsPool.slice(5, 10) : appsPool.slice(0, 5);
  const creativeWeb = appsPool.length > 10 ? appsPool.slice(10, 15) : appsPool.slice(2, 7);

  const dateString = formatLocalizedDate(new Date(), locale);

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full space-y-8 sm:space-y-10 lg:space-y-12 bg-background text-foreground transition-colors duration-200">
        {/* Web Header */}
        <div className="border-b border-border pb-4">
          <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            {dateString}
          </p>
          <div className="flex flex-wrap items-center justify-between gap-3 mt-1">
            <h1 className="text-2xl sm:text-4xl font-extrabold text-foreground tracking-tight">
              {t("title")}
            </h1>
            <Link
              href="/recommend"
              className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full bg-foreground text-background text-xs font-semibold hover:opacity-90 transition"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              {tCommon("submit")}
            </Link>
          </div>
        </div>

        {/* Empty State when no apps are in DB */}
        {appsPool.length === 0 ? (
          <div className="bg-card rounded-3xl p-10 md:p-14 border border-border text-center space-y-6 shadow-xs">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-secondary flex items-center justify-center text-foreground">
              <Sparkles className="w-8 h-8 animate-pulse" />
            </div>
            <div className="space-y-2 max-w-md mx-auto">
              <h3 className="text-xl font-bold text-foreground">{t("emptyTitle")}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t("emptyDesc")}
              </p>
            </div>
          </div>
        ) : (
        <div className="space-y-8 sm:space-y-10 lg:space-y-12">
            {/* Row 1: Left Wide (Hero Banner), Right Narrow (热门 Web 列表) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              {heroApp && (
                <div className="lg:col-span-7 flex flex-col">
                  <HeroFeaturedCard app={heroApp} tag={locale === "zh-cn" ? "时下热门 • 精选 Web 平台" : "Trending Now • Curated Web App"} />
                </div>
              )}

              {/* Right Narrow: 热门 Web 列表 (5 cols) */}
              <div className="lg:col-span-5 bg-card rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-border flex flex-col justify-between shadow-xs">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        {locale === "zh-cn" ? "精选收录" : "Featured"}
                      </span>
                      <h2 className="text-xl font-bold text-foreground tracking-tight">
                        {locale === "zh-cn" ? "发现优质站点" : "Discover Quality Sites"}
                      </h2>
                    </div>
                  </div>

                  <div className="divide-y divide-border">
                    {popularWeb.map((app: AppItem, index: number) => (
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
                            className="w-11 h-11 rounded-xl object-cover shadow-2xs group-hover:scale-105 transition-transform shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                                {app.name}
                              </span>
                              {index === 0 && (
                                <span className="text-[10px] px-1.5 py-0.5 bg-[#FF9500]/15 text-[#FF9500] font-bold rounded">
                                  {locale === "zh-cn" ? "热门推荐" : "Hot"}
                                </span>
                              )}
                              {index === 1 && (
                                <span className="text-[10px] px-1.5 py-0.5 bg-[#34C759]/15 text-[#34C759] font-bold rounded">
                                  {locale === "zh-cn" ? "体验极佳" : "Great UX"}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                              {app.tagline || app.description.slice(0, 30)}
                            </p>
                          </div>
                        </Link>
                        <Link
                          href={`/app/${app.id}`}
                          className="px-3.5 py-1 rounded-full bg-secondary hover:bg-primary hover:text-primary-foreground text-foreground border border-border text-xs font-bold transition-all shrink-0"
                        >
                          {tCommon("view")}
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Row 2: Reversed! Left Narrow (在线工具列表), Right Wide (主打推荐大卡片) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              <div className="lg:col-span-5 bg-card rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-border flex flex-col justify-between order-2 lg:order-1 shadow-xs">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        {locale === "zh-cn" ? "高效在线" : "Online Tools"}
                      </span>
                      <h2 className="text-xl font-bold text-foreground tracking-tight">
                        {locale === "zh-cn" ? "即用型 Web 工具" : "Ready-to-use Tools"}
                      </h2>
                    </div>
                  </div>

                  <div className="divide-y divide-border">
                    {modernTools.map((app: AppItem, index: number) => (
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
                            className="w-11 h-11 rounded-xl object-cover shadow-2xs group-hover:scale-105 transition-transform shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                                {app.name}
                              </span>
                              {index === 0 && (
                                <span className="text-[10px] px-1.5 py-0.5 bg-[#007AFF]/15 text-[#007AFF] font-bold rounded">
                                  {locale === "zh-cn" ? "无需安装" : "No Install"}
                                </span>
                              )}
                              {index === 1 && (
                                <span className="text-[10px] px-1.5 py-0.5 bg-[#AF52DE]/15 text-[#AF52DE] font-bold rounded">
                                  {locale === "zh-cn" ? "轻量便捷" : "Lightweight"}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                              {app.tagline || app.description.slice(0, 30)}
                            </p>
                          </div>
                        </Link>
                        <Link
                          href={`/app/${app.id}`}
                          className="px-3.5 py-1 rounded-full bg-secondary hover:bg-primary hover:text-primary-foreground text-foreground border border-border text-xs font-bold transition-all shrink-0"
                        >
                          {tCommon("view")}
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {secondHeroApp && (
                <div className="lg:col-span-7 flex flex-col order-1 lg:order-2">
                  <HeroFeaturedCard app={secondHeroApp} tag={locale === "zh-cn" ? "强力驱动 • 现代 Web 原生" : "Powered • Modern Web Native"} />
                </div>
              )}
            </div>

            {/* Row 3: Left Wide (创意大卡片), Right Narrow (创意列表) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              {thirdHeroApp && (
                <div className="lg:col-span-7 flex flex-col">
                  <HeroFeaturedCard app={thirdHeroApp} tag={locale === "zh-cn" ? "灵感启发 • 创意前沿" : "Inspiration • Creative Front"} />
                </div>
              )}

              <div className="lg:col-span-5 bg-card rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-border flex flex-col justify-between shadow-xs">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        {locale === "zh-cn" ? "设计与灵感" : "Design & Inspiration"}
                      </span>
                      <h2 className="text-xl font-bold text-foreground tracking-tight">
                        {locale === "zh-cn" ? "创意无限视界" : "Creative Frontiers"}
                      </h2>
                    </div>
                  </div>

                  <div className="divide-y divide-border">
                    {creativeWeb.map((app: AppItem, index: number) => (
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
                            className="w-11 h-11 rounded-xl object-cover shadow-2xs group-hover:scale-105 transition-transform shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                                {app.name}
                              </span>
                              {index === 0 && (
                                <span className="text-[10px] px-1.5 py-0.5 bg-[#FF2D55]/15 text-[#FF2D55] font-bold rounded">
                                  {locale === "zh-cn" ? "视觉惊艳" : "Stunning"}
                                </span>
                              )}
                              {index === 1 && (
                                <span className="text-[10px] px-1.5 py-0.5 bg-[#5856D6]/15 text-[#5856D6] font-bold rounded">
                                  {locale === "zh-cn" ? "跨端响应" : "Responsive"}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                              {app.tagline || app.description.slice(0, 30)}
                            </p>
                          </div>
                        </Link>
                        <Link
                          href={`/app/${app.id}`}
                          className="px-3.5 py-1 rounded-full bg-secondary hover:bg-primary hover:text-primary-foreground text-foreground border border-border text-xs font-bold transition-all shrink-0"
                        >
                          {tCommon("view")}
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
