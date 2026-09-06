import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { getAllApps } from "@/lib/db";
import type { AppItem } from "@/lib/types";
import { Sparkles, PlusCircle } from "lucide-react";
import { HeroFeaturedCard } from "@/components/hero-featured-card";
import { formatLocalizedDate } from "@/lib/date";

export const dynamic = "force-dynamic";

export default async function GamesPage() {
  const [locale, t, tCommon, allGames, allApps] = await Promise.all([
    getLocale(),
    getTranslations("games"),
    getTranslations("common"),
    getAllApps({ category: "games" }),
    getAllApps(),
  ]);

  const appsPool = allGames.length > 0 ? allGames : allApps;

  const featuredGames = appsPool.filter((a: AppItem) => a.featured);
  const heroApp = featuredGames[0] || appsPool[0];
  const secondHeroApp = featuredGames[1] || appsPool[1] || heroApp;
  const thirdHeroApp = featuredGames[2] || appsPool[2] || heroApp;

  const popularGames = appsPool.slice(0, 5);
  const casualGames = appsPool.length > 5 ? appsPool.slice(5, 10) : appsPool.slice(0, 5);
  const immersiveGames = appsPool.length > 10 ? appsPool.slice(10, 15) : appsPool.slice(2, 7);

  const dateString = formatLocalizedDate(new Date(), locale);

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full space-y-8 sm:space-y-10 lg:space-y-12 bg-background text-foreground transition-colors duration-200">
        {/* Games Header */}
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
            {/* Row 1: Left Wide (Hero Banner), Right Narrow (热门游戏列表) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              {heroApp && (
                <div className="lg:col-span-7 flex flex-col">
                  <HeroFeaturedCard app={heroApp} tag={t("heroTag")} />
                </div>
              )}

              {/* Right Narrow: 热门游戏列表 (5 cols) */}
              <div className="lg:col-span-5 bg-card rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-border flex flex-col justify-between shadow-xs">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        {locale === "zh-cn" ? "热门精选" : "Top Featured"}
                      </span>
                      <h2 className="text-xl font-bold text-foreground tracking-tight">
                        {t("popularTitle")}
                      </h2>
                    </div>
                  </div>

                  <div className="divide-y divide-border">
                    {popularGames.map((app: AppItem, index: number) => (
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
                                  {locale === "zh-cn" ? "热门收录" : "Hot"}
                                </span>
                              )}
                              {index === 1 && (
                                <span className="text-[10px] px-1.5 py-0.5 bg-[#34C759]/15 text-[#34C759] font-bold rounded">
                                  {locale === "zh-cn" ? "极速畅玩" : "Instant"}
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

            {/* Row 2: Reversed! Left Narrow (休闲推荐列表), Right Wide (主打推荐大卡片) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              <div className="lg:col-span-5 bg-card rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-border flex flex-col justify-between order-2 lg:order-1 shadow-xs">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        {locale === "zh-cn" ? "休闲小憩" : "Casual"}
                      </span>
                      <h2 className="text-xl font-bold text-foreground tracking-tight">
                        {t("casualTitle")}
                      </h2>
                    </div>
                  </div>

                  <div className="divide-y divide-border">
                    {casualGames.map((app: AppItem, index: number) => (
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
                                  {locale === "zh-cn" ? "随开随玩" : "Quick Play"}
                                </span>
                              )}
                              {index === 1 && (
                                <span className="text-[10px] px-1.5 py-0.5 bg-[#AF52DE]/15 text-[#AF52DE] font-bold rounded">
                                  {locale === "zh-cn" ? "极高好评" : "Top Rated"}
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
                  <HeroFeaturedCard app={secondHeroApp} tag={locale === "zh-cn" ? "编辑精选 • 休闲解压" : "Editor's Choice • Casual"} />
                </div>
              )}
            </div>

            {/* Row 3: Left Wide (沉浸体验大卡片), Right Narrow (沉浸体验列表) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              {thirdHeroApp && (
                <div className="lg:col-span-7 flex flex-col">
                  <HeroFeaturedCard app={thirdHeroApp} tag={locale === "zh-cn" ? "深度探索 • 沉浸视界" : "Deep Exploration • Immersive"} />
                </div>
              )}

              <div className="lg:col-span-5 bg-card rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-border flex flex-col justify-between shadow-xs">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        {locale === "zh-cn" ? "精彩纷呈" : "Immersive"}
                      </span>
                      <h2 className="text-xl font-bold text-foreground tracking-tight">
                        {t("immersiveTitle")}
                      </h2>
                    </div>
                  </div>

                  <div className="divide-y divide-border">
                    {immersiveGames.map((app: AppItem, index: number) => (
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
                                  {locale === "zh-cn" ? "独具匠心" : "Masterpiece"}
                                </span>
                              )}
                              {index === 1 && (
                                <span className="text-[10px] px-1.5 py-0.5 bg-[#5856D6]/15 text-[#5856D6] font-bold rounded">
                                  {locale === "zh-cn" ? "玩法丰富" : "Engaging"}
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
