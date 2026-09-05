import { Skeleton } from "@/components/skeleton";

export default function GamesLoading() {
  return (
    <div className="flex flex-col min-h-screen justify-between bg-background text-foreground transition-colors duration-200">
      <div className="p-8 w-full space-y-12 flex-1">
        {/* Header Skeleton */}
        <div className="border-b border-border pb-4 space-y-2.5">
          <Skeleton className="h-3.5 w-28 rounded" />
          <div className="flex items-center justify-between">
            <Skeleton className="h-9 w-36 rounded-xl" />
            <Skeleton className="h-8 w-24 rounded-full" />
          </div>
        </div>

        {/* Content Section Skeleton */}
        <div className="space-y-12">
          {/* Row 1: Hero Card (7 cols) + List (5 cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Hero Banner Skeleton */}
            <div className="lg:col-span-7 h-[460px] rounded-3xl bg-card border border-border p-7 flex flex-col justify-between shadow-xs">
              <div className="space-y-3">
                <Skeleton className="h-4 w-32 rounded" />
                <Skeleton className="h-8 w-3/4 rounded-xl" />
                <Skeleton className="h-4 w-1/2 rounded" />
              </div>
              <div className="flex items-center gap-3.5 p-3.5 bg-secondary/80 rounded-2xl border border-border shadow-xs">
                <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-36 rounded-md" />
                  <Skeleton className="h-3.5 w-52 rounded" />
                </div>
                <Skeleton className="w-16 h-7 rounded-full shrink-0" />
              </div>
            </div>

            {/* Right List Skeleton */}
            <div className="lg:col-span-5 bg-card rounded-3xl p-6 border border-border flex flex-col justify-between shadow-xs">
              <div>
                <div className="space-y-2 mb-4">
                  <Skeleton className="h-3.5 w-24 rounded" />
                  <Skeleton className="h-6 w-40 rounded-lg" />
                </div>
                <div className="divide-y divide-border">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3.5 py-3 first:pt-0 last:pb-0">
                      <Skeleton className="w-11 h-11 rounded-xl shrink-0" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-36 rounded-md" />
                        <Skeleton className="h-3.5 w-48 rounded" />
                      </div>
                      <Skeleton className="w-12 h-6 rounded-full shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: List (5 cols) + Hero Card (7 cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            <div className="lg:col-span-5 bg-card rounded-3xl p-6 border border-border flex flex-col justify-between order-2 lg:order-1 shadow-xs">
              <div>
                <div className="space-y-2 mb-4">
                  <Skeleton className="h-3.5 w-24 rounded" />
                  <Skeleton className="h-6 w-40 rounded-lg" />
                </div>
                <div className="divide-y divide-border">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3.5 py-3 first:pt-0 last:pb-0">
                      <Skeleton className="w-11 h-11 rounded-xl shrink-0" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-36 rounded-md" />
                        <Skeleton className="h-3.5 w-48 rounded" />
                      </div>
                      <Skeleton className="w-12 h-6 rounded-full shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 h-[460px] rounded-3xl bg-card border border-border p-7 flex flex-col justify-between order-1 lg:order-2 shadow-xs">
              <div className="space-y-3">
                <Skeleton className="h-4 w-32 rounded" />
                <Skeleton className="h-8 w-3/4 rounded-xl" />
                <Skeleton className="h-4 w-1/2 rounded" />
              </div>
              <div className="flex items-center gap-3.5 p-3.5 bg-secondary/80 rounded-2xl border border-border shadow-xs">
                <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-36 rounded-md" />
                  <Skeleton className="h-3.5 w-52 rounded" />
                </div>
                <Skeleton className="w-16 h-7 rounded-full shrink-0" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
