import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { getAllApps } from "@/lib/db";
import type { AppItem } from "@/lib/types";
import { ChevronRight, Sparkles, PlusCircle } from "lucide-react";
import { HeroFeaturedCard } from "@/components/hero-featured-card";
import { formatLocalizedDate } from "@/lib/date";

export const dynamic = "force-dynamic";

export default async function AppsPage() {
  const [locale, t, tCommon, allApps, webApps, toolApps, aiApps] = await Promise.all([
    getLocale(),
    getTranslations("apps"),
    getTranslations("common"),
    getAllApps(),
    getAllApps({ category: "web" }),
    getAllApps({ category: "tools" }),
    getAllApps({ category: "ai" }),
  ]);

  const featuredApps = allApps.filter((a: AppItem) => a.featured);
  const heroApp = featuredApps[0] || allApps[0];
  const secondHeroApp = featuredApps[1] || allApps[1] || heroApp;
  const thirdHeroApp = featuredApps[2] || allApps[2] || heroApp;

  // List 1: First list displays Web category
  const webListApps = webApps.length > 0 ? webApps.slice(0, 5) : allApps.slice(0, 5);
  // List 2: Tools category
  const toolListApps = toolApps.length > 0 ? toolApps.slice(0, 5) : allApps.slice(2, 7);
  // List 3: AI category
  const aiListApps = aiApps.length > 0 ? aiApps.slice(0, 5) : allApps.slice(4, 9);

  const dateString = formatLocalizedDate(new Date(), locale);

  return (
    <div className="p-8 w-full space-y-12 bg-background text-foreground transition-colors duration-200">
      {/* Apps Header */}
      <div className="border-b border-border pb-4">
        <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          {dateString}
        </p>
        <div className="flex items-center justify-between mt-1">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            {t("title")}
          </h1>
          <Link
            href="/recommend"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-foreground text-background text-xs font-semibold hover:opacity-90 transition"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            {tCommon("submit")}
          </Link>
        </div>
      </div>

      {/* Empty State when no apps are in DB */}
      {allApps.length === 0 ? (
        <div className="bg-card rounded-3xl p-10 md:p-14 border border-border text-center space-y-6 shadow-xs">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-secondary flex items-center justify-center text-foreground">
            <Sparkles className="w-8 h-8 animate-pulse" />
          </div>
          <div className="space-y-2 max-w-lg mx-auto">
            <h2 className="text-2xl font-extrabold text-foreground">
              {t("emptyTitle")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t("emptyDesc")}
            </p>
          </div>
          <Link
            href="/recommend"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-hover active:scale-[0.98] transition-all shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t("recommendFirst")}</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-12">
          {/* Row 1: Left Wide (Hero Banner), Right Narrow (Web 分类列表) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Left Wide: Hero Feature Card (7 cols) */}
            {heroApp && (
              <div className="lg:col-span-7 flex flex-col">
                <HeroFeaturedCard app={heroApp} tag={t("heroTag1")} />
              </div>
            )}

            {/* Right Narrow: Web 分类列表 (5 cols) */}
            <div className="lg:col-span-5 bg-card rounded-3xl p-6 border border-border flex flex-col justify-between shadow-xs">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      {t("webCategory")}
                    </span>
                    <h2 className="text-xl font-bold text-foreground tracking-tight">
                      {t("webTitle")}
                    </h2>
                  </div>
                  <Link
                    href="/web"
                    className="text-xs font-semibold text-foreground hover:underline flex items-center gap-0.5"
                  >
                    {tCommon("viewAll")} <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="divide-y divide-border">
                  {webListApps.map((app: AppItem, index: number) => (
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
                                {t("badgeHot")}
                              </span>
                            )}
                            {index === 1 && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-[#34C759]/15 text-[#34C759] font-bold rounded">
                                {t("badgeSpeed")}
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

          {/* Row 2: Reversed! Left Narrow (工具 分类列表), Right Wide (主打推荐大卡片) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Left Narrow: 工具 分类列表 (5 cols) */}
            <div className="lg:col-span-5 bg-card rounded-3xl p-6 border border-border flex flex-col justify-between order-2 lg:order-1 shadow-xs">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      {t("toolsCategory")}
                    </span>
                    <h2 className="text-xl font-bold text-foreground tracking-tight">
                      {t("toolsTitle")}
                    </h2>
                  </div>
                  <Link
                    href="/category/tools"
                    className="text-xs font-semibold text-foreground hover:underline flex items-center gap-0.5"
                  >
                    {tCommon("viewAll")} <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="divide-y divide-border">
                  {toolListApps.map((app: AppItem, index: number) => (
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
                                {t("badgeWorkflow")}
                              </span>
                            )}
                            {index === 1 && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-[#AF52DE]/15 text-[#AF52DE] font-bold rounded">
                                {t("badgePraise")}
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

            {/* Right Wide: Featured Spotlight Card (7 cols) */}
            {secondHeroApp && (
              <div className="lg:col-span-7 flex flex-col order-1 lg:order-2">
                <HeroFeaturedCard app={secondHeroApp} tag={t("heroTag2")} />
              </div>
            )}
          </div>

          {/* Row 3: Left Wide (AI 专区大卡片), Right Narrow (AI 分类列表) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Left Wide: AI / Spotlight Card (7 cols) */}
            {thirdHeroApp && (
              <div className="lg:col-span-7 flex flex-col">
                <HeroFeaturedCard app={thirdHeroApp} tag={t("heroTag3")} />
              </div>
            )}

            {/* Right Narrow: AI 分类列表 (5 cols) */}
            <div className="lg:col-span-5 bg-card rounded-3xl p-6 border border-border flex flex-col justify-between shadow-xs">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      {t("aiCategory")}
                    </span>
                    <h2 className="text-xl font-bold text-foreground tracking-tight">
                      {t("aiTitle")}
                    </h2>
                  </div>
                  <Link
                    href="/category/ai"
                    className="text-xs font-semibold text-foreground hover:underline flex items-center gap-0.5"
                  >
                    {tCommon("viewAll")} <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="divide-y divide-border">
                  {aiListApps.map((app: AppItem, index: number) => (
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
                                {t("badgeGenerate")}
                              </span>
                            )}
                            {index === 1 && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-[#5856D6]/15 text-[#5856D6] font-bold rounded">
                                {t("badgeAlgorithm")}
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
