import { searchApps } from "@/lib/db";
import { SearchCard } from "@/components/search-card";
import Link from "next/link";
import { Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const query = (q || "App").trim();
  const apps = await searchApps(query);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Search Header matching Image #6 */}
      <div className="border-b border-[#E5E5EA] pb-4">
        <h1 className="text-3xl font-extrabold text-[#1D1D1F] tracking-tight">
          &ldquo;{query}&rdquo;的搜索结果
        </h1>
        <p className="text-xs text-[#86868B] mt-1 font-medium">
          找到 {apps.length} 个相关应用与工具
        </p>
      </div>

      {/* 3-Column Grid matching Image #6 */}
      {apps.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {apps.map((app) => (
            <SearchCard key={app.id} app={app} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 space-y-4 bg-[#F5F5F7] rounded-3xl border border-[#E5E5EA]">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-blue-50 text-[#0071E3] flex items-center justify-center shadow-sm">
            <Sparkles className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-[#1D1D1F]">未找到相关应用</h2>
          <p className="text-sm text-[#86868B] max-w-md mx-auto">
            没有找到与 &ldquo;{query}&rdquo; 匹配的应用。你可以使用 AI 一键推荐工具收录它！
          </p>
          <Link
            href="/recommend"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#0071E3] hover:bg-[#0077ED] text-white font-bold text-xs shadow-md transition"
          >
            <Sparkles className="w-4 h-4" />
            <span>AI 一键自动化收录</span>
          </Link>
        </div>
      )}
    </div>
  );
}
