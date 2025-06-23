"use client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProjectBadge } from "@/components/ui/project-badge";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useBatchTestRuns } from "@/hooks/use-batch-test-runs";
import { toast } from "sonner";
import { BatchTest } from "@/hooks/use-batch-tests";
import Link from "next/link";
import { useBatchTests } from "@/hooks/use-batch-tests";
import { BatchTestCardActionsDropdown } from "../../../_components/batch-test-card-actions-dropdown";

export default function DetailsSection({ batch }: { batch: BatchTest }) {
  const { startBatchTestRuns } = useBatchTestRuns();
  const [running, setRunning] = useState(false);

  const handleRun = async () => {
    if (running) return;
    setRunning(true);
    try {
      await startBatchTestRuns(batch._id);
      toast.success("Batch test runs started");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to start runs");
    } finally {
      setRunning(false);
    }
  };

  const testObj = typeof batch.test === "object" && batch.test ? (batch.test as { name?: string; description?: string }) : null;
  const testName = testObj?.name;
  const testDescription = testObj?.description;

  const projectName = typeof batch.project === "object" && batch.project ? (batch.project as { name?: string }).name : undefined;
  const batchPersonaObj = typeof batch.batchPersona === "object" && batch.batchPersona ? (batch.batchPersona as { _id: string; name?: string }) : null;
  const batchPersonaName = batchPersonaObj?.name;
  const batchPersonaId = batchPersonaObj?._id ?? (typeof batch.batchPersona === "string" ? batch.batchPersona : undefined);

  const successfulRuns = (batch as { successfulRuns?: number }).successfulRuns ?? 0;
  const failedRuns = (batch as { failedRuns?: number }).failedRuns ?? 0;
  const totalRuns = successfulRuns + failedRuns;

  // actions for dropdown
  const { moveBatchTestToTrash, deleteBatchTest } = useBatchTests();

  return (
    <article className="p-4 space-y-6" aria-labelledby="batch-details-heading">
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <section className="space-y-1 flex-1 min-w-0">
          <h2 id="batch-details-heading" className="text-xl font-semibold leading-tight truncate flex items-center gap-2">
            <span>{testName ?? "Batch Test"}</span>
            <Badge variant="default" className="uppercase">batch</Badge>
          </h2>
          {testDescription && (
            <p className="text-sm text-muted-foreground max-w-prose line-clamp-2">
              {testDescription}
            </p>
          )}
        </section>
        <section className="flex items-center gap-4 shrink-0">
          <BatchTestCardActionsDropdown
            batchTestId={batch._id}
            actions={{ moveToTrash: moveBatchTestToTrash, deleteBatchTest }}
            showOpen={false}
          />
          <Button onClick={handleRun} variant="secondary" disabled={running} className="gap-1">
            {running && <Loader2 className="w-4 h-4 animate-spin" />}
            Run batch
          </Button>
        </section>
      </header>
      <Separator />

      {/* Project & Batch personas */}
      <section className="flex flex-col md:flex-row gap-6">
        {/* Project */}
        <div className="space-y-2 w-full md:w-1/3">
          <h3 className="text-sm font-medium text-muted-foreground">Project</h3>
          {projectName ? <ProjectBadge name={projectName} /> : <span className="text-sm text-muted-foreground">–</span>}
        </div>
        {/* Batch Personas */}
        <div className="space-y-2 flex-1">
          <h3 className="text-sm font-medium text-muted-foreground">Batch personas</h3>
          <div className="flex flex-wrap items-center gap-2">
            {batchPersonaName && batchPersonaId ? (
              <Link
                href={`/personas/batch/${batchPersonaId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium border rounded-md hover:underline"
              >
                {batchPersonaName}
              </Link>
            ) : (
              <span className="text-sm text-muted-foreground">–</span>
            )}
          </div>
        </div>
      </section>

      <Separator />

      {/* Run statistics */}
      <footer className="flex items-center gap-2 flex-wrap">
        <Badge variant="secondary" className="px-1.5 py-0 text-xs bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
          ✓ {successfulRuns}
        </Badge>
        <Badge variant="secondary" className="px-1.5 py-0 text-xs bg-red-500/10 text-red-700 dark:text-red-400">
          ✗ {failedRuns}
        </Badge>
        {totalRuns > 0 && (
          <Badge variant="secondary" className="px-1.5 py-0 text-xs bg-primary/10 text-primary-foreground dark:text-primary">
            {totalRuns} runs
          </Badge>
        )}
      </footer>
    </article>
  );
} 