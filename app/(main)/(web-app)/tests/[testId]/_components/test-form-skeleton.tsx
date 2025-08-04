"use client";
import { Skeleton } from "@/components/ui/skeleton";

// Simple skeleton matching the create / edit test form layout.
export default function TestFormSkeleton() {
  return (
    <main className="p-4 w-full max-w-[500px] mx-auto space-y-6">
      <Skeleton className="h-6 w-36 rounded" /> {/* Heading */}
      <div className="space-y-4">
        {/* Name */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-24 rounded" />
          <Skeleton className="h-9 w-full rounded" />
        </div>
        {/* Description */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-24 rounded" />
          <Skeleton className="h-20 w-full rounded" />
        </div>
        {/* Project */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-24 rounded" />
          <Skeleton className="h-9 w-full rounded" />
        </div>
        {/* Persona */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-24 rounded" />
          <Skeleton className="h-9 w-full rounded" />
        </div>
        {/* Device radio */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-24 rounded" />
          <div className="flex gap-2">
            {Array.from({ length: 3 }).map((_ ,i)=>(
              <Skeleton key={i} className="h-9 w-24 rounded" />
            ))}
          </div>
        </div>
        {/* Attachments */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-32 rounded" />
          <Skeleton className="h-24 w-full rounded" />
        </div>
        {/* Action buttons */}
        <div className="flex justify-end gap-2 pt-2">
          <Skeleton className="h-9 w-24 rounded" />
        </div>
      </div>
    </main>
  );
}
