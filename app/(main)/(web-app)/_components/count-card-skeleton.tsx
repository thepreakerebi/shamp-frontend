import { Skeleton } from "@/components/ui/skeleton";

export function CountCardSkeleton() {
  return (
    <Skeleton className="w-full max-w-[220px] flex flex-col items-center justify-center gap-2 p-3">
      <Skeleton className="flex items-center gap-2 w-full justify-center">
        <Skeleton className="h-6 w-8 rounded-md bg-muted-foreground/20" />
      </Skeleton>
      <Skeleton className="w-full text-center mt-1">
        <Skeleton className="h-4 w-16 mx-auto rounded bg-muted-foreground/20" />
        <Skeleton className="h-3 w-20 mx-auto mt-1 rounded bg-muted-foreground/20" />
      </Skeleton>
    </Skeleton>
  );
} 