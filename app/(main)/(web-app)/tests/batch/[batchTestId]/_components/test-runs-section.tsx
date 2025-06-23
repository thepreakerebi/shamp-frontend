"use client";
import { BatchTest } from "@/hooks/use-batch-tests";
import { useEffect, useState } from "react";
import { useTestRuns } from "@/hooks/use-testruns";
import { TestRunCard, MinimalRun } from "@/app/(main)/(web-app)/tests/[testId]/_components/test-run-card";
import { TestRunsCardSkeleton } from "@/app/(main)/(web-app)/tests/[testId]/_components/test-runs-card-skeleton";

export default function BatchTestRunsSection({ batch }: { batch: BatchTest }) {
  const { getTestRunStatus } = useTestRuns();
  const [runs, setRuns] = useState<import("@/hooks/use-testruns").TestRun[] | null>(null);

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

  return (
    <section className="p-4 space-y-4">
      <h2 className="text-xl font-semibold">Batch test runs</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {runs.map(run => (
          <TestRunCard key={run._id} run={run as unknown as MinimalRun} />
        ))}
      </div>
    </section>
  );
} 