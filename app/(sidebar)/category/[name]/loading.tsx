import { Skeleton } from "@/components/skeleton";

export default function CategoryLoading() {
  return (
    <div className="p-6 sm:p-8 md:p-10 w-full space-y-10 max-w-[1440px] mx-auto bg-background text-foreground transition-colors duration-200">
      {/* Top Header: Category Name & CTA Button */}
      <div className="border-b border-border pb-5 flex items-center justify-between">
        <Skeleton className="h-9 sm:h-10 w-36 rounded-xl" />
        <Skeleton className="h-9 w-28 rounded-full" />
      </div>

      <div className="space-y-12">
        {/* Section 1: 精选 App (4 cols x 2 rows = 8 items) */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-36 rounded-lg" />
            <Skeleton className="h-4 w-4 rounded-full" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-3.5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-3 p-2 rounded-2xl"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <Skeleton className="w-13 h-13 rounded-[16px] shrink-0" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton className="h-4 w-[58%] rounded-md" />
                    <Skeleton className="h-3.5 w-[82%] rounded-md" />
                  </div>
                </div>
                <Skeleton className="w-14 h-7 rounded-full shrink-0 ml-2" />
              </div>
            ))}
          </div>
        </section>

        {/* Section 2: 免费排行 (5 columns) */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-28 rounded-lg" />
            <Skeleton className="h-4 w-4 rounded-full" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 sm:gap-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="bg-card rounded-[24px] border border-border/60 shadow-xs p-5 flex flex-col justify-between items-center text-center relative min-h-[230px]"
              >
                {/* Rank number placeholder */}
                <div className="absolute top-3.5 left-4">
                  <Skeleton className="h-4 w-3 rounded" />
                </div>

                {/* Center Icon & Info */}
                <div className="flex flex-col items-center w-full flex-1 justify-center mt-1 space-y-2">
                  <Skeleton className="w-18 h-18 sm:w-20 sm:h-20 rounded-[22px] mb-2 shrink-0" />
                  <Skeleton className="h-4 w-[68%] rounded-md" />
                  <Skeleton className="h-3 w-[82%] rounded-md" />
                </div>

                {/* Bottom Action */}
                <Skeleton className="h-7 w-16 rounded-full mt-3" />
              </div>
            ))}
          </div>
        </section>

        {/* Section 3: 付费排行 (5 columns) */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-28 rounded-lg" />
            <Skeleton className="h-4 w-4 rounded-full" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 sm:gap-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="bg-card rounded-[24px] border border-border/60 shadow-xs p-5 flex flex-col justify-between items-center text-center relative min-h-[230px]"
              >
                {/* Rank number placeholder */}
                <div className="absolute top-3.5 left-4">
                  <Skeleton className="h-4 w-3 rounded" />
                </div>

                {/* Center Icon & Info */}
                <div className="flex flex-col items-center w-full flex-1 justify-center mt-1 space-y-2">
                  <Skeleton className="w-18 h-18 sm:w-20 sm:h-20 rounded-[22px] mb-2 shrink-0" />
                  <Skeleton className="h-4 w-[68%] rounded-md" />
                  <Skeleton className="h-3 w-[82%] rounded-md" />
                </div>

                {/* Bottom Action */}
                <Skeleton className="h-7 w-16 rounded-full mt-3" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
