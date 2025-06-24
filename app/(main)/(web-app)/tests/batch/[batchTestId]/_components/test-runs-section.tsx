"use client";
import { BatchTest } from "@/hooks/use-batch-tests";
import { useEffect, useState } from "react";
import { useTestRuns } from "@/hooks/use-testruns";
import { TestRunCard, MinimalRun } from "@/app/(main)/(web-app)/tests/[testId]/_components/test-run-card";
import { TestRunsCardSkeleton } from "@/app/(main)/(web-app)/tests/[testId]/_components/test-runs-card-skeleton";
import TestRunsFilter from "@/app/(main)/(web-app)/tests/[testId]/_components/test-runs-filter";

export default function BatchTestRunsSection({ batch }: { batch: BatchTest }) {
  const { getTestRunStatus } = useTestRuns();
  const [runs, setRuns] = useState<import("@/hooks/use-testruns").TestRun[] | null>(null);
  const [filters, setFilters] = useState({ result: 'any', run: 'any', persona: 'any' });

  const idsKey = JSON.stringify(batch.testruns ?? []);

  // Fetch runs once per distinct ids list
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const ids = batch.testruns ?? [];
    if (ids.length === 0) { setRuns([]); return; }
    let mounted = true;
    (async () => {
      try {
        const fetched = await Promise.all(ids.map(id => getTestRunStatus(id)));
        if (mounted) setRuns(fetched);
      } catch {
        if (mounted) setRuns([]);
      }
    })();
    return () => { mounted = false; };
  }, [idsKey]);

  if (runs === null) {
    return <TestRunsCardSkeleton />;
  }

  if (runs.length === 0) {
    return <p className="text-sm text-muted-foreground px-4">No runs yet.</p>;
  }

  // Filtering logic mirrors the single-test view.
  const personaOptions = Array.from(new Set(runs.map(r => (r as { personaName?: string }).personaName).filter(Boolean))) as string[];

  const filtered = runs.filter(r => {
    if (filters.result !== 'any' && r.status !== filters.result) return false;
    if (filters.run !== 'any' && r.browserUseStatus !== filters.run) return false;
    const pName = (r as { personaName?: string }).personaName;
    if (filters.persona !== 'any' && pName !== filters.persona) return false;
    return true;
  });

  return (
    <section className="p-4 space-y-4">
      <section className="sticky top-[60px] z-10 bg-background flex items-center justify-between gap-4 py-2">
        <h2 className="text-xl font-semibold">Batch test runs</h2>
        <TestRunsFilter personaOptions={personaOptions} filters={filters} onChange={setFilters} />
      </section>
      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">No runs match the selected filters.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(run => (
            <TestRunCard key={run._id} run={run as unknown as MinimalRun} />
          ))}
        </div>
      )}
    </section>
  );
} 