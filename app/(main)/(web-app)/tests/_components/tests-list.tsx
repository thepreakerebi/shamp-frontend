"use client";
import React, { useEffect, useState } from "react";
import { useTests } from "@/hooks/use-tests";
import { TestCard } from "./test-card";
import { TestsTableSkeleton } from "./tests-table-skeleton";
import { TestsCardToolbar } from "./tests-card-toolbar";

export function TestsList() {
  const { tests, testsLoading } = useTests();

  // Scroll-to-top button visibility (mobile only)
  const [showTop, setShowTop] = useState(false);
  useEffect(() => {
    const handler = () => {
      setShowTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

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
      {/* Scroll to top button (mobile) */}
      {showTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-4 z-20 md:hidden bg-secondary text-secondary-foreground rounded-full p-3 shadow-lg"
          aria-label="Scroll to top"
        >
          ↑
        </button>
      )}
    </section>
  );
} 