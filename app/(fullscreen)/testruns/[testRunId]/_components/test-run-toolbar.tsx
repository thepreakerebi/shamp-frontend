import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTestRuns, TestRunStatus } from "@/hooks/use-testruns";
import { PauseIcon, PlayIcon, StopCircleIcon } from "lucide-react";
import { toast } from "sonner";

interface Props {
  run: TestRunStatus;
}

export function TestRunToolbar({ run }: Props) {
  const { pauseTestRun, resumeTestRun, stopTestRun } = useTestRuns();

  if (run.browserUseStatus !== "running" && run.browserUseStatus !== "paused") return null;

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      succeeded: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
      failed: "bg-red-500/10 text-red-700 dark:text-red-400",
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
  const onPause = async () => {
    try {
      await pauseTestRun(run._id);
      toast.success("Test run paused");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to pause test run");
    }
  };
  const onResume = async () => {
    try {
      await resumeTestRun(run._id);
      toast.success("Test run resumed");
    } catch {
      toast.error("Failed to resume test run");
    }
  };
  const onStop = async () => {
    try {
      await stopTestRun(run._id);
      toast.success("Test run stopped");
    } catch {
      toast.error("Failed to stop test run");
    }
  };

  return (
    <section className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-6 bg-card/90 border rounded-full px-4 py-2 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-card/60">
      {/* Status section */}
      <div className="flex items-center gap-2">
        {(["finished", "stopped"].includes(run.browserUseStatus ?? "")) && statusBadge(run.status)}
        {run.status !== "cancelled" && browserStatusBadge(run.browserUseStatus)}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
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
        {run.browserUseStatus === "paused" && (
          <>
            <Button size="icon" variant="ghost" onClick={onResume} aria-label="Resume test run">
              <PlayIcon className="w-4 h-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={onStop} aria-label="Stop test run">
              <StopCircleIcon className="w-4 h-4" />
            </Button>
          </>
        )}
      </div>
    </section>
  );
} 