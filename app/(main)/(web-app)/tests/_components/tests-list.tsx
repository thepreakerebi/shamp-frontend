"use client";
import React from "react";
import { useTests } from "@/hooks/use-tests";
import { TestCard } from "./test-card";
import { TestsTableSkeleton } from "./tests-table-skeleton";
import { TestsCardToolbar } from "./tests-card-toolbar";

export function TestsList() {
  const { tests, testsLoading } = useTests();

  if (testsLoading && (!tests || tests.length === 0)) {
    return <TestsTableSkeleton rows={6} />;
  }

  if (!tests || tests.length === 0) {
    return (
      <section className="p-4 text-center text-sm text-muted-foreground border border-dashed rounded-2xl">
        No tests found. Create a test to get started.
      </section>
    );
  }

  return (
    <section>
      <section className="flex flex-col">
        <TestsCardToolbar />
        <section className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 py-1">
          {tests.map(test => (
            <TestCard key={test._id} test={test} />
          ))}
        </section>
      </section>
    </section>
  );
} 