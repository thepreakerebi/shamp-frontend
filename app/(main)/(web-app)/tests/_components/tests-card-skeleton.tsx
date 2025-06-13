"use client";
import { Skeleton } from "@/components/ui/skeleton";

export function TestsCardSkeleton({ count = 6 }: { count?: number }) {
  const items = Array.from({ length: count });
  return (
    <section className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 p-4">
      {items.map((_, i) => (
        <div key={i} className="rounded-3xl border dark:border-0 bg-card/80 p-4 flex flex-col gap-3">
          {/* header */}
          <div className="flex items-start gap-3 w-full">
            <Skeleton className="w-10 h-10 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-full" />
            </div>
          </div>
          <Skeleton className="h-px w-full" />
          {/* badges row */}
          <div className="flex gap-2">
            <Skeleton className="h-5 w-20 rounded" />
            <Skeleton className="h-5 w-20 rounded" />
          </div>
          {/* runs row */}
          <div className="flex gap-2">
            <Skeleton className="h-4 w-10 rounded" />
            <Skeleton className="h-4 w-10 rounded" />
          </div>
        </div>
      ))}
    </section>
  );
} 