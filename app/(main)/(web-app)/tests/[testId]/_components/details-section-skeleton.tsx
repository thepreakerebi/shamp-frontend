"use client";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

export function DetailsSectionSkeleton() {
  return (
    <article className="p-4 space-y-6">
      {/* Header */}
      <header className="space-y-2">
        <Skeleton className="h-6 w-2/3 rounded" />
        <Skeleton className="h-4 w-full max-w-md rounded" />
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
    </article>
  );
} 