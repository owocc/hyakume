import Link from "next/link";
import type { AppItem } from "@/lib/types";

interface Props {
  app: AppItem;
}

export function SearchCard({ app }: Props) {
  const previews =
    app.preview_features && app.preview_features.length >= 3
      ? app.preview_features
      : ["智能分析", "即时协作", "云端同步"];

  const screenshots =
    app.screenshots && app.screenshots.length >= 3
      ? app.screenshots
      : [
          app.cover_url,
          app.icon_url,
          app.seo_image || app.cover_url,
        ];

  return (
    <div className="bg-card rounded-3xl p-5 border border-border shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between group">
      {/* Top Row: Icon, Title, Rating, 查看 Button */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <Link href={`/app/${app.id}`} className="flex items-center gap-3 min-w-0">
          <img
            src={app.icon_url}
            alt={app.name}
            className="w-12 h-12 rounded-xl object-cover shadow-sm group-hover:scale-105 transition-transform shrink-0"
          />
          <div className="min-w-0">
            <h3 className="font-bold text-sm text-foreground truncate group-hover:text-black transition-colors">
              {app.name}
            </h3>
            <div className="flex flex-wrap gap-1 mt-0.5">
              {(app.categories || [app.category || "WEB"]).map((cat) => (
                <span
                  key={cat}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-800 font-medium"
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
          className="px-4 py-1 rounded-full bg-border-subtle hover:bg-black hover:text-white text-black text-xs font-bold transition-all shrink-0 shadow-sm"
        >
          查看
        </Link>
      </div>

      {/* Bottom Showcase: 3 Phone Mockups side-by-side (Image #6) */}
      <Link
        href={`/app/${app.id}`}
        className="grid grid-cols-3 gap-2 bg-surface p-2.5 rounded-2xl border border-border/60 overflow-hidden"
      >
        {previews.slice(0, 3).map((featureTitle, i) => (
          <div
            key={i}
            className="bg-card rounded-xl overflow-hidden border border-border flex flex-col h-44 shadow-xs"
          >
            {/* Phone Top Notch / Title Bar */}
            <div className="bg-surface px-1 py-1 text-center border-b border-border">
              <span className="text-[10px] font-bold text-foreground truncate block">
                {featureTitle}
              </span>
            </div>

            {/* Screen Image Preview */}
            <div className="flex-1 overflow-hidden relative group/img bg-gray-50">
              <img
                src={screenshots[i] || app.cover_url}
                alt={featureTitle}
                className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300"
              />
            </div>
          </div>
        ))}
      </Link>
    </div>
  );
}
