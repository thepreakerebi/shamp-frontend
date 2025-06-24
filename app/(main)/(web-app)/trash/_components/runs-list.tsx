"use client";
import { useTestRuns } from "@/hooks/use-testruns";
import type { TestRun } from "@/hooks/use-testruns";
import React, { useState } from "react";
import { TrashCardActionsDropdown } from "@/components/ui/trash-card-actions-dropdown";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";
import { TestRunsCardSkeleton } from "@/app/(main)/(web-app)/tests/[testId]/_components/test-runs-card-skeleton";
import { Badge } from "@/components/ui/badge";
import { usePersonas } from "@/hooks/use-personas";

type RunWithPersona = TestRun & { personaName?: string };

export function TrashedRunsList() {
  const {
    trashedTestRuns,
    restoreTestRunFromTrash,
    deleteTestRun,
  } = useTestRuns();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [runToDelete, setRunToDelete] = useState<TestRun | null>(null);

  const { personas } = usePersonas();

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

  if (!trashedTestRuns) {
    return <TestRunsCardSkeleton count={6} />;
  }

  if (uniqueRuns.length === 0) {
    return <p className="text-muted-foreground p-4">No test runs in trash.</p>;
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
      <header className="px-4 mb-4">
        <h2 className="text-xl font-semibold">Trashed Test Runs</h2>
      </header>

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
    </section>
  );
} 