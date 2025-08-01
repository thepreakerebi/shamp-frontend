"use client";

import { useState, useEffect } from "react";
import type { TestRunSummary } from "@/hooks/use-tests";
import { useTestRuns } from "@/hooks/use-testruns";
import { TestRunCard } from "@/app/(main)/(web-app)/tests/[testId]/_components/test-run-card";
import { TestRunsCardSkeleton } from "@/app/(main)/(web-app)/tests/[testId]/_components/test-runs-card-skeleton";
import TestRunsFilter from "@/app/(main)/(web-app)/tests/[testId]/_components/test-runs-filter";
import { TestRunsListEmpty } from "./_components/test-runs-list-empty";

export default function TestRunsListPage() {
  const { testRuns: storeRuns, refetchAllTestRuns } = useTestRuns();

  // Local state mirrors store so we can control skeleton visibility
  const [runs, setRuns] = useState<typeof storeRuns>(storeRuns ?? null);
  const [loading, setLoading] = useState(storeRuns ? false : true);
  const [initialDone, setInitialDone] = useState(false);

  // Keep local state in sync with global store
  useEffect(() => {
    setRuns(storeRuns ?? null);
  }, [storeRuns]);

  // Trigger a background refresh on mount
  useEffect(() => {
    if (!refetchAllTestRuns) return;
    (async () => {
      try {
        setLoading(runs === null || runs.length === 0);
        await refetchAllTestRuns();
        setInitialDone(true);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [filters, setFilters] = useState({ result: "any", run: "any", persona: "any", testName: "any" });

  if ((!initialDone && loading) || (loading && (runs === null || runs.length === 0))) {
    return <TestRunsCardSkeleton />;
  }

  if (initialDone && !loading && (runs === null || runs.length === 0)) {
    return <TestRunsListEmpty />;
  }

  const filtered = (runs ?? []).filter((r) => {
    if (filters.result !== "any" && r.status !== filters.result) return false;
    if (filters.run !== "any" && r.browserUseStatus !== filters.run) return false;
    const pName = (r as { personaName?: string }).personaName;
    if (filters.persona !== "any" && pName !== filters.persona) return false;
    if (filters.testName !== "any" && (r as { testName?: string }).testName !== filters.testName) return false;
    return true;
  });

  const personaOptions = Array.from(
    new Set((runs ?? []).map((r) => (r as { personaName?: string }).personaName).filter(Boolean))
  ) as string[];

  const testNameOptions = Array.from(
    new Set((runs ?? []).map((r) => (r as { testName?: string }).testName).filter(Boolean))
  ) as string[];

  return (
    <section className="p-4 space-y-4">
      <section className="sticky top-[60px] z-10 bg-background flex items-center justify-between gap-4 py-2">
        <h1 className="text-2xl font-semibold">Test runs · {filtered.length}</h1>
        <TestRunsFilter personaOptions={personaOptions} testNameOptions={testNameOptions} filters={filters} onChange={setFilters} />
      </section>

      {filtered.length === 0 ? (
          (runs && runs.length > 0 ? (
            <section className="flex flex-col items-center justify-center w-full py-16 gap-4 bg-background rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
              <p className="text-muted-foreground text-sm">No test runs match your filters.</p>
            </section>
          ) : (
            <TestRunsListEmpty />
          ))
      ) : (
        <section className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((run, idx) => (
            <TestRunCard key={`${run._id}_${idx}`} run={run as TestRunSummary} />
          ))}
        </section>
      )}
    </section>
  );
} 