import { getAllApps } from "@/lib/db";
import { SearchCard } from "@/components/search-card";
import { Footer } from "@/components/footer";
import Link from "next/link";
import { Gamepad2, PlusCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function GamesPage() {
  const games = await getAllApps({ category: "games" });

  return (
    <div className="flex flex-col min-h-screen justify-between">
      <div className="p-8 w-full space-y-8 flex-1">
        {/* Games Header */}
        <div className="border-b border-border pb-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Gamepad2 className="w-6 h-6 text-foreground" />
              <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
                游戏
              </h1>
            </div>
            <p className="text-xs text-muted-foreground mt-1 font-medium">
              发现时下热门与精选 Web 游戏 · 共收录 {games.length} 款
            </p>
          </div>

          <Link
            href="/recommend"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-black text-white text-xs font-semibold hover:bg-neutral-800 transition"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            推荐游戏
          </Link>
        </div>

        {games.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {games.map((app) => (
              <SearchCard key={app.id} app={app} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-surface rounded-3xl border border-border space-y-3">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-neutral-100 flex items-center justify-center text-black">
              <Gamepad2 className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-foreground">暂无收录游戏</h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              当前尚未收录任何游戏，点击右上角推荐收录功能，立即收录你喜爱的 Web 游戏！
            </p>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
