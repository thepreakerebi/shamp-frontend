"use client";
import { Skeleton } from "@/components/ui/skeleton";

export function TestRunsCardSkeleton({ count = 3 }: { count?: number }) {
  const items = Array.from({ length: count });
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((_, i) => (
        <Skeleton key={i} className="h-40 w-full rounded-3xl" />
      ))}
    </div>
  );
} 