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
    <section className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 py-1">
      {batchTests.map(bt => (
        <BatchTestCard key={bt._id} batch={bt} />
      ))}
    </section>
  );
} 