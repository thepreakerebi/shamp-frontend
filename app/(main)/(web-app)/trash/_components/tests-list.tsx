"use client";
import { useTests, type Test } from "@/hooks/use-tests";
import { useProjects } from "@/hooks/use-projects";
import { useAuth } from "@/lib/auth";
import React, { useState } from "react";
import { TrashCardActionsDropdown } from "@/components/ui/trash-card-actions-dropdown";
import { DeleteTestModal } from "../../tests/_components/delete-test-modal";
import { Button } from "@/components/ui/button";
import { EmptyTestTrashModal } from "./empty-test-trash-modal";
import { toast } from "sonner";
import { TestsCardSkeleton } from "../../tests/_components/tests-card-skeleton";

export function TrashedTestsList() {
  const {
    trashedTests,
    restoreTestFromTrash,
    deleteTest,
    testsLoading,
    emptyTestTrash,
    refetchTrashed,
  } = useTests();
  const { projects } = useProjects(); // for badge name lookup
  const { user } = useAuth();

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [testToDelete, setTestToDelete] = useState<Test | null>(null);
  const [emptyTrashOpen, setEmptyTrashOpen] = useState(false);
  const [emptyTrashLoading, setEmptyTrashLoading] = useState(false);

  const uniqueTests = React.useMemo(() => {
    if (!trashedTests) return [] as Test[];
    const map = new Map<string, Test>();
    trashedTests.forEach(t => {
      if (!map.has(t._id)) map.set(t._id, t);
    });
    const arr = Array.from(map.values());
    // Sort newest first by updatedAt (fallback to ObjectId timestamp)
    const getTs = (test: Test): number => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const anyT = test as any;
      if (anyT.updatedAt) return new Date(anyT.updatedAt).getTime();
      return parseInt(test._id.substring(0, 8), 16) * 1000;
    };
    return arr.sort((a, b) => getTs(b) - getTs(a));
  }, [trashedTests]);

  // Check if user can empty trash
  const canEmptyTrash = React.useMemo(() => {
    if (!user) return false;
    
    // Admin can empty all trash
    if (user.currentWorkspaceRole === 'admin') return true;
    
    // Members can only empty trash if they have trashed tests they created
    if (user.currentWorkspaceRole === 'member') {
      return uniqueTests.some(test => test.createdBy?._id === user._id);
    }
    
    return false;
  }, [user, uniqueTests]);

  const handleRestore = async (test: Test) => {
    try {
      await restoreTestFromTrash(test._id);
      toast.success("Test restored");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to restore test");
    }
  };

  const promptDelete = (test: Test) => {
    setTestToDelete(test);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async (deleteRuns: boolean) => {
    if (!testToDelete) return;
    setDeleteLoading(true);
    try {
      await deleteTest(testToDelete._id, deleteRuns);
      toast.success("Test permanently deleted");
      setDeleteModalOpen(false);
      setTestToDelete(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete test");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleEmptyTrash = async (deleteRuns: boolean) => {
    setEmptyTrashLoading(true);
    try {
      await emptyTestTrash(deleteRuns);
      toast.success("Tests trash emptied");
      setEmptyTrashOpen(false);
      refetchTrashed();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to empty tests trash");
    } finally {
      setEmptyTrashLoading(false);
    }
  };

  if (testsLoading && uniqueTests.length === 0) {
    return <TestsCardSkeleton count={6} />;
  }

  const getProjectName = (projectId?: string): string | undefined => {
    if (!projectId || !projects) return undefined;
    const p = projects.find(pr => pr._id === projectId);
    return p?.name;
  };

  return (
    <section>
      <section className="sticky top-[60px] z-10 bg-background flex items-center justify-between gap-4 py-2 px-4">
        <h2 className="text-xl font-semibold">Trashed Tests · {uniqueTests.length}</h2>
        {uniqueTests.length > 0 && canEmptyTrash && (
          <Button 
            variant="outline" 
            onClick={() => setEmptyTrashOpen(true)}
            disabled={emptyTrashLoading}
          >
            Empty tests trash
          </Button>
        )}
      </section>

      {uniqueTests.length === 0 ? (
        <p className="text-muted-foreground p-4">No tests in trash.</p>
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 p-4" aria-label="Trashed tests list">
          {uniqueTests.map(test => (
            <article key={test._id} className="rounded-3xl border dark:border-0 bg-card/80 p-4 flex flex-col gap-3">
              <header className="flex items-start gap-3">
                <figure className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-xl font-bold shrink-0" aria-hidden="true">
                  {test.name?.[0]?.toUpperCase() || "T"}
                </figure>
                <section className="flex-1 min-w-0">
                  <h3 className="font-semibold leading-tight truncate" title={test.name}>{test.name}</h3>
                  {test.description && <p className="text-sm text-muted-foreground line-clamp-2" title={test.description}>{test.description}</p>}
                </section>
                {(user?.currentWorkspaceRole === 'admin' || test.createdBy?._id === user?._id) && (
                  <nav onClick={(e)=>e.stopPropagation()} data-stop-row>
                    <TrashCardActionsDropdown onRestore={() => handleRestore(test)} onDelete={() => promptDelete(test)} />
                  </nav>
                )}
              </header>

              <section className="flex flex-wrap items-center gap-2 mt-auto">
                {getProjectName(typeof test.project === "string" ? test.project : undefined) && (
                  <span className="text-xs bg-muted px-2 py-0.5 rounded-md">{getProjectName(test.project as string)}</span>
                )}
                {Array.isArray(test.personaNames) && test.personaNames[0] && (
                  <span className="text-xs bg-muted px-2 py-0.5 rounded-md">{test.personaNames[0]}</span>
                )}
              </section>
            </article>
          ))}
        </section>
      )}

      <DeleteTestModal
        open={deleteModalOpen}
        setOpen={setDeleteModalOpen}
        testName={testToDelete?.name ?? null}
        onConfirm={confirmDelete}
        loading={deleteLoading}
      />

      {/* Empty trash confirmation */}
      <EmptyTestTrashModal
        open={emptyTrashOpen}
        setOpen={setEmptyTrashOpen}
        onConfirm={handleEmptyTrash}
        loading={emptyTrashLoading}
      />
    </section>
  );
} 