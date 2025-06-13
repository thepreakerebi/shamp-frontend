"use client";
import React, { useEffect, useState } from "react";
import { TestsTable } from "./tests-table";
import { TestCard } from "./test-card";
import { TestCardSkeleton } from "./test-card-skeleton";
import { TestsCardToolbar } from "./tests-card-toolbar";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useTestsStore } from "@/lib/store/tests";
import { useTests } from "@/hooks/use-tests";

export function TestsList() {
  const [hasMounted, setHasMounted] = useState(false);
  const isMdUp = useMediaQuery("(min-width: 768px)");
  const store = useTestsStore();
  // Always call useTests, but only use its values in the card view
  const { tests, testsLoading, searchTests } = useTests();

  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Optionally reset filtered/tests when switching views
  useEffect(() => {
    store.setFiltered(false);
    store.setTests(null);
  }, [isMdUp]);

  if (!hasMounted) return null;

  if (isMdUp) {
    // Only mount table view and its data hook
    return <section className="w-full"><TestsTable /></section>;
  }

  // Only mount card view and its data hook
  return (
    <>
      <section className="w-full px-4 py-2 pb-28">
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
      <div className="fixed bottom-0 p-4 inset-x-0 border-t bg-background z-20">
        <TestsCardToolbar onFilter={params => searchTests(params)} />
      </div>
    </>
  );
} 