"use client";
import { Skeleton } from '@/components/ui/skeleton';
export function MembersCardSkeleton() {
  return (
    <article className="p-4 rounded-2xl border dark:border-0 bg-card/80 flex flex-col gap-2">
      <Skeleton className="w-12 h-12 rounded-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-2/3" />
      <Skeleton className="h-3 w-16 mt-auto" />
    </article>
  );
} 