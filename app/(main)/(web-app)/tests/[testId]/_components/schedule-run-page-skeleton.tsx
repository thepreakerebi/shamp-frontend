"use client";
import { Skeleton } from "@/components/ui/skeleton";

export function ScheduleRunPageSkeleton() {
  return (
    <main className="p-4 w-full max-w-md mx-auto space-y-6">
      {/* Title */}
      <Skeleton className="h-8 w-48 rounded" />

      {/* Persona */}
      <section className="space-y-2">
        <Skeleton className="h-4 w-24 rounded" />
        <Skeleton className="h-10 w-full rounded" />
      </section>

      {/* Date */}
      <section className="space-y-2">
        <Skeleton className="h-4 w-24 rounded" />
        <Skeleton className="h-10 w-full rounded" />
      </section>

      {/* Time */}
      <section className="space-y-2">
        <Skeleton className="h-4 w-32 rounded" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-20 rounded" />
          <Skeleton className="h-10 w-20 rounded" />
        </div>
      </section>

      {/* Recurring checkbox */}
      <section className="space-y-2">
        <Skeleton className="h-4 w-32 rounded" />
      </section>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Skeleton className="h-10 w-24 rounded" />
        <Skeleton className="h-10 w-32 rounded" />
      </div>
    </main>
  );
}
