"use client";
import { Skeleton } from "@/components/ui/skeleton";

export function BatchTestsCardSkeleton({ count = 6 }: { count?: number }) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 py-1">
      {Array.from({ length: count }).map((_, idx) => (
        <Skeleton key={idx} className="h-40 rounded-3xl" />
      ))}
    </section>
  );
} 