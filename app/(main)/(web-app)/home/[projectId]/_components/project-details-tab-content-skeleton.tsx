"use client";
import { Skeleton } from "@/components/ui/skeleton";
import React from "react";

export function ProjectDetailsTabContentSkeleton() {
  return (
    <section className="w-full">
      <section className="flex flex-col gap-6 w-full">
        {/* Section 1: Image + Info + Dropdown */}
        <section className="flex flex-col lsm:flex-row gap-4 items-start">
          {/* Preview Image Skeleton */}
          <figure className="relative h-32 w-full lsm:w-48 rounded-xl overflow-hidden bg-muted border border-border flex-shrink-0">
            <Skeleton className="object-fill w-full h-full absolute top-0 left-0" />
          </figure>
          {/* Info + Dropdown Skeleton */}
          <section className="flex flex-row w-full gap-4 items-start">
            {/* Name, URL, Test Runs Skeleton */}
            <section className="flex flex-col flex-1 gap-2 justify-center">
              <Skeleton className="h-6 w-2/3 mb-2" /> {/* Project Name */}
              <Skeleton className="h-4 w-1/2" /> {/* URL/Test Runs */}
            </section>
            {/* Dropdown Skeleton */}
            <section className="flex items-start">
              <Skeleton className="h-8 w-8 rounded-md" />
            </section>
          </section>
        </section>

        {/* Section 2: Description Skeleton */}
        <section className="w-full">
          <Skeleton className="h-5 w-32 mb-2" /> {/* Description header */}
          <Skeleton className="h-4 w-full max-w-md" /> {/* Description text */}
        </section>

        {/* Section 3: Credentials Skeleton */}
        <section className="flex flex-col gap-4 w-full min-w-0">
          {/* Auth Credentials Skeleton */}
          <section className="flex-1 min-w-0">
            <Skeleton className="h-5 w-40 mb-2" /> {/* Auth Credentials header */}
            <div className="flex flex-col gap-2">
              {[...Array(2)].map((_, i) => (
                <section key={i} className="flex flex-row items-center py-1 min-w-0 gap-2">
                  <Skeleton className="h-4 w-24 flex-[1_1_0%] min-w-0" />
                  <Skeleton className="h-4 w-40 flex-[2_1_0%] min-w-0" />
                </section>
              ))}
            </div>
          </section>
          {/* Payment Credentials Skeleton */}
          <section className="flex-1 min-w-0">
            <Skeleton className="h-5 w-40 mb-2" /> {/* Payment Credentials header */}
            <div className="flex flex-col gap-2">
              {[...Array(2)].map((_, i) => (
                <section key={i} className="flex flex-row items-center py-1 min-w-0 gap-2">
                  <Skeleton className="h-4 w-24 flex-[1_1_0%] min-w-0" />
                  <Skeleton className="h-4 w-40 flex-[2_1_0%] min-w-0" />
                </section>
              ))}
            </div>
          </section>
        </section>
      </section>
    </section>
  );
} 