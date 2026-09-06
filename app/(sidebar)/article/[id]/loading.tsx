import { Skeleton } from "@/components/skeleton";

export default function ArticleDetailLoading() {
  return (
    <div className="w-full min-h-screen bg-background text-foreground transition-colors duration-200">
      {/* Top Breadcrumbs & Back Navigation Skeleton */}
      <div className="border-b border-border bg-card/40 backdrop-blur-xs sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-16 rounded" />
            <Skeleton className="h-3 w-3 rounded-full" />
            <Skeleton className="h-4 w-24 rounded" />
            <Skeleton className="h-3 w-3 rounded-full" />
            <Skeleton className="h-4 w-16 rounded" />
          </div>
          <Skeleton className="h-7 w-28 rounded-full" />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8 sm:space-y-10">
        {/* Header Hero Skeleton */}
        <div className="space-y-4 sm:space-y-5 border-b border-border pb-8">
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-32 rounded-full" />
            <Skeleton className="h-6 w-28 rounded-full" />
          </div>

          <div className="space-y-2.5">
            <Skeleton className="h-9 sm:h-10 w-full sm:w-11/12 rounded-xl" />
            <Skeleton className="h-9 sm:h-10 w-3/4 rounded-xl" />
          </div>

          <div className="flex items-center gap-4 pt-1">
            <Skeleton className="h-4 w-28 rounded" />
            <Skeleton className="h-4 w-20 rounded" />
            <Skeleton className="h-4 w-20 rounded" />
          </div>

          {/* Lead Summary Box */}
          <div className="p-5 rounded-2xl bg-card border border-border space-y-2">
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-5/6 rounded" />
          </div>
        </div>

        {/* Parent App Quick Card Skeleton */}
        <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-card border border-border shadow-xs flex flex-wrap sm:flex-nowrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0 flex-1">
            <Skeleton className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-32 rounded" />
                <Skeleton className="h-4 w-14 rounded-full" />
              </div>
              <Skeleton className="h-3.5 w-48 sm:w-64 rounded" />
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Skeleton className="h-9 w-24 rounded-full" />
            <Skeleton className="h-9 w-24 rounded-full" />
          </div>
        </div>

        {/* GitHub / Tech Highlight Card Skeleton */}
        <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-36 rounded" />
              <Skeleton className="h-4 w-48 rounded" />
            </div>
          </div>
          <Skeleton className="h-8 w-32 rounded-full" />
        </div>

        {/* Cover Screenshot Image Skeleton */}
        <div className="rounded-2xl sm:rounded-3xl overflow-hidden border border-border bg-card">
          <Skeleton className="w-full h-64 sm:h-80 md:h-96 rounded-none" />
          <div className="p-3.5 bg-muted/30 border-t border-border flex items-center justify-between">
            <Skeleton className="h-3.5 w-60 rounded" />
            <Skeleton className="h-3.5 w-16 rounded" />
          </div>
        </div>

        {/* Article Content Body Skeleton */}
        <div className="space-y-6 pt-2">
          {/* Section 1 */}
          <div className="space-y-3">
            <Skeleton className="h-7 w-48 rounded-lg" />
            <div className="space-y-2.5">
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-4 w-11/12 rounded" />
              <Skeleton className="h-4 w-4/5 rounded" />
            </div>
          </div>

          {/* Blockquote Skeleton */}
          <div className="pl-4 py-3 border-l-4 border-primary/40 bg-card rounded-r-2xl space-y-2">
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-3/4 rounded" />
          </div>

          {/* Section 2 */}
          <div className="space-y-3 pt-4">
            <Skeleton className="h-7 w-56 rounded-lg" />
            <div className="space-y-2.5">
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-4 w-5/6 rounded" />
              <Skeleton className="h-4 w-10/12 rounded" />
            </div>
          </div>

          {/* Code block skeleton */}
          <div className="p-4 rounded-2xl bg-neutral-950/80 border border-neutral-800 space-y-2">
            <Skeleton className="h-3.5 w-3/4 bg-neutral-800 rounded" />
            <Skeleton className="h-3.5 w-1/2 bg-neutral-800 rounded" />
            <Skeleton className="h-3.5 w-2/3 bg-neutral-800 rounded" />
          </div>

          {/* Section 3 */}
          <div className="space-y-3 pt-4">
            <Skeleton className="h-7 w-52 rounded-lg" />
            <div className="space-y-2.5">
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-4 w-4/5 rounded" />
            </div>
          </div>
        </div>

        {/* Bottom Related Articles Skeleton */}
        <div className="pt-10 border-t border-border space-y-4">
          <Skeleton className="h-6 w-40 rounded" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl border border-border bg-card p-4 space-y-3"
              >
                <Skeleton className="h-4 w-16 rounded" />
                <Skeleton className="h-5 w-full rounded" />
                <Skeleton className="h-3.5 w-4/5 rounded" />
                <div className="pt-3 border-t border-border flex items-center justify-between">
                  <Skeleton className="h-3 w-20 rounded" />
                  <Skeleton className="h-3 w-16 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
