"use client";
import { Skeleton } from "@/components/ui/skeleton";
import React from "react";

export function ProjectListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <section
      className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 w-full"
      aria-label="Projects list skeleton"
    >
      {Array.from({ length: count }).map((_, i) => (
        <article
          key={i}
          className="rounded-2xl overflow-hidden flex flex-col bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
        >
          {/* Image skeleton */}
          <figure className="relative h-32 w-full bg-muted flex items-center justify-center">
            <Skeleton className="object-fill w-full h-full absolute top-0 left-0" />
          </figure>
          {/* Card Content skeleton */}
          <section className="flex flex-col gap-1 flex-1 justify-end p-4">
            <header>
              <Skeleton className="h-5 w-2/3 mb-2" />
            </header>
            <footer className="flex items-center gap-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-6 w-6 rounded-full ml-auto" />
            </footer>
          </section>
        </article>
      ))}
    </section>
  );
} 