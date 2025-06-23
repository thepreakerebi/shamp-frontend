"use client";
import React from "react";
import { useBatchTests } from "@/hooks/use-batch-tests";
import { BatchTestsCardSkeleton } from "./batch-tests-card-skeleton";
import { BatchTestCard } from "./batch-test-card";
import { BatchTestsListEmpty } from "./batch-tests-list-empty";

export function BatchTestsList() {
  const { batchTests, batchTestsLoading } = useBatchTests();

  if (batchTestsLoading && (!batchTests || batchTests.length === 0)) {
    return <BatchTestsCardSkeleton count={6} />;
  }

  if (!batchTests || batchTests.length === 0) {
    return <BatchTestsListEmpty />;
  }

  return (
    <section className="flex flex-col gap-4">
      {/* Informational header */}
      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">Batch tests</h2>
        <p className="text-sm max-w-2xl text-muted-foreground">
          Batch tests let you launch the same usability test across multiple personas simultaneously, helping you compare results side-by-side and speed up your research workflow.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 py-1">
        {batchTests.map(bt => (
          <BatchTestCard key={bt._id} batch={bt} />
        ))}
      </section>
    </section>
  );
} 