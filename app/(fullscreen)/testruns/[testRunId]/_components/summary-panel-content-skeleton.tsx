import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function SummaryDetailsSkeleton() {
  return (
    <section className="space-y-6">
      {/* Narration skeleton */}
      <section>
        <Skeleton className="h-5 w-32 mb-1" />
        <Skeleton className="h-4 w-full max-w-md mb-1" />
        <Skeleton className="h-4 w-2/3" />
      </section>
      {/* Run Summary skeleton */}
      <section>
        <Skeleton className="h-5 w-32 mb-1" />
        <Skeleton className="h-4 w-full max-w-md mb-1" />
        <Skeleton className="h-4 w-1/2" />
      </section>
      {/* Analysis Summary skeleton */}
      <section>
        <Skeleton className="h-5 w-40 mb-1" />
        <Skeleton className="h-4 w-full max-w-md mb-1" />
        <Skeleton className="h-4 w-1/3" />
      </section>
    </section>
  );
}

export default function SummaryPanelContentSkeleton() {
  return (
    <aside className="flex flex-col h-full overflow-hidden border-r animate-pulse">
      {/* Header skeleton */}
      <header className="p-4 border-b space-y-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-16" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-12 rounded-full" />
          <Skeleton className="h-4 w-20 rounded-full" />
        </div>
      </header>

      {/* Content skeleton */}
      <section className="flex-1 overflow-auto p-4 space-y-4">
        {Array.from({ length: 6 }).map((_, idx) => (
          <Skeleton key={idx} className="h-3 w-full" />
        ))}
      </section>

      {/* Footer skeleton */}
      <footer className="p-4 border-t">
        <Skeleton className="h-8 w-24" />
      </footer>
    </aside>
  );
} 