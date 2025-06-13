"use client";
import React from "react";
import { TestsTable } from "./tests-table";
import { useTests } from "@/hooks/use-tests";
import { TestCard } from "./test-card";
import { TestCardSkeleton } from "./test-card-skeleton";
import { TestsCardToolbar } from "./tests-card-toolbar";

export function TestsList() {
  const { tests, testsLoading, searchTests } = useTests();

  return (
    <>
      {/* Mobile cards */}
      <section className="block md:hidden w-full px-4 py-2 pb-28">{/* extra bottom padding for toolbar */}
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

      {/* Fixed bottom toolbar on mobile */}
      <div className="fixed bottom-0 p-4 inset-x-0 md:hidden border-t bg-background z-20">
        <TestsCardToolbar onFilter={params => searchTests(params)} />
      </div>

      {/* Desktop table */}
      <section className="hidden md:block w-full">
        <TestsTable />
      </section>
    </>
  );
} 