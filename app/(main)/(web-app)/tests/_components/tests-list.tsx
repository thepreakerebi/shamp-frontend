"use client";
import React, { useEffect, useState } from "react";
import { useTests, type Test } from "@/hooks/use-tests";
import { TestCard } from "./test-card";
import { TestsCardSkeleton } from "./tests-card-skeleton";
import { TestsCardToolbar } from "./tests-card-toolbar";
import { TestsListEmpty } from "./tests-list-empty";

export function TestsList() {
  const { tests, trashedTests, testsLoading } = useTests();

  // Scroll-to-top button visibility (mobile only)
  const [showTop, setShowTop] = useState(false);
  useEffect(() => {
    const handler = () => {
      setShowTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const filteredTests: Test[] = React.useMemo(() => {
    if (!tests) return [] as Test[];
    const trashedIds = new Set((trashedTests ?? []).map(t=>t._id));
    return tests.filter(t => !trashedIds.has(t._id) && t.trashed !== true);
  }, [tests, trashedTests]);

  if (testsLoading && filteredTests.length === 0) {
    return <TestsCardSkeleton count={6} />;
  }

  if (filteredTests.length === 0) {
    return <TestsListEmpty />;
  }

  return (
    <section>
      <section className="flex flex-col">
        <TestsCardToolbar />
        <section className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 py-1">
          {filteredTests.map(test => (
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