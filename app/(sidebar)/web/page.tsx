import Link from "next/link";
import { getAllApps } from "@/lib/db";
import type { AppItem } from "@/lib/types";
import { Sparkles, PlusCircle } from "lucide-react";
import { HeroFeaturedCard } from "@/components/hero-featured-card";

export const dynamic = "force-dynamic";

export default async function WebPage() {
  const [allWebApps, allApps] = await Promise.all([
    getAllApps({ category: "web" }),
    getAllApps(),
  ]);

  const appsPool = allWebApps.length > 0 ? allWebApps : allApps;

  const featuredApps = appsPool.filter((a: AppItem) => a.featured);
  const heroApp = featuredApps[0] || appsPool[0];
  const secondHeroApp = featuredApps[1] || appsPool[1] || heroApp;
  const thirdHeroApp = featuredApps[2] || appsPool[2] || heroApp;

  const popularWeb = appsPool.slice(0, 5);
  const toolWeb = appsPool.length > 5 ? appsPool.slice(5, 10) : appsPool.slice(0, 5);
  const creativeWeb = appsPool.length > 10 ? appsPool.slice(10, 15) : appsPool.slice(2, 7);

  const now = new Date();
  const month = now.getMonth() + 1;
  const date = now.getDate();
  const dayNames = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
  const dayName = dayNames[now.getDay()];
  const dateString = `${month}月${date}日 ${dayName}`;

  return (
    <div className="p-8 w-full space-y-12 bg-background text-foreground transition-colors duration-200">
        {/* Web Header */}
        <div className="border-b border-border pb-4">
          <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            {dateString}
          </p>
          <div className="flex items-center justify-between mt-1">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
              WEB
            </h1>
            <Link
              href="/recommend"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-foreground text-background text-xs font-semibold hover:opacity-90 transition"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              推荐收录
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
              <h3 className="text-xl font-bold text-foreground">暂无收录 WEB 应用</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                当前尚未收录任何 WEB 类别应用，点击右上角推荐收录功能，立即收录优质 Web 站点！
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Row 1: Left Wide (Hero Banner), Right Narrow (热门 Web 列表) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              {heroApp && (
                <div className="lg:col-span-7 flex flex-col">
                  <HeroFeaturedCard app={heroApp} tag="时下热门 • 精选 Web 平台" />
                </div>
              )}

              {/* Right Narrow: 热门 Web 列表 (5 cols) */}
              <div className="lg:col-span-5 bg-card rounded-3xl p-6 border border-border flex flex-col justify-between shadow-xs">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        平台精选
                      </span>
                      <h2 className="text-xl font-bold text-foreground tracking-tight">
                        精选 Web 站点
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
                                  热门收录
                                </span>
                              )}
                              {index === 1 && (
                                <span className="text-[10px] px-1.5 py-0.5 bg-[#34C759]/15 text-[#34C759] font-bold rounded">
                                  极速体验
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
                          查看
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Row 2: Reversed! Left Narrow (效率工具列表), Right Wide (主打推荐大卡片) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              <div className="lg:col-span-5 bg-card rounded-3xl p-6 border border-border flex flex-col justify-between order-2 lg:order-1 shadow-xs">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        效率必备
                      </span>
                      <h2 className="text-xl font-bold text-foreground tracking-tight">
                        云端数字化工具
                      </h2>
                    </div>
                  </div>

                  <div className="divide-y divide-border">
                    {toolWeb.map((app: AppItem, index: number) => (
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
                                  工作流核心
                                </span>
                              )}
                              {index === 1 && (
                                <span className="text-[10px] px-1.5 py-0.5 bg-[#AF52DE]/15 text-[#AF52DE] font-bold rounded">
                                  深度推荐
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
                          查看
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {secondHeroApp && (
                <div className="lg:col-span-7 flex flex-col order-1 lg:order-2">
                  <HeroFeaturedCard app={secondHeroApp} tag="前沿设计 • 体验突破" />
                </div>
              )}
            </div>

            {/* Row 3: Left Wide (开发者生态大卡片), Right Narrow (创意展示列表) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              {thirdHeroApp && (
                <div className="lg:col-span-7 flex flex-col">
                  <HeroFeaturedCard app={thirdHeroApp} tag="开发者生态 • 现代化站点" />
                </div>
              )}

              <div className="lg:col-span-5 bg-card rounded-3xl p-6 border border-border flex flex-col justify-between shadow-xs">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        创意灵感
                      </span>
                      <h2 className="text-xl font-bold text-foreground tracking-tight">
                        精选口碑应用
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
                                  热度飞升
                                </span>
                              )}
                              {index === 1 && (
                                <span className="text-[10px] px-1.5 py-0.5 bg-[#5856D6]/15 text-[#5856D6] font-bold rounded">
                                  极佳创意
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
                          查看
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
