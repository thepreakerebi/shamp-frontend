"use client";
import { Skeleton } from "@/components/ui/skeleton";

export function TestCardSkeleton() {
  return (
    <div className="rounded-3xl border p-4 flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <Skeleton className="w-10 h-10 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-full" />
        </div>
      </div>
      <div className="flex gap-2 mt-auto">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      <div className="flex gap-2 pt-1">
        <Skeleton className="h-4 w-10 rounded" />
        <Skeleton className="h-4 w-10 rounded" />
      </div>
    </div>
  );
} 