import { getAllApps } from "@/lib/db";
import { SearchCard } from "@/components/search-card";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ name: string }>;
}

export default async function CategoryPage({ params }: Props) {
  const { name } = await params;
  const decoded = decodeURIComponent(name);
  const isAll = decoded === "all" || decoded === "类别";

  const apps = await getAllApps({
    category: isAll ? undefined : decoded,
  });

  const displayTitle = isAll ? "所有类别应用" : `${decoded} 类应用`;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="border-b border-[#E5E5EA] pb-4">
        <h1 className="text-3xl font-extrabold text-[#1D1D1F] tracking-tight">
          &ldquo;{displayTitle}&rdquo;的结果
        </h1>
        <p className="text-xs text-[#86868B] mt-1 font-medium">
          共收录 {apps.length} 个应用
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {apps.map((app) => (
          <SearchCard key={app.id} app={app} />
        ))}
      </div>
    </div>
  );
}
