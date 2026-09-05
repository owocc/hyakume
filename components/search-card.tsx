import Link from "next/link";
import type { AppItem } from "@/lib/types";

interface Props {
  app: AppItem;
}

export function SearchCard({ app }: Props) {
  // Use however many screenshots exist without minimum count restriction
  const screenshots =
    app.screenshots && app.screenshots.length > 0
      ? app.screenshots
      : app.cover_url
      ? [app.cover_url]
      : [];

  const gridColsClass =
    screenshots.length === 1
      ? "grid-cols-1"
      : screenshots.length === 2
      ? "grid-cols-2"
      : screenshots.length === 3
      ? "grid-cols-3"
      : "grid-cols-2 sm:grid-cols-4";

  return (
    <div className="bg-card rounded-3xl p-5 border border-border hover:border-neutral-400/70 transition-colors flex flex-col justify-between group shadow-xs">
      {/* Top Row: Icon, Title, Rating, 查看 Button (Flat, no heavy shadows) */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <Link href={`/app/${app.id}`} className="flex items-center gap-3 min-w-0">
          <img
            src={app.icon_url}
            alt={app.name}
            className="w-12 h-12 rounded-xl object-cover group-hover:scale-105 transition-transform shrink-0"
          />
          <div className="min-w-0">
            <h3 className="font-bold text-sm text-foreground truncate group-hover:text-primary transition-colors">
              {app.name}
            </h3>
            <div className="flex flex-wrap gap-1 mt-0.5">
              {(app.categories || [app.category || "WEB"]).map((cat) => (
                <span
                  key={cat}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground font-medium border border-border/60"
                >
                  {cat}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
              <span className="text-[#FF9500]">
                {"★".repeat(Math.min(5, Math.floor(app.rating)))}
                {"☆".repeat(Math.max(0, 5 - Math.floor(app.rating)))}
              </span>
              <span>{app.rating_count}</span>
            </div>
          </div>
        </Link>

        <Link
          href={`/app/${app.id}`}
          className="px-4 py-1 rounded-full bg-secondary hover:bg-primary hover:text-primary-foreground text-foreground border border-border text-xs font-bold transition-all shrink-0"
        >
          查看
        </Link>
      </div>

      {/* Bottom Showcase: Displays however many screenshots exist without top text */}
      {screenshots.length > 0 && (
        <Link
          href={`/app/${app.id}`}
          className={`grid ${gridColsClass} gap-2 bg-surface p-2.5 rounded-2xl border border-border/60 overflow-hidden`}
        >
          {screenshots.map((imgUrl, i) => (
            <div
              key={i}
              className="bg-card rounded-xl overflow-hidden border border-border/80 flex flex-col h-44 relative group/img"
            >
              <div className="flex-1 overflow-hidden relative bg-muted">
                <img
                  src={imgUrl}
                  alt={`${app.name} preview ${i + 1}`}
                  className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300"
                />
              </div>
            </div>
          ))}
        </Link>
      )}
    </div>
  );
}
