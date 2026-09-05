import Link from "next/link";
import { getAllApps, getCategoryById } from "@/lib/db";
import type { AppItem } from "@/lib/types";
import { Footer } from "@/components/footer";
import { ChevronRight, PlusCircle } from "lucide-react";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ name: string }>;
}

export default async function CategoryPage({ params }: Props) {
  const { name } = await params;
  const decoded = decodeURIComponent(name).trim();

  // Redirect fixed builtin categories to their dedicated top-level routes
  const lower = decoded.toLowerCase();
  if (lower === "games" || lower === "游戏") {
    redirect("/games");
  }
  if (lower === "web") {
    redirect("/web");
  }
  if (lower === "apps" || lower === "app") {
    redirect("/apps");
  }

  const isAll = lower === "all" || lower === "类别" || lower === "全部";
  const matchedCat = !isAll ? await getCategoryById(decoded) : null;
  const categoryParam = isAll ? undefined : matchedCat ? matchedCat.id : decoded;

  // Clean display category title (e.g. "娱乐", "工具", "AI", "全部")
  const categoryTitle = isAll
    ? "全部"
    : matchedCat
    ? matchedCat.name
    : decoded;

  const apps = await getAllApps({
    category: categoryParam,
  });

  // Section 1: 精选 App (up to 8 items in 4x2 grid)
  const featuredSlice = apps.slice(0, 8);

  // Section 2: 免费排行 (up to 5 items in 5-col row)
  const freeRankSlice =
    apps.length >= 13
      ? apps.slice(8, 13)
      : apps.length > 5
      ? apps.slice(0, 5)
      : apps;

  // Section 3: 付费排行 (up to 5 items in 5-col row)
  const paidRankSlice =
    apps.length >= 18
      ? apps.slice(13, 18)
      : apps.length >= 10
      ? apps.slice(5, 10)
      : apps;

  return (
    <div className="flex flex-col min-h-screen justify-between bg-white">
      <div className="p-6 sm:p-8 md:p-10 w-full space-y-10 flex-1 max-w-[1440px] mx-auto">
        {/* Top Header: Category Name */}
        <div className="border-b border-border/70 pb-5 flex items-center justify-between">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#111827] tracking-tight">
            {categoryTitle}
          </h1>

          <Link
            href="/recommend"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-black text-white text-xs font-semibold hover:bg-neutral-800 transition"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            推荐收录
          </Link>
        </div>

        {apps.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-3xl border border-border/80 shadow-sm space-y-3">
            <h3 className="text-lg font-bold text-[#111827]">暂无该分类收录</h3>
            <p className="text-xs text-neutral-400 max-w-sm mx-auto">
              当前尚未收录属于【{categoryTitle}】的应用。点击右上角“推荐收录”，立即提交优质 Web App！
            </p>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Section 1: 精选{categoryTitle} App > (4 cols x 2 rows = 8 items) */}
            <section className="space-y-4">
              <div className="flex items-center gap-1">
                <h2 className="text-lg sm:text-xl font-bold text-[#111827] tracking-tight">
                  精选{categoryTitle} App
                </h2>
                <ChevronRight className="w-4 h-4 text-neutral-400 stroke-[2.5]" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-3.5">
                {featuredSlice.map((app: AppItem) => (
                  <div
                    key={app.id}
                    className="flex items-center justify-between gap-3 p-2 rounded-2xl hover:bg-white/80 transition-colors group"
                  >
                    <Link
                      href={`/app/${app.id}`}
                      className="flex items-center gap-3 min-w-0 flex-1"
                    >
                      <img
                        src={app.icon_url}
                        alt={app.name}
                        className="w-13 h-13 rounded-[16px] object-cover shadow-2xs group-hover:scale-105 transition-transform shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <h3 className="text-xs sm:text-sm font-semibold text-[#111827] truncate leading-tight group-hover:text-blue-600 transition-colors">
                          {app.name}
                        </h3>
                        <p className="text-[11px] sm:text-xs text-neutral-400 truncate mt-1">
                          {app.tagline || app.description.slice(0, 30)}
                        </p>
                      </div>
                    </Link>

                    <Link
                      href={`/app/${app.id}`}
                      className="px-3.5 py-1 rounded-full bg-[#f2f4f8] hover:bg-blue-50 text-blue-600 text-xs font-semibold shrink-0 transition-colors"
                    >
                      查看
                    </Link>
                  </div>
                ))}
              </div>
            </section>

            {/* Section 2: 免费排行 > (5 columns) */}
            <section className="space-y-4">
              <div className="flex items-center gap-1">
                <h2 className="text-lg sm:text-xl font-bold text-[#111827] tracking-tight">
                  免费排行
                </h2>
                <ChevronRight className="w-4 h-4 text-neutral-400 stroke-[2.5]" />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 sm:gap-5">
                {freeRankSlice.map((app: AppItem, index: number) => (
                  <div
                    key={`free-${app.id}-${index}`}
                    className="bg-white rounded-[24px] border border-neutral-100 shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.06)] p-5 flex flex-col justify-between items-center text-center transition-all relative min-h-[230px] group"
                  >
                    {/* Rank Number top-left */}
                    <span className="absolute top-3.5 left-4 text-sm font-medium text-neutral-400">
                      {index + 1}
                    </span>

                    {/* Icon, Title & Tagline */}
                    <Link
                      href={`/app/${app.id}`}
                      className="flex flex-col items-center w-full flex-1 justify-center mt-1"
                    >
                      <img
                        src={app.icon_url}
                        alt={app.name}
                        className="w-18 h-18 sm:w-20 sm:h-20 rounded-[22px] object-cover shadow-sm group-hover:scale-105 transition-transform mb-3"
                      />
                      <h4 className="text-xs sm:text-sm font-bold text-[#111827] line-clamp-1 w-full px-1 group-hover:text-blue-600 transition-colors">
                        {app.name}
                      </h4>
                      <p className="text-[11px] sm:text-xs text-neutral-400 line-clamp-1 mt-1 w-full px-1">
                        {app.tagline || app.description.slice(0, 30)}
                      </p>
                    </Link>

                    {/* Bottom Action */}
                    <Link
                      href={`/app/${app.id}`}
                      className="mt-3 px-5 py-1 rounded-full bg-[#f2f4f8] hover:bg-blue-50 text-blue-600 text-xs font-semibold transition-colors"
                    >
                      查看
                    </Link>
                  </div>
                ))}
              </div>
            </section>

            {/* Section 3: 付费排行 > (5 columns) */}
            <section className="space-y-4">
              <div className="flex items-center gap-1">
                <h2 className="text-lg sm:text-xl font-bold text-[#111827] tracking-tight">
                  付费排行
                </h2>
                <ChevronRight className="w-4 h-4 text-neutral-400 stroke-[2.5]" />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 sm:gap-5">
                {paidRankSlice.map((app: AppItem, index: number) => (
                  <div
                    key={`paid-${app.id}-${index}`}
                    className="bg-white rounded-[24px] border border-neutral-100 shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.06)] p-5 flex flex-col justify-between items-center text-center transition-all relative min-h-[230px] group"
                  >
                    {/* Rank Number top-left */}
                    <span className="absolute top-3.5 left-4 text-sm font-medium text-neutral-400">
                      {index + 1}
                    </span>

                    {/* Icon, Title & Tagline */}
                    <Link
                      href={`/app/${app.id}`}
                      className="flex flex-col items-center w-full flex-1 justify-center mt-1"
                    >
                      <img
                        src={app.icon_url}
                        alt={app.name}
                        className="w-18 h-18 sm:w-20 sm:h-20 rounded-[22px] object-cover shadow-sm group-hover:scale-105 transition-transform mb-3"
                      />
                      <h4 className="text-xs sm:text-sm font-bold text-[#111827] line-clamp-1 w-full px-1 group-hover:text-blue-600 transition-colors">
                        {app.name}
                      </h4>
                      <p className="text-[11px] sm:text-xs text-neutral-400 line-clamp-1 mt-1 w-full px-1">
                        {app.tagline || app.description.slice(0, 30)}
                      </p>
                    </Link>

                    {/* Bottom Action */}
                    <Link
                      href={`/app/${app.id}`}
                      className="mt-3 px-5 py-1 rounded-full bg-[#f2f4f8] hover:bg-blue-50 text-blue-600 text-xs font-semibold transition-colors"
                    >
                      查看
                    </Link>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
