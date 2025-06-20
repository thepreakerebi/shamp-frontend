"use client";
import { TestRunSummary } from "@/hooks/use-tests";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { PauseIcon, PlayIcon, StopCircleIcon } from "lucide-react";
import { useTestRuns } from "@/hooks/use-testruns";
import { TestRunCardActionsDropdown } from "@/app/(main)/(web-app)/tests/[testId]/_components/test-run-card-actions-dropdown";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
// import React from "react"; // video badge logic temporarily disabled

export function TestRunCard({ run }: { run: TestRunSummary }) {
  const router = useRouter();
  const {
    pauseTestRun,
    resumeTestRun,
    stopTestRun,
    deleteTestRun,
    moveTestRunToTrash,
  } = useTestRuns();

  // Handle navigation
  const handleOpen: React.MouseEventHandler<HTMLDivElement> = () => {
    if (run.status === 'pending') return; // Non-clickable for scheduled runs
    router.push(`/testruns/${run._id}`);
  };

  // Status badge helpers
  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      succeeded: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
      failed: "bg-red-500/10 text-red-700 dark:text-red-400",
      pending: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
    };
    const cls = map[status] ?? "bg-muted text-muted-foreground";
    return (
      <Badge variant="secondary" className={cn("px-1.5 py-0 text-xs", cls)}>
        {status}
      </Badge>
    );
  };

  const browserStatusBadge = (status?: string) => {
    if (!status) return null;
    const running = status === "running";
    return (
      <Badge variant="outline" className="text-xs whitespace-nowrap flex items-center gap-1">
        {running && (
          <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>
        )}
        {status}
      </Badge>
    );
  };

  // Control handlers
  const onPause = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await pauseTestRun(run._id);
      toast.success("Test run paused");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to pause test run");
    }
  };
  const onResume = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await resumeTestRun(run._id);
      toast.success("Test run resumed");
    } catch {}
  };
  const onStop = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await stopTestRun(run._id);
      toast.success("Test run stopped");
    } catch {}
  };

  return (
    <section
      role={run.status === 'pending' ? undefined : 'button'}
      onClick={handleOpen}
      className={cn("rounded-3xl border dark:border-0 bg-card/80 transition-all flex flex-col p-4 gap-3 relative", run.status === 'pending' ? 'cursor-default' : 'hover:bg-muted/50 cursor-pointer')}
    >
      {/* Header */}
      <header className="flex items-start gap-3">
        <figure
          className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-xl font-bold shrink-0"
          aria-hidden="true"
        >
          {run.personaName?.[0]?.toUpperCase() || "P"}
        </figure>
        <section className="flex-1 min-w-0">
          <h3 className="font-semibold leading-tight truncate" title={run.personaName}>
            {run.personaName}
          </h3>
          {/* Main status / browser badges */}
          <div className="flex items-center gap-2 mt-1">
            {run.status === 'pending' ? statusBadge('pending') : (["finished", "stopped"].includes(run.browserUseStatus ?? "")) && statusBadge(run.status)}
            {run.status !== 'cancelled' && browserStatusBadge(run.browserUseStatus)}
          </div>
          {/* Video status badge disabled for now */}
        </section>
        <nav onClick={(e) => e.stopPropagation()} data-stop-row>
          <TestRunCardActionsDropdown
            runId={run._id}
            runPersonaName={run.personaName}
            actions={{ deleteTestRun, moveTestRunToTrash }}
          />
        </nav>
      </header>

      {(run.browserUseStatus === "running" || run.browserUseStatus === "paused") && <Separator />}

      {/* Controls */}
      <footer className="flex items-center gap-2 mt-auto pt-1">
        {run.browserUseStatus === "running" && (
          <>
            <Button size="icon" variant="ghost" onClick={onPause} aria-label="Pause test run">
              <PauseIcon className="w-4 h-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={onStop} aria-label="Stop test run">
              <StopCircleIcon className="w-4 h-4" />
            </Button>
          </>
        )}
        {(run.browserUseStatus === "cancelled" || run.browserUseStatus === "paused") && (
          <Button size="icon" variant="ghost" onClick={onResume} aria-label="Resume test run">
            <PlayIcon className="w-4 h-4" />
          </Button>
        )}
        {run.browserUseStatus === "paused" && (
          <Button
            size="icon"
            variant="ghost"
            onClick={onStop}
            aria-label="Stop test run"
          >
            <StopCircleIcon className="w-4 h-4" />
          </Button>
        )}
      </footer>
    </section>
  );
} 