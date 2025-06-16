"use client";
import { Skeleton } from "@/components/ui/skeleton";

export function AnalysisSectionSkeleton() {
  return (
    <article className="p-4 space-y-6">
      {/* Summary card */}
      <div className="space-y-2">
        <Skeleton className="h-5 w-32 rounded" />
        <Skeleton className="h-4 w-full max-w-lg rounded" />
        <Skeleton className="h-4 w-full max-w-lg rounded" />
      </div>

      {/* Success card */}
      <div className="space-y-4">
        <Skeleton className="h-5 w-24 rounded" />
        <Skeleton className="h-3 w-full max-w-sm rounded" />
        <Skeleton className="h-2 w-full rounded" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-24 rounded" />
          <Skeleton className="h-6 w-24 rounded" />
        </div>
      </div>

      {/* Additional cards */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-5 w-40 rounded" />
          {Array.from({ length: 3 }).map((_, j) => (
            <Skeleton key={j} className="h-4 w-full max-w-md rounded" />
          ))}
        </div>
      ))}
    </article>
  );
} 