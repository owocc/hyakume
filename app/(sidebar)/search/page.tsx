import { getTranslations } from "next-intl/server";
import { searchApps } from "@/lib/db";
import { SearchCard } from "@/components/search-card";
import Link from "next/link";
import { Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: Props) {
  const [{ q }, t] = await Promise.all([
    searchParams,
    getTranslations("searchPage"),
  ]);

  const query = (q || "App").trim();
  const apps = await searchApps(query);

  return (
    <div className="p-8 w-full space-y-8">
      {/* Search Header matching Image #6 */}
      <div className="border-b border-border pb-4">
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
          {t("resultsFor", { query })}
        </h1>
        <p className="text-xs text-muted-foreground mt-1 font-medium">
          {t("foundCount", { count: apps.length })}
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
        <div className="text-center py-20 space-y-4 bg-surface rounded-3xl border border-border">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-foreground flex items-center justify-center shadow-sm">
            <Sparkles className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-foreground">{t("noResults")}</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            {t("noResultsDesc", { query })}
          </p>
          <Link
            href="/recommend"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-primary hover:bg-primary-hover text-primary-foreground font-bold text-xs shadow-md transition"
          >
            <Sparkles className="w-4 h-4" />
            <span>{t("autoSubmit")}</span>
          </Link>
        </div>
      )}
    </div>
  );
}
