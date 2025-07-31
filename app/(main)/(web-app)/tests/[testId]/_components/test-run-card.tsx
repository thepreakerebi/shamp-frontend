"use client";
import { TestRunSummary } from "@/hooks/use-tests";
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { PauseIcon, PlayIcon, StopCircleIcon } from "lucide-react";
import { useTestRuns } from "@/hooks/use-testruns";
import { TestRunCardActionsDropdown } from "@/app/(main)/(web-app)/tests/[testId]/_components/test-run-card-actions-dropdown";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { format } from "date-fns";
import { useAuth } from "@/lib/auth";
import { canTrashTestRun } from "@/hooks/use-testruns";
import { usePersonasStore } from "@/lib/store/personas";
// import React from "react"; // video badge logic temporarily disabled

type FullRunWithPersona = import("@/hooks/use-testruns").TestRun & { personaName?: string };
export type MinimalRun = TestRunSummary | FullRunWithPersona;

export function TestRunCard({ run }: { run: MinimalRun }) {
  const router = useRouter();
  const {
    pauseTestRun,
    resumeTestRun,
    stopTestRun,
    deleteTestRun,
    moveTestRunToTrash,
  } = useTestRuns();
  const [loading, setLoading] = React.useState<"pausing" | "resuming" | "stopping" | null>(null);

  // Look up persona avatar URL (backend may also provide it directly on the run)
  const personaAvatarUrlFromStore = usePersonasStore(
    (state) => state.personas?.find((p) => p._id === (run as { persona?: string }).persona)?.avatarUrl,
  );
  const avatarUrl = (run as { personaAvatarUrl?: string }).personaAvatarUrl || personaAvatarUrlFromStore;

  // Store updater to add persona when fetched on-demand
  const addPersonaToList = usePersonasStore(state => state.addPersonaToList);

  const { user, token, currentWorkspaceId } = useAuth();

  // On first render, if avatar is missing but we know persona ID, fetch it once
  React.useEffect(() => {
    const personaId = (run as { persona?: string }).persona;
    if (avatarUrl || !personaId || !token || !currentWorkspaceId) return;
    (async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/personas/${personaId}`, {
          credentials: "include",
          headers: {
            Authorization: `Bearer ${token}`,
            "X-Workspace-ID": currentWorkspaceId,
          } as Record<string, string>,
        });
        if (!res.ok) return;
        const persona = await res.json();
        addPersonaToList(persona);
      } catch {/* ignore */}
    })();
    // We only want to run this when avatarUrl is falsey initially
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [avatarUrl, token, currentWorkspaceId, addPersonaToList]);

  const canTrash = React.useMemo(() => {
    // Cast to full TestRun type for permission check
    const fullRun = run as unknown as import("@/hooks/use-testruns").TestRun;
    return canTrashTestRun(fullRun, user);
  }, [run._id, user?._id, user?.currentWorkspaceRole]);

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
      cancelled: "bg-gray-500/10 text-gray-700 dark:text-gray-400",
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
    setLoading("pausing");
    try {
      await pauseTestRun(run._id);
      toast.success("Test run paused");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to pause test run");
    } finally {
      setLoading(null);
    }
  };
  const onResume = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setLoading("resuming");
    try {
      await resumeTestRun(run._id);
      toast.success("Test run resumed");
    } catch {
    } finally {
      setLoading(null);
    }
  };
  const onStop = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setLoading("stopping");
    try {
      await stopTestRun(run._id);
      toast.success("Test run stopped");
    } catch {
    } finally {
      setLoading(null);
    }
  };

  const runWithTest = run as unknown as { test?: string | { _id?: string; name?: string }; createdBy?: string };
  const testName = (() => {
    const runRecord = run as unknown as Record<string, unknown>;
    if (typeof runRecord.testName === 'string') return runRecord.testName;
    const tProp = runWithTest.test;
    if (tProp && typeof tProp === 'object' && 'name' in tProp) {
      return (tProp as { name?: string }).name;
    }
    return undefined;
  })();
  const canEditSchedule = run.status === 'pending' && (
    user?.currentWorkspaceRole === 'admin' || runWithTest.createdBy === user?._id
  );
  const editPath = canEditSchedule && runWithTest.test ? `/tests/${runWithTest.test}/schedule-run/${run._id}` : undefined;

  return (
    <section
      role={run.status === 'pending' ? undefined : 'button'}
      onClick={handleOpen}
      className={cn("rounded-3xl border dark:border-0 bg-card/80 transition-all flex flex-col p-4 gap-3 relative", run.status === 'pending' ? 'cursor-default' : 'hover:bg-muted/50 cursor-pointer')}
    >
      {loading && (
        <Badge variant="secondary" className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs">
          {loading === "pausing" ? "Pausing run..." : loading === "resuming" ? "Resuming run..." : "Stopping run..."}
        </Badge>
      )}
      {/* Header */}
      <header className="flex items-start gap-3">
        {/* Persona avatar */}
        <figure
          className="w-10 h-10 rounded-xl overflow-hidden bg-muted flex items-center justify-center text-xl font-bold shrink-0"
          aria-hidden="true"
        >
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt={run.personaName ?? "Persona avatar"}
              className="w-full h-full object-cover"
            />
          ) : (
            run.personaName?.[0]?.toUpperCase() || "P"
          )}
        </figure>
        <section className="flex-1 min-w-0">
          <h3 className="font-semibold leading-tight truncate" title={run.personaName}>
            {run.personaName}
          </h3>
          {testName && (
            <p className="text-sm text-muted-foreground truncate" title={testName}>{testName}</p>
          )}
          {/* Main status / browser badges */}
          <div className="flex items-center gap-2 mt-1">
            {run.status === 'pending' && statusBadge('pending')}
            {['stopped', 'finished'].includes((run.browserUseStatus ?? '')) && statusBadge(run.status)}
            {run.status !== 'cancelled' && !['stopped', 'finished'].includes((run.browserUseStatus ?? '')) && browserStatusBadge(run.browserUseStatus)}
          </div>
          {run.status === 'pending' && run.scheduledFor && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Runs {format(new Date(run.scheduledFor), "p · MMM dd")}
            </p>
          )}
          {/* Video status badge disabled for now */}
        </section>
        <nav onClick={(e) => e.stopPropagation()} data-stop-row>
          <TestRunCardActionsDropdown
            runId={run._id}
            runPersonaName={run.personaName}
            actions={{ deleteTestRun, moveTestRunToTrash }}
            showOpenOptions={run.status !== 'pending'}
            editPath={editPath}
            showTrash={canTrash}
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