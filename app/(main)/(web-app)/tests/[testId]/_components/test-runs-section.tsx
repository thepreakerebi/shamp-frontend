"use client";
import { useEffect, useState } from "react";
import { Test, TestRunSummary } from "@/hooks/use-tests";
import { useTests } from "@/hooks/use-tests";
import { useTestRuns, type TestRun } from "@/hooks/use-testruns";
import { useTestRunsStore } from "@/lib/store/testruns";
import { useTestsStore } from "@/lib/store/tests";
import { TestRunCard } from "./test-run-card";
import { TestRunsCardSkeleton } from "./test-runs-card-skeleton";
import TestRunsFilter from "./test-runs-filter";

export default function TestRunsSection({ test }: { test: Test }) {
  const { getTestRunsForTest } = useTests();
  const { testRuns: storeRuns } = useTestRuns();
  const { addTestRunToList } = useTestRunsStore();
  const testsStore = useTestsStore();
  const [runs, setRuns] = useState<TestRunSummary[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ result: 'any', run: 'any', persona: 'any' });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!test?._id) return;
    let mounted = true;
    const cached = testsStore.getTestRunsForTest(test._id);
    if (cached) {
      setRuns(cached as unknown as TestRunSummary[]);
    }

    // Always fetch a fresh list so we don't miss runs added optimistically from
    // other pages (e.g. the Schedule Run page).
    (async () => {
      // Show a skeleton only if there was no cache to display.
      if (!cached) setLoading(true);
      try {
        // Force refresh to bypass any potentially stale cache.
        const data = await getTestRunsForTest(test._id, true);
        if (mounted) {
          setRuns(data);
          data.forEach(r => addTestRunToList(r as unknown as TestRun));
        }
      } catch {
        if (mounted) setRuns([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [test?._id]);

  // Sync statuses/deletions: update only runs that already belong to this test
  useEffect(() => {
    if (!storeRuns || !runs) return;
    setRuns(prev => {
      if (!prev) return prev;
      const map = new Map(storeRuns.map(r => [r._id, r]));
      return prev.map(r => (map.has(r._id) ? (map.get(r._id) as TestRunSummary) : r));
    });
  }, [storeRuns]);

  const displayRuns = runs;

  const filtered = (displayRuns ?? []).filter(r => {
    if (filters.result !== 'any' && r.status !== filters.result) return false;
    if (filters.run !== 'any' && r.browserUseStatus !== filters.run) return false;
    const pName = (r as { personaName?: string }).personaName;
    if (filters.persona !== 'any' && pName !== filters.persona) return false;
    return true;
  });

  const personaOptions = Array.from(new Set((displayRuns ?? []).map(r=>(r as { personaName?: string }).personaName).filter(Boolean))) as string[];

  return (
    <section className="p-4 space-y-4">
      <section className="sticky top-[60px] z-10 bg-background flex items-center justify-between gap-4 py-2">
        <h2 className="text-xl font-semibold">Test runs · {(displayRuns ?? []).length}</h2>
        <TestRunsFilter personaOptions={personaOptions} filters={filters} onChange={setFilters} />
      </section>
      {loading && <TestRunsCardSkeleton />}
      {!loading && (filtered.length === 0) && (
        <p className="text-muted-foreground text-sm">No runs yet.</p>
      )}
      {!loading && filtered.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(run => (
            <TestRunCard key={run._id} run={run} />
          ))}
        </div>
      )}
    </section>
  );
} 