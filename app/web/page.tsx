import { getAllApps } from "@/lib/db";
import { SearchCard } from "@/components/search-card";
import { Footer } from "@/components/footer";
import Link from "next/link";
import { Globe, PlusCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function WebPage() {
  const webApps = await getAllApps({ category: "web" });

  return (
    <div className="flex flex-col min-h-screen justify-between">
      <div className="p-8 w-full space-y-8 flex-1">
        {/* Web Header */}
        <div className="border-b border-border pb-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Globe className="w-6 h-6 text-foreground" />
              <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
                WEB
              </h1>
            </div>
            <p className="text-xs text-muted-foreground mt-1 font-medium">
              精选现代 Web 站点与在线工具 · 共收录 {webApps.length} 个
            </p>
          </div>

          <Link
            href="/recommend"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-black text-white text-xs font-semibold hover:bg-neutral-800 transition"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            推荐 Web 站点
          </Link>
        </div>

        {webApps.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {webApps.map((app) => (
              <SearchCard key={app.id} app={app} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-surface rounded-3xl border border-border space-y-3">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-neutral-100 flex items-center justify-center text-black">
              <Globe className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-foreground">暂无收录 WEB 应用</h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              当前尚未收录任何 WEB 类别应用，点击右上角推荐收录功能，立即收录优质 Web 站点！
            </p>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
