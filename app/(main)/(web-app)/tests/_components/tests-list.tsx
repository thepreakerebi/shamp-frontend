"use client";
import React from "react";
import { TestsTable } from "./tests-table";
import { useTests } from "@/hooks/use-tests";
import { TestCard } from "./test-card";
import { TestCardSkeleton } from "./test-card-skeleton";

export function TestsList() {
  const { tests, testsLoading } = useTests();

  return (
    <>
      {/* Mobile cards */}
      <section className="block md:hidden w-full px-4 py-2">
        {testsLoading && (!tests || tests.length === 0) ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <TestCardSkeleton key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {tests?.map(t => <TestCard key={t._id} test={t} />)}
          </div>
        )}
      </section>

      {/* Desktop table */}
      <section className="hidden md:block w-full">
        <TestsTable />
      </section>
    </>
  );
} 