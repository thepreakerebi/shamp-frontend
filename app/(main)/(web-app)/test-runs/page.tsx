"use client";

import { useState } from "react";
import type { TestRunSummary } from "@/hooks/use-tests";
import { useTestRuns } from "@/hooks/use-testruns";
import { TestRunCard } from "@/app/(main)/(web-app)/tests/[testId]/_components/test-run-card";
import { TestRunsCardSkeleton } from "@/app/(main)/(web-app)/tests/[testId]/_components/test-runs-card-skeleton";
import TestRunsFilter from "@/app/(main)/(web-app)/tests/[testId]/_components/test-runs-filter";
import { TestRunsListEmpty } from "./_components/test-runs-list-empty";

export default function TestRunsListPage() {
  const { testRuns: displayRuns, testRunsLoading: loading } = useTestRuns();

  const [filters, setFilters] = useState({ result: 'any', run: 'any', persona: 'any' });

  const filtered = (displayRuns ?? []).filter(r => {
    if (filters.result !== 'any' && r.status !== filters.result) return false;
    if (filters.run !== 'any' && r.browserUseStatus !== filters.run) return false;
    const pName = (r as { personaName?: string }).personaName;
    if (filters.persona !== 'any' && pName !== filters.persona) return false;
    return true;
  });

  const personaOptions = Array.from(new Set((displayRuns ?? []).map(r => (r as { personaName?: string }).personaName).filter(Boolean))) as string[];

  return (
    <section className="p-4 space-y-4">
      <section className="sticky top-[60px] z-10 bg-background flex items-center justify-between gap-4 py-2">
        <h1 className="text-2xl font-semibold">Test runs</h1>
        <TestRunsFilter personaOptions={personaOptions} filters={filters} onChange={setFilters} />
      </section>
      {loading && <TestRunsCardSkeleton />}
      {!loading && filtered.length === 0 && (
        <TestRunsListEmpty />
      )}
      {!loading && filtered.length > 0 && (
        <section className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map(run => (
            <TestRunCard key={run._id} run={run as TestRunSummary} />
          ))}
        </section>
      )}
    </section>
  );
} 