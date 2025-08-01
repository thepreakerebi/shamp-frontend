"use client";
import { BatchTest } from "@/hooks/use-batch-tests";
import { useEffect, useState } from "react";
import { useBatchTests } from "@/hooks/use-batch-tests";
import { useBatchTestsStore } from "@/lib/store/batchTests";
import { TestRunCard, MinimalRun } from "@/app/(main)/(web-app)/tests/[testId]/_components/test-run-card";
import { TestRunsCardSkeleton } from "@/app/(main)/(web-app)/tests/[testId]/_components/test-runs-card-skeleton";
import TestRunsFilter from "@/app/(main)/(web-app)/tests/[testId]/_components/test-runs-filter";
import { Badge } from "@/components/ui/badge";

export default function BatchTestRunsSection({ batch }: { batch: BatchTest }) {
  const { getTestRunsForBatchTest } = useBatchTests();
  const batchStore = useBatchTestsStore();
  const [runs, setRuns] = useState<import("@/hooks/use-testruns").TestRun[] | null>(null);
  const [filters, setFilters] = useState({ result: 'any', run: 'any', persona: 'any', testName: 'any' });

  const activeBadges = () => {
    const arr: { label: string; key: string }[] = [];
    if (filters.result !== 'any') arr.push({ label: `Result: ${filters.result}`, key: 'result' });
    if (filters.run !== 'any') arr.push({ label: `Run: ${filters.run}`, key: 'run' });
    if (filters.persona !== 'any') arr.push({ label: `Persona: ${filters.persona}`, key: 'persona' });
    if (filters.testName !== 'any') arr.push({ label: `Test: ${filters.testName}`, key: 'testName' });
    return arr;
  };
  const [loading, setLoading] = useState(false);

  // Load from cache first, then refresh
  useEffect(() => {
    if (!batch?._id) return;
    let mounted = true;
    const cached = batchStore.getTestRunsForBatchTest(batch._id);
    if (cached) {
      setRuns(cached as unknown as import("@/hooks/use-testruns").TestRun[]);
    }

    (async () => {
      if (!cached) setLoading(true);
      try {
        const fresh = await getTestRunsForBatchTest(batch._id, true);
        if (mounted) {
          setRuns(fresh as unknown as import("@/hooks/use-testruns").TestRun[]);
          // The hook already cached them in store.
        }
      } catch {
        if (mounted && !cached) setRuns([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, [batch._id, getTestRunsForBatchTest]);

  // keep local state in sync when store updates (e.g., deletes or real-time additions)
  const storeRuns = useBatchTestsStore(state => state.batchTestRuns[batch._id]);
  useEffect(() => {
    if (storeRuns !== undefined && storeRuns !== null) {
      setRuns(storeRuns as unknown as import("@/hooks/use-testruns").TestRun[]);
    }
  }, [storeRuns]);

  if (loading && runs === null) {
    return <TestRunsCardSkeleton />;
  }

  if (!loading && (!runs || runs.length === 0)) {
    return <p className="text-sm text-muted-foreground px-4">No runs yet.</p>;
  }

  // Filtering logic mirrors the single-test view.
  const activeRuns = runs ?? [];
  const personaOptions = Array.from(new Set(activeRuns.map(r => (r as { personaName?: string }).personaName).filter(Boolean))) as string[];

  const filteredUnsorted = activeRuns.filter(r => {
    if (filters.result !== 'any' && r.status !== filters.result) return false;
    if (filters.run !== 'any' && r.browserUseStatus !== filters.run) return false;
    const pName = (r as { personaName?: string }).personaName;
    if (filters.persona !== 'any' && pName !== filters.persona) return false;
    if (filters.testName !== 'any' && (r as { testName?: string }).testName !== filters.testName) return false;
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
        <h2 className="text-xl font-semibold">Batch test runs · {(filtered ?? []).length}</h2>
        <TestRunsFilter personaOptions={personaOptions} filters={filters} onChange={setFilters} />
      </section>
      {activeBadges().length > 0 && (
        <section className="flex flex-wrap gap-2 py-1">
          <p className="text-muted-foreground text-sm">Filters:</p>
          {activeBadges().map(b => (
            <Badge key={b.key} variant="outline" className="text-xs">{b.label}</Badge>
          ))}
        </section>
      )}
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