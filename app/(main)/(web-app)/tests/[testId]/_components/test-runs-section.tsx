"use client";
import { useEffect, useState } from "react";
import { Test, TestRunSummary } from "@/hooks/use-tests";
import { useTests } from "@/hooks/use-tests";
import { TestRunCard } from "./test-run-card";
import { Skeleton } from "@/components/ui/skeleton";

export default function TestRunsSection({ test }: { test: Test }) {
  const { getTestRunsForTest } = useTests();
  const [runs, setRuns] = useState<TestRunSummary[] | null>(null);
  const [loading, setLoading] = useState(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!test?._id) return;
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const data = await getTestRunsForTest(test._id);
        if (mounted) setRuns(data);
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

  return (
    <section className="p-4 space-y-4">
      <h2 className="text-xl font-semibold">Test runs</h2>
      {loading && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-3xl" />
          ))}
        </div>
      )}
      {!loading && runs && runs.length === 0 && (
        <p className="text-muted-foreground text-sm">No runs yet.</p>
      )}
      {!loading && runs && runs.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {runs.map(run => (
            <TestRunCard key={run._id} run={run} />
          ))}
        </div>
      )}
    </section>
  );
} 