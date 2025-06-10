"use client";
import { Skeleton } from "@/components/ui/skeleton";
import React from "react";

export function PersonaDetailsSkeleton() {
  return (
    <section className="flex flex-col gap-6 max-w-2xl mx-auto w-full">
      {/* 1. Top Section: Avatar, Name & Gender, Dropdown */}
      <section className="flex items-center gap-6 w-full">
        {/* Avatar Skeleton */}
        <section className="flex-shrink-0">
          <Skeleton className="rounded-full w-20 h-20 border border-border bg-muted" />
        </section>
        {/* Name & Gender Skeleton */}
        <section className="flex flex-col flex-1 min-w-0 gap-1">
          <Skeleton className="h-8 w-2/3 mb-2" /> {/* Name */}
          <Skeleton className="h-5 w-1/4" /> {/* Gender */}
        </section>
        {/* Dropdown Skeleton */}
        <section className="flex-shrink-0">
          <Skeleton className="h-8 w-8 rounded-md" />
        </section>
      </section>

      {/* 2. Description Skeleton */}
      <section className="w-full">
        <Skeleton className="h-5 w-32 mb-2" /> {/* Description header */}
        <Skeleton className="h-4 w-full max-w-md" /> {/* Description text */}
      </section>

      {/* 3. Background Skeleton */}
      <section className="w-full">
        <Skeleton className="h-5 w-32 mb-2" /> {/* Background header */}
        <Skeleton className="h-4 w-full max-w-md" /> {/* Background text */}
      </section>

      {/* 4. Goals Skeleton */}
      <section className="w-full">
        <Skeleton className="h-5 w-32 mb-2" /> {/* Goals header */}
        <div className="flex flex-col gap-2">
          {[...Array(2)].map((_, i) => (
            <Skeleton key={i} className="h-4 w-1/2" />
          ))}
        </div>
      </section>

      {/* 5. Frustrations Skeleton */}
      <section className="w-full">
        <Skeleton className="h-5 w-32 mb-2" /> {/* Frustrations header */}
        <div className="flex flex-col gap-2">
          {[...Array(2)].map((_, i) => (
            <Skeleton key={i} className="h-4 w-1/2" />
          ))}
        </div>
      </section>

      {/* 6. Traits Skeleton */}
      <section className="w-full">
        <Skeleton className="h-5 w-32 mb-2" /> {/* Traits header */}
        <div className="flex flex-col gap-2">
          {[...Array(2)].map((_, i) => (
            <Skeleton key={i} className="h-4 w-1/2" />
          ))}
        </div>
      </section>

      {/* 7. Preferred Devices Skeleton */}
      <section className="w-full">
        <Skeleton className="h-5 w-40 mb-2" /> {/* Preferred Devices header */}
        <div className="flex flex-col gap-2">
          {[...Array(2)].map((_, i) => (
            <Skeleton key={i} className="h-4 w-1/2" />
          ))}
        </div>
      </section>
    </section>
  );
} 