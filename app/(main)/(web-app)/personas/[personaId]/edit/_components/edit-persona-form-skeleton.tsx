"use client";

import { Skeleton } from "@/components/ui/skeleton";
import React from "react";

export function EditPersonaFormSkeleton() {
  return (
    <div className="mx-auto max-w-lg py-10 space-y-6 w-full">
      {/* Name */}
      <section className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full" />
      </section>
      {/* Description */}
      <section className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-24 w-full" />
      </section>
      {/* Background */}
      <section className="space-y-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-20 w-full" />
      </section>
      {/* Gender */}
      <section className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <div className="flex gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-4 w-16" />
          ))}
        </div>
      </section>
      {/* Goals */}
      <section className="space-y-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </section>
      {/* Frustrations */}
      <section className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </section>
      {/* Traits */}
      <section className="space-y-2">
        <Skeleton className="h-4 w-14" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </section>
      {/* Preferred Devices */}
      <section className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <div className="flex gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-20" />
          ))}
        </div>
      </section>
    </div>
  );
} 