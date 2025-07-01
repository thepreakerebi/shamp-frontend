"use client";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function IssueCardSkeleton() {
  return (
    <Card className="flex flex-col gap-3 p-4 h-fit">
      {/* Top row: avatar + names skeleton */}
      <section className="flex items-center gap-3">
        <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
        <div className="flex flex-col min-w-0 flex-1 gap-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-32" />
        </div>
      </section>

      {/* Issue content skeleton */}
      <section className="space-y-3">
        {/* UI Issues */}
        <div>
          <Skeleton className="h-4 w-16 mb-2" />
          <div className="space-y-1">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
          </div>
        </div>

        {/* Copy Issues */}
        <div>
          <Skeleton className="h-4 w-20 mb-2" />
          <div className="space-y-1">
            <Skeleton className="h-3 w-full" />
          </div>
        </div>

        {/* Interaction Issues */}
        <div>
          <Skeleton className="h-4 w-28 mb-2" />
          <div className="space-y-1">
            <Skeleton className="h-3 w-5/6" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        </div>
      </section>

      {/* Actions row skeleton */}
      <section className="flex items-center justify-between gap-2 mt-auto pt-2">
        <Skeleton className="h-6 w-20" />
        <div className="flex items-center gap-1">
          <Skeleton className="h-7 w-7 rounded" />
          <Skeleton className="h-7 w-7 rounded" />
        </div>
      </section>
    </Card>
  );
} 