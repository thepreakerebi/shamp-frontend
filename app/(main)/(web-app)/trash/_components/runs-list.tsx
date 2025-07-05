"use client";
import { useTestRuns } from "@/hooks/use-testruns";
import type { TestRun } from "@/hooks/use-testruns";
import React, { useState } from "react";
import { TrashCardActionsDropdown } from "@/components/ui/trash-card-actions-dropdown";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { TestRunsCardSkeleton } from "@/app/(main)/(web-app)/tests/[testId]/_components/test-runs-card-skeleton";
import { Badge } from "@/components/ui/badge";
import { usePersonas } from "@/hooks/use-personas";
import { useAuth } from "@/lib/auth";

type RunWithPersona = TestRun & { personaName?: string };

export function TrashedRunsList() {
  const {
    trashedTestRuns,
    restoreTestRunFromTrash,
    deleteTestRun,
    emptyTestRunTrash,
    fetchTrashedTestRuns,
  } = useTestRuns();

  const { user } = useAuth();

  const { personas } = usePersonas();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [runToDelete, setRunToDelete] = useState<TestRun | null>(null);
  const [emptyTrashOpen, setEmptyTrashOpen] = useState(false);
  const [emptyTrashLoading, setEmptyTrashLoading] = useState(false);

  const uniqueRuns = React.useMemo(() => {
    if (!trashedTestRuns) return [] as TestRun[];
    const map = new Map<string, TestRun>();
    trashedTestRuns.forEach(r => {
      if (!map.has(r._id)) map.set(r._id, r);
    });
    // Sort newest first based on ObjectId timestamp
    const getTs = (id: string) => parseInt(id.substring(0, 8), 16);
    return Array.from(map.values()).sort((a,b)=> getTs(b._id) - getTs(a._id));
  }, [trashedTestRuns]);

  // Check if user can empty trash
  const canEmptyTrash = React.useMemo(() => {
    if (!user) return false;
    if (user.currentWorkspaceRole === 'admin') return true;
    if (user.currentWorkspaceRole === 'member') {
      return uniqueRuns.some(run => run.createdBy?._id === user._id);
    }
    return false;
  }, [user, uniqueRuns]);

  const getPersonaName = (run: RunWithPersona): string | undefined => {
    if (run.personaName) return run.personaName;
    if (run.persona && personas) {
      const p = personas.find(pr=> pr._id === run.persona);
      return p?.name;
    }
    return undefined;
  };

  const handleRestore = async (run: TestRun) => {
    try {
      await restoreTestRunFromTrash(run._id);
      toast.success("Test run restored");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to restore test run");
    }
  };

  const promptDelete = (run: TestRun) => {
    setRunToDelete(run);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!runToDelete) return;
    setConfirmLoading(true);
    try {
      await deleteTestRun(runToDelete._id);
      toast.success("Test run permanently deleted");
      setConfirmOpen(false);
      setRunToDelete(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete test run");
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleEmptyTrash = async () => {
    setEmptyTrashLoading(true);
    try {
      await emptyTestRunTrash();
      toast.success("Test runs trash emptied");
      setEmptyTrashOpen(false);
      fetchTrashedTestRuns();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to empty test runs trash");
    } finally {
      setEmptyTrashLoading(false);
    }
  };

  if (!trashedTestRuns) {
    return <TestRunsCardSkeleton count={6} />;
  }

  const statusBadge = (status: string) => {
    const map: Record<string,string> = {
      succeeded: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
      failed: "bg-red-500/10 text-red-700 dark:text-red-400",
      cancelled: "bg-zinc-500/10 text-zinc-700 dark:text-zinc-400",
    };
    const cls = map[status] ?? "bg-muted text-muted-foreground";
    return <Badge variant="secondary" className={`px-1.5 py-0 text-xs ${cls}`}>{status}</Badge>;
  };

  return (
    <section>
      <section className="sticky top-[60px] z-10 bg-background flex items-center justify-between gap-4 py-2 px-4">
        <h2 className="text-xl font-semibold">Trashed Test Runs · {uniqueRuns.length}</h2>
        {uniqueRuns.length > 0 && canEmptyTrash && (
          <Button 
            variant="outline" 
            onClick={() => setEmptyTrashOpen(true)}
            disabled={emptyTrashLoading}
          >
            Empty test runs trash
          </Button>
        )}
      </section>

      {uniqueRuns.length === 0 ? (
        <p className="text-muted-foreground p-4">No test runs in trash.</p>
      ) : (
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 p-4" aria-label="Trashed test runs list">
        {uniqueRuns.map(run => {
          const rp = run as RunWithPersona;
          return (
          <article key={run._id} className="rounded-3xl border dark:border-0 bg-card/80 p-4 flex flex-col gap-3">
            <header className="flex items-start gap-3">
              <figure className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-xl font-bold shrink-0" aria-hidden="true">
                {(getPersonaName(rp)?.[0] ?? "R").toUpperCase()}
              </figure>
              <section className="flex-1 min-w-0">
                <h3 className="font-semibold leading-tight truncate" title={getPersonaName(rp) ?? run._id}>{getPersonaName(rp) ?? run._id}</h3>
                <div className="flex items-center gap-2 mt-1">
                  {statusBadge(run.status)}
                  {run.browserUseStatus && <Badge variant="outline" className="text-xs whitespace-nowrap">{run.browserUseStatus}</Badge>}
                </div>
                
              </section>
              <nav onClick={e=>e.stopPropagation()} data-stop-row>
                <TrashCardActionsDropdown onRestore={() => handleRestore(run)} onDelete={() => promptDelete(run)} />
              </nav>
            </header>
          </article>
        );})}
      </section>
      )}

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete Test Run Permanently"
        description={`Are you sure you want to permanently delete this test run? This action cannot be undone.`}
        confirmLabel="Delete"
        confirmVariant="destructive"
        loading={confirmLoading}
        onConfirm={confirmDelete}
      />

      {/* Empty trash confirmation */}
      <ConfirmDialog
        open={emptyTrashOpen}
        onOpenChange={setEmptyTrashOpen}
        title="Empty Test Runs Trash"
        description="Are you sure you want to permanently delete all trashed test runs? This action cannot be undone."
        confirmLabel="Empty trash"
        confirmVariant="destructive"
        loading={emptyTrashLoading}
        onConfirm={handleEmptyTrash}
      />
    </section>
  );
} 