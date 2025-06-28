"use client";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import React from "react";
import { useBatchTests, BatchTest } from "@/hooks/use-batch-tests";
import { useBatchTestsStore } from "@/lib/store/batchTests";
import { BatchTestCardActionsDropdown } from "./batch-test-card-actions-dropdown";
import { Separator } from "@/components/ui/separator";

export function BatchTestCard({ batch }: { batch: BatchTest }) {
  const router = useRouter();
  const { moveBatchTestToTrash, deleteBatchTest } = useBatchTests();
  const batchRunsStore = useBatchTestsStore((s)=> s.batchTestRuns[batch._id]);
  const { getTestRunsForBatchTest } = useBatchTests();
  const [loadingRuns, setLoadingRuns] = React.useState(false);

  // Fetch runs if not in store so counts are correct
  React.useEffect(() => {
    if (batchRunsStore === undefined && !loadingRuns) {
      (async () => {
        setLoadingRuns(true);
        try {
          await getTestRunsForBatchTest(batch._id, true);
        } catch { /* ignore */ }
        setLoadingRuns(false);
      })();
    }
  }, [batchRunsStore, getTestRunsForBatchTest, batch._id, loadingRuns]);

  const handleClick: React.MouseEventHandler<HTMLDivElement> = () => {
    router.push(`/tests/batch/${batch._id}`);
  };

  const dedupRuns = batchRunsStore ? Array.from(new Map(batchRunsStore.map(r=>[r._id,r])).values()) : undefined;
  const runsCount = dedupRuns ? dedupRuns.length : (loadingRuns ? 0 : (batch.testrunsCount ?? (batch.testruns ? batch.testruns.length : 0)));
  const successfulRuns = dedupRuns ? dedupRuns.filter(r=>r.status==='succeeded').length : (batch.successfulRuns ?? 0);
  const failedRuns = dedupRuns ? dedupRuns.filter(r=>r.status==='failed').length : (batch.failedRuns ?? 0);

  return (
    <section
      role="button"
      onClick={handleClick}
      className={cn(
        "rounded-3xl border dark:border-0 bg-card/80 hover:bg-muted/50 transition-all cursor-pointer flex flex-col p-4 gap-3 relative"
      )}
    >
      <header className="flex items-start gap-3">
        <figure className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-xl font-bold shrink-0" aria-hidden="true">
          {(typeof batch.test === "object" && batch.test && "name" in batch.test ? (batch.test as { name: string }).name : "B")[0]}
        </figure>
        <section className="flex-1 min-w-0">
          <h3 className="font-semibold leading-tight truncate" title={typeof batch.test === "object" && batch.test ? (batch.test as { name: string }).name : "Batch Test"}>
            {typeof batch.test === "object" && batch.test ? (batch.test as { name: string }).name : "Batch Test"}
          </h3>
          {batch.project && typeof batch.project === "object" && 'name' in batch.project && (
            <p className="text-sm text-muted-foreground line-clamp-2" title={(batch.project as { name: string }).name}>
              {(batch.project as { name: string }).name}
            </p>
          )}
        </section>
        <nav onClick={(e)=>e.stopPropagation()} data-stop-row>
          <BatchTestCardActionsDropdown
            batchTestId={batch._id}
            actions={{
              moveToTrash: moveBatchTestToTrash,
              deleteBatchTest,
            }}
          />
        </nav>
      </header>
      <Separator />

      <footer className="flex items-center gap-2 pt-1">
        <Badge variant="secondary" className="px-1.5 py-0 text-xs bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
          ✓ {successfulRuns}
        </Badge>
        <Badge variant="secondary" className="px-1.5 py-0 text-xs bg-red-500/10 text-red-700 dark:text-red-400">
          ✗ {failedRuns}
        </Badge>
        <Badge variant="secondary" className="px-1.5 py-0 text-xs bg-primary/10 dark:bg-primary/20 text-primary-foreground dark:text-neutral-200">
          {loadingRuns && runsCount===0 ? '–' : runsCount} runs
        </Badge>
      </footer>
    </section>
  );
} 