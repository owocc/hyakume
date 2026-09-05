import { Skeleton } from "@/components/skeleton";

export default function SearchLoading() {
  return (
    <div className="p-8 w-full space-y-8 bg-background min-h-screen">
      {/* Search Header Skeleton */}
      <div className="border-b border-border pb-4 space-y-3">
        <Skeleton className="h-9 w-64 rounded-xl" />
        <Skeleton className="h-4 w-44 rounded-md" />
      </div>

      {/* 3-Column Flat Search Card Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="bg-card rounded-3xl p-5 border border-border flex flex-col justify-between space-y-5 shadow-xs"
          >
            {/* Top Row: Icon + Title/Categories + Button */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32 rounded-md" />
                  <div className="flex gap-1.5">
                    <Skeleton className="h-3.5 w-10 rounded" />
                    <Skeleton className="h-3.5 w-14 rounded" />
                  </div>
                  <Skeleton className="h-3 w-20 rounded" />
                </div>
              </div>
              <Skeleton className="w-14 h-6 rounded-full shrink-0" />
            </div>

            {/* Bottom Showcase: 3 Screenshot Card Skeletons */}
            <div className="grid grid-cols-3 gap-2 bg-muted/60 p-2.5 rounded-2xl border border-border">
              {Array.from({ length: 3 }).map((_, j) => (
                <Skeleton
                  key={j}
                  className="rounded-xl h-44 w-full"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
