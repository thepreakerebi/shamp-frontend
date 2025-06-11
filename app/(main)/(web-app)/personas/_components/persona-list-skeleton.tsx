"use client";
import { Skeleton } from "@/components/ui/skeleton";
import React from "react";

export function PersonaListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <section
      className="grid grid-cols-1 lsm:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 w-full"
      aria-label="Personas list skeleton"
    >
      {Array.from({ length: count }).map((_, i) => (
        <article
          key={i}
          className="rounded-2xl overflow-hidden flex items-center gap-4 p-4 bg-card border border-border"
        >
          {/* Avatar skeleton */}
          <section className="flex-shrink-0">
            <Skeleton className="rounded-full w-16 h-16 border border-border bg-muted" />
          </section>
          {/* Card Content skeleton */}
          <section className="flex flex-col w-full min-w-0 gap-1">
            <Skeleton className="h-5 w-2/3 mb-2" /> {/* Name */}
            <Skeleton className="h-4 w-1/3" /> {/* Gender */}
          </section>
          {/* Dropdown skeleton */}
          <section className="flex-shrink-0">
            <Skeleton className="h-8 w-8 rounded-md" />
          </section>
        </article>
      ))}
    </section>
  );
} 