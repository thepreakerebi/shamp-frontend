"use client";
import { useEffect, useState } from "react";
import { Test, TestRunSummary } from "@/hooks/use-tests";
import { useTests } from "@/hooks/use-tests";
import { useTestRuns, type TestRun } from "@/hooks/use-testruns";
import { useTestRunsStore } from "@/lib/store/testruns";
import { useTestsStore } from "@/lib/store/tests";
import { TestRunCard } from "./test-run-card";
import { TestRunsCardSkeleton } from "./test-runs-card-skeleton";

export default function TestRunsSection({ test }: { test: Test }) {
  const { getTestRunsForTest } = useTests();
  const { testRuns: storeRuns } = useTestRuns();
  const { setTestRuns } = useTestRunsStore();
  const testsStore = useTestsStore();
  const [runs, setRuns] = useState<TestRunSummary[] | null>(null);
  const [loading, setLoading] = useState(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!test?._id) return;
    let mounted = true;
    const cached = testsStore.getTestRunsForTest(test._id);
    if (cached) {
      setRuns(cached as unknown as TestRunSummary[]);
    }
    (async () => {
      if (!cached) setLoading(true);
      try {
        const data = await getTestRunsForTest(test._id);
        if (mounted) {
          setRuns(data);
          setTestRuns(data as unknown as TestRun[]);
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

  const displayRuns = storeRuns !== null ? storeRuns : runs;

  return (
    <section className="p-4 space-y-4">
      <h2 className="text-xl font-semibold">Test runs</h2>
      {loading && <TestRunsCardSkeleton />}
      {!loading && (displayRuns?.length ?? 0) === 0 && (
        <p className="text-muted-foreground text-sm">No runs yet.</p>
      )}
      {!loading && displayRuns && displayRuns.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayRuns.map(run => (
            <TestRunCard key={run._id} run={run} />
          ))}
        </div>
      )}
    </section>
  );
} 