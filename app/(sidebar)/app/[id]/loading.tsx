import { Skeleton } from "@/components/skeleton";

export default function AppDetailLoading() {
  return (
    <div className="w-full min-h-screen bg-white p-6 sm:p-10 md:p-12 space-y-10">
      {/* Top Header Row: Large Icon + App Info + Action Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-8 border-b border-border/70">
        <div className="flex items-center gap-6">
          {/* App Icon */}
          <Skeleton className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl shrink-0" />
          <div className="space-y-3">
            <Skeleton className="h-8 w-48 sm:w-64 rounded-xl" />
            <Skeleton className="h-4 w-36 sm:w-52 rounded-md" />
            <div className="flex items-center gap-3">
              <Skeleton className="h-4 w-20 rounded" />
              <Skeleton className="h-4 w-16 rounded" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Skeleton className="h-10 w-28 rounded-full" />
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
      </div>

      {/* Meta Specs Row: 5 Stats Pill Columns */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 py-4 border-b border-border/70">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center justify-center p-3 space-y-2">
            <Skeleton className="h-3 w-16 rounded" />
            <Skeleton className="h-6 w-14 rounded-md" />
            <Skeleton className="h-3 w-20 rounded" />
          </div>
        ))}
      </div>

      {/* Screenshots Showcase Row */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-32 rounded-md" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton
              key={i}
              className="aspect-[9/16] max-h-[480px] rounded-2xl w-full"
            />
          ))}
        </div>
      </div>

      {/* Description & Features Skeleton */}
      <div className="space-y-4 pt-4 border-t border-border/70">
        <Skeleton className="h-6 w-24 rounded-md" />
        <div className="space-y-2.5 w-full">
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-4 w-11/12 rounded" />
          <Skeleton className="h-4 w-4/5 rounded" />
        </div>
      </div>
    </div>
  );
}
