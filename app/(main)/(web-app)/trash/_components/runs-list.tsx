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
import type { Persona } from "@/hooks/use-personas";
import { usePersonasStore } from "@/lib/store/personas";

type RunWithPersona = TestRun & { personaName?: string };

export function TrashedRunsList() {
  const {
    trashedTestRuns,
    restoreTestRunFromTrash,
    deleteTestRun,
    emptyTestRunTrash,
    fetchTrashedTestRuns,
  } = useTestRuns();

  const { user, token, currentWorkspaceId } = useAuth();

  const { personas } = usePersonas();
  const personasStorePersonas = usePersonasStore(state => state.personas);
  const addPersonaToList = usePersonasStore(state => state.addPersonaToList);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [runToDelete, setRunToDelete] = useState<TestRun | null>(null);
  const [emptyTrashOpen, setEmptyTrashOpen] = useState(false);
  const [emptyTrashLoading, setEmptyTrashLoading] = useState(false);

  // Build a deduplicated & sorted list of trashed runs once personas may rely on it below
  const uniqueRuns = React.useMemo(() => {
    if (!trashedTestRuns) return [] as TestRun[];

    const map = new Map<string, TestRun>();

    trashedTestRuns.forEach((r) => {
      const id = (r as { _id?: string })._id;
      if (!id) return; // Skip malformed entries
      if (!map.has(id)) map.set(id, r);
    });

    const getTs = (id?: string) => {
      if (!id || id.length < 8) return 0;
      const ts = parseInt(id.substring(0, 8), 16);
      return isNaN(ts) ? 0 : ts;
    };

    return Array.from(map.values()).sort((a, b) => getTs(b._id) - getTs(a._id));
  }, [trashedTestRuns]);

  const [extraPersonaNames, setExtraPersonaNames] = React.useState<Record<string, string>>({});

  // Helper to fetch a persona's name when it's missing from both the run payload
  // and the main personas list.
  const fetchPersonaName = React.useCallback(async (id: string) => {
    if (!token || !currentWorkspaceId) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/personas/${id}`, {
        credentials: "include",
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Workspace-ID": currentWorkspaceId,
        } as Record<string, string>,
      });
      if (!res.ok) return;
      const p: Persona = await res.json();
      // cache avatar and full persona in global store for future cards
      addPersonaToList(p);
      setExtraPersonaNames((prev) => ({ ...prev, [id]: p.name }));
    } catch {/* ignore */}
  }, [token, currentWorkspaceId, addPersonaToList]);

  // Whenever the run list or personas change, ensure we have names for every run.
  React.useEffect(() => {
    const idsToFetch = new Set<string>();
    uniqueRuns.forEach((r) => {
      const pid = (r as { persona?: string }).persona;
      if (!pid) return;
      const nameKnown = (r as { personaName?: string }).personaName || personas?.some(p => p._id === pid) || extraPersonaNames[pid];
      if (!nameKnown) idsToFetch.add(pid);
    });
    idsToFetch.forEach(id => fetchPersonaName(id));
  }, [uniqueRuns, personas, extraPersonaNames, fetchPersonaName]);

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
    if (run.persona) {
      // Primary source: loaded personas list
      const p = (personasStorePersonas ?? personas)?.find(pr => pr._id === run.persona);
      if (p?.name) return p.name;
      // Secondary source: names fetched ad-hoc
      return extraPersonaNames[run.persona];
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

  const getCreatorId = (r: TestRun): string | undefined => {
    if (typeof r.createdBy === 'string') return r.createdBy;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (r.createdBy as any)?._id;
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
        {uniqueRuns.map((run, idx) => {
          const rp = run as RunWithPersona;
          let avatarUrl = rp.persona ? (personasStorePersonas ?? personas)?.find(p=>p._id===rp.persona)?.avatarUrl : undefined;
          if (!avatarUrl) {
            avatarUrl = (rp as { personaAvatarUrl?: string }).personaAvatarUrl;
          }
          return (
          <article key={run._id || idx} className="rounded-3xl border dark:border-0 bg-card/80 p-4 flex flex-col gap-3">
            <header className="flex items-start gap-3">
              <figure className="w-10 h-10 rounded-xl overflow-hidden bg-muted flex items-center justify-center text-xl font-bold shrink-0" aria-hidden="true">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt={getPersonaName(rp) ?? "Persona avatar"} className="w-full h-full object-cover" />
                ) : (
                  (getPersonaName(rp)?.[0] ?? "R").toUpperCase()
                )}
              </figure>
              <section className="flex-1 min-w-0">
                <h3 className="font-semibold leading-tight truncate" title={getPersonaName(rp) ?? run._id}>{getPersonaName(rp) ?? run._id}</h3>
                {rp.testName && (
                  <p className="text-sm text-muted-foreground truncate" title={rp.testName}>{rp.testName}</p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  {statusBadge(run.status)}
                  
                </div>
                
              </section>
              {(user?.currentWorkspaceRole === 'admin' || getCreatorId(run) === user?._id) && (
                <nav onClick={e=>e.stopPropagation()} data-stop-row>
                  <TrashCardActionsDropdown onRestore={() => handleRestore(run)} onDelete={() => promptDelete(run)} />
                </nav>
              )}
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