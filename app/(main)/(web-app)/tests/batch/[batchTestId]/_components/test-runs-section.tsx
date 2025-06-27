"use client";
import { BatchTest } from "@/hooks/use-batch-tests";
import { useEffect, useState } from "react";
import { useTestRuns } from "@/hooks/use-testruns";
import { useBatchTests } from "@/hooks/use-batch-tests";
import { TestRunCard, MinimalRun } from "@/app/(main)/(web-app)/tests/[testId]/_components/test-run-card";
import { TestRunsCardSkeleton } from "@/app/(main)/(web-app)/tests/[testId]/_components/test-runs-card-skeleton";
import TestRunsFilter from "@/app/(main)/(web-app)/tests/[testId]/_components/test-runs-filter";

export default function BatchTestRunsSection({ batch }: { batch: BatchTest }) {
  const { getTestRunStatus } = useTestRuns();
  const { getTestRunsForBatchTest } = useBatchTests();
  const [runs, setRuns] = useState<import("@/hooks/use-testruns").TestRun[] | null>(null);
  const [filters, setFilters] = useState({ result: 'any', run: 'any', persona: 'any' });

  // Accept both string IDs and populated objects
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawRuns = (batch as unknown as { testruns?: unknown; testRuns?: unknown }).testruns
    ?? (batch as unknown as { testRuns?: unknown }).testRuns
    ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const runIds: string[] = (Array.isArray(rawRuns) ? rawRuns : [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((v: any) => (typeof v === 'string' ? v : (v && typeof v === 'object' && '_id' in v ? (v as { _id: string })._id : undefined)))
    .filter((id): id is string => Boolean(id));
  const idsKey = JSON.stringify(runIds);

  // Prefer aggregated endpoint to avoid race: fetch all runs for batch at once
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await getTestRunsForBatchTest(batch._id, true);
        if (mounted) setRuns(data as unknown as import("@/hooks/use-testruns").TestRun[]);
      } catch {
        // Fallback: if aggregated fetch fails, attempt per-ID logic
        try {
          const settled = await Promise.allSettled(runIds.map((id: string) => getTestRunStatus(id)));
          const successful = settled.filter((r): r is PromiseFulfilledResult<import("@/hooks/use-testruns").TestRunStatus> => r.status === 'fulfilled').map(r=>r.value as import("@/hooks/use-testruns").TestRun);
          if (mounted) setRuns(successful);
        } catch { if (mounted) setRuns([]); }
      }
    })();
    return () => { mounted = false; };
  }, [batch._id, idsKey]);

  if (runs === null) {
    return <TestRunsCardSkeleton />;
  }

  if (runs.length === 0) {
    return <p className="text-sm text-muted-foreground px-4">No runs yet.</p>;
  }

  // Filtering logic mirrors the single-test view.
  const personaOptions = Array.from(new Set(runs.map(r => (r as { personaName?: string }).personaName).filter(Boolean))) as string[];

  const filteredUnsorted = runs.filter(r => {
    if (filters.result !== 'any' && r.status !== filters.result) return false;
    if (filters.run !== 'any' && r.browserUseStatus !== filters.run) return false;
    const pName = (r as { personaName?: string }).personaName;
    if (filters.persona !== 'any' && pName !== filters.persona) return false;
    return true;
  });

  // Newest-first sorting (finishedAt, startedAt, createdAt fallbacks)
  const filtered = [...filteredUnsorted].sort((a, b) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const getTs = (x: any) => {
      const dt = x.finishedAt || x.startedAt || x.createdAt;
      if (dt) return new Date(dt).getTime();
      // Fallback: derive timestamp from MongoDB ObjectId (first 8 chars -> hex seconds)
      if (typeof x._id === 'string' && x._id.length >= 8) {
        return parseInt(x._id.substring(0, 8), 16) * 1000;
      }
      return 0;
    };
    return getTs(b) - getTs(a);
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