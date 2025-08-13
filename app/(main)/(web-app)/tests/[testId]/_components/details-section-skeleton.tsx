"use client";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

export function DetailsSectionSkeleton() {
  return (
    <article className="p-4 space-y-6">
      {/* Header */}
      <header className="space-y-2">
        <Skeleton className="h-6 w-2/3 rounded" />
      </header>

      <Separator />

      {/* Project & Personas */}
      <section className="flex flex-col md:flex-row gap-6">
        <div className="space-y-2 w-full md:w-1/3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-6 w-32 rounded" />
        </div>
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-24" />
          <div className="flex gap-2 flex-wrap">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-24 rounded" />
            ))}
          </div>
        </div>
      </section>

      <Separator />

      {/* Stats */}
      <footer className="flex items-center gap-2 flex-wrap">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-6 w-20 rounded" />
        ))}
      </footer>

      <Separator />

      {/* Structured Description */}
      <section className="space-y-3">
        {/* Goal heading */}
        <Skeleton className="h-5 w-24 rounded" />
        {/* Goal paragraph */}
        <Skeleton className="h-4 w-3/4 rounded" />

        {/* Steps heading */}
        <Skeleton className="h-5 w-28 rounded" />
        {/* Steps list items */}
        <section className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={`step-${i}`} className="h-4 w-2/3 rounded" />
          ))}
        </section>

        {/* Success criteria heading */}
        <Skeleton className="h-5 w-40 rounded" />
        <Skeleton className="h-4 w-3/4 rounded" />

        {/* Stop conditions heading */}
        <Skeleton className="h-5 w-36 rounded" />
        <section className="space-y-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={`stop-${i}`} className="h-4 w-5/6 rounded" />
          ))}
        </section>

        {/* Edge cases heading */}
        <Skeleton className="h-5 w-28 rounded" />
        <Skeleton className="h-4 w-1/2 rounded" />
      </section>
    </article>
  );
} 