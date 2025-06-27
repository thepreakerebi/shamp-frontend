"use client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProjectBadge } from "@/components/ui/project-badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, Pause, Play, Square } from "lucide-react";
import { useState, useEffect } from "react";
import { useBatchTestRuns } from "@/hooks/use-batch-test-runs";
import { toast } from "sonner";
import { BatchTest } from "@/hooks/use-batch-tests";
import Link from "next/link";
import { useBatchTests } from "@/hooks/use-batch-tests";
import { BatchTestCardActionsDropdown } from "../../../_components/batch-test-card-actions-dropdown";
import { useBatchTestsStore } from "@/lib/store/batchTests";

export default function DetailsSection({ batch }: { batch: BatchTest }) {
  const { startBatchTestRuns, pauseBatchTestRuns, resumeBatchTestRuns, stopBatchTestRuns } = useBatchTestRuns();
  const [actionLoading, setActionLoading] = useState(false);
  const [batchStatus, setBatchStatus] = useState<'idle' | 'running' | 'paused' | 'stopped' | 'completed'>(batch.status ?? 'idle');

  // Subscribe to live status updates from the global BatchTests store so the
  // badge flips instantly when Socket.IO events arrive elsewhere.
  const liveStatus = useBatchTestsStore((state) => {
    const match = state.batchTests?.find((t) => t._id === batch._id) || state.trashedBatchTests?.find((t) => t._id === batch._id);
    return match?.status;
  });

  // Keep local state in sync with live store updates
  useEffect(() => {
    if (liveStatus && liveStatus !== batchStatus) {
      setBatchStatus(liveStatus);
    }
  }, [liveStatus]);

  // Also sync when parent prop changes (initial load or optimistic updates)
  useEffect(() => {
    if (batch.status && batch.status !== batchStatus) {
      setBatchStatus(batch.status);
    }
  }, [batch.status]);

  const handleRun = async () => {
    if (actionLoading) return;
    setActionLoading(true);
    try {
      await startBatchTestRuns(batch._id);
      toast.success("Batch test runs started");
      setBatchStatus('running');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to start runs");
    } finally {
      setActionLoading(false);
    }
  };

  const handlePause = async () => {
    if (actionLoading) return;
    setActionLoading(true);
    try {
      await pauseBatchTestRuns(batch._id);
      toast.success("Batch test runs paused");
      setBatchStatus('paused');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to pause runs");
    } finally {
      setActionLoading(false);
    }
  };

  const handleResume = async () => {
    if (actionLoading) return;
    setActionLoading(true);
    try {
      await resumeBatchTestRuns(batch._id);
      toast.success("Batch test runs resumed");
      setBatchStatus('running');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to resume runs");
    } finally {
      setActionLoading(false);
    }
  };

  const handleStop = async () => {
    if (actionLoading) return;
    setActionLoading(true);
    try {
      await stopBatchTestRuns(batch._id);
      toast.success("Batch test runs stopped");
      setBatchStatus('stopped');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to stop runs");
    } finally {
      setActionLoading(false);
    }
  };

  // Live batch from store (falls back to prop if not yet in store)
  const liveBatch = useBatchTestsStore((state) =>
    state.batchTests?.find((t) => t._id === batch._id) ||
    state.trashedBatchTests?.find((t) => t._id === batch._id)
  ) ?? batch;

  const testObj = typeof liveBatch.test === "object" && liveBatch.test ? (liveBatch.test as { name?: string; description?: string }) : null;
  const testName = testObj?.name;
  const testDescription = testObj?.description;

  const projectName = typeof liveBatch.project === "object" && liveBatch.project ? (liveBatch.project as { name?: string }).name : undefined;
  const batchPersonaObj = typeof liveBatch.batchPersona === "object" && liveBatch.batchPersona ? (liveBatch.batchPersona as { _id: string; name?: string }) : null;
  const batchPersonaName = batchPersonaObj?.name;
  const batchPersonaId = batchPersonaObj?._id ?? (typeof liveBatch.batchPersona === "string" ? liveBatch.batchPersona : undefined);

  const successfulRuns = (liveBatch as { successfulRuns?: number }).successfulRuns ?? 0;
  const failedRuns = (liveBatch as { failedRuns?: number }).failedRuns ?? 0;
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
          {/* Control buttons */}
          {(batchStatus === 'idle' || batchStatus === 'stopped' || batchStatus === 'completed') && (
            <Button onClick={handleRun} variant="secondary" disabled={actionLoading} className="gap-1">
              {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              Run batch
            </Button>
          )}

          {batchStatus === 'running' && (
            <>
              <Button onClick={handlePause} variant="outline" disabled={actionLoading} className="gap-1">
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Pause className="w-4 h-4" />} Pause
              </Button>
              <Button onClick={handleStop} variant="destructive" disabled={actionLoading} className="gap-1">
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Square className="w-4 h-4" />} Stop
              </Button>
            </>
          )}

          {batchStatus === 'paused' && (
            <>
              <Button onClick={handleResume} variant="outline" disabled={actionLoading} className="gap-1">
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />} Resume
              </Button>
              <Button onClick={handleStop} variant="destructive" disabled={actionLoading} className="gap-1">
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Square className="w-4 h-4" />} Stop
              </Button>
            </>
          )}
          {/* Status badge */}
          {batchStatus === 'running' && (
            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">running</Badge>
          )}
          {batchStatus === 'paused' && (
            <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400">paused</Badge>
          )}
          {batchStatus === 'completed' && (
            <Badge variant="secondary" className="bg-primary/10 text-primary-foreground dark:text-primary">completed</Badge>
          )}
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