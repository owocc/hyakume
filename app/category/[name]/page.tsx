import { getAllApps, getCategoryById } from "@/lib/db";
import { SearchCard } from "@/components/search-card";
import { Footer } from "@/components/footer";
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
  const displayTitle = isAll
    ? "所有类别应用"
    : matchedCat
    ? `${matchedCat.name} 类应用`
    : `${decoded} 类应用`;

  const apps = await getAllApps({
    category: categoryParam,
  });

  return (
    <div className="flex flex-col min-h-screen justify-between">
      <div className="p-8 w-full space-y-8 flex-1">
        <div className="border-b border-border pb-4">
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
            &ldquo;{displayTitle}&rdquo;的结果
          </h1>
          <p className="text-xs text-muted-foreground mt-1 font-medium">
            共收录 {apps.length} 个应用
          </p>
        </div>

        {apps.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {apps.map((app) => (
              <SearchCard key={app.id} app={app} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-surface rounded-3xl border border-border space-y-3">
            <h3 className="text-base font-bold text-foreground">暂无该分类应用</h3>
            <p className="text-xs text-muted-foreground">你可以使用推荐收录功能添加属于此分类的应用。</p>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
