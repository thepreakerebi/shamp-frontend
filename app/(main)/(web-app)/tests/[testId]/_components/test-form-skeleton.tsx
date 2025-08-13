"use client";
import { Skeleton } from "@/components/ui/skeleton";

// Skeleton matching the two-column create/edit test layout.
export default function TestFormSkeleton() {
  return (
    <main className="p-4 w-full mx-auto space-y-6">
      <section className="grid grid-cols-1 md:grid-cols-[400px_1fr] gap-8 items-start">
        {/* Left column: inputs */}
        <section className="space-y-4 md:max-w-[400px] w-full">
          <Skeleton className="h-7 w-28 rounded" />

          {/* Name */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-24 rounded" />
            <Skeleton className="h-9 w-full rounded" />
          </div>

          {/* Persona */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-24 rounded" />
            <Skeleton className="h-9 w-full rounded" />
          </div>

          {/* Project */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-24 rounded" />
            <Skeleton className="h-9 w-full rounded" />
          </div>

          {/* Device type */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-24 rounded" />
            <div className="grid grid-cols-3 gap-2 md:max-w-xs">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-9 rounded" />
              ))}
            </div>
          </div>

          {/* Attachments */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-36 rounded" />
            <Skeleton className="h-24 w-full rounded" />
          </div>
        </section>

        {/* Right column: rich text editor */}
        <section className="space-y-2 min-w-0 w-full">
          <Skeleton className="h-4 w-24 rounded" />
          <Skeleton className="h-[480px] w-full rounded" />
        </section>
      </section>
    </main>
  );
}
