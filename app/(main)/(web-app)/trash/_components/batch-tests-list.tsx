"use client";

import React, { useState } from "react";
import { useBatchTests, type BatchTest } from "@/hooks/use-batch-tests";
import { useBatchTestsStore } from "@/lib/store/batchTests";
import { useProjects } from "@/hooks/use-projects";
import { TrashCardActionsDropdown } from "@/components/ui/trash-card-actions-dropdown";
import { DeleteBatchTestModal } from "../../tests/_components/delete-batch-test-modal";
import { toast } from "sonner";
import { BatchTestsCardSkeleton } from "../../tests/_components/batch-tests-card-skeleton";

export function TrashedBatchTestsList() {
  const {
    restoreBatchTestFromTrash,
    deleteBatchTest,
    batchTestsLoading,
  } = useBatchTests();
  const { trashedBatchTests } = useBatchTestsStore();
  const { projects } = useProjects();

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [batchToDelete, setBatchToDelete] = useState<BatchTest | null>(null);

  const uniqueBatches = React.useMemo(() => {
    if (!trashedBatchTests) return [] as BatchTest[];
    const map = new Map<string, BatchTest>();
    trashedBatchTests.forEach(b => {
      if (!map.has(b._id)) map.set(b._id, b);
    });
    return Array.from(map.values());
  }, [trashedBatchTests]);

  const handleRestore = async (batch: BatchTest) => {
    try {
      await restoreBatchTestFromTrash(batch._id);
      toast.success("Batch test restored");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to restore batch test");
    }
  };

  const promptDelete = (batch: BatchTest) => {
    setBatchToDelete(batch);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async (deleteRuns: boolean) => {
    if (!batchToDelete) return;
    setDeleteLoading(true);
    try {
      await deleteBatchTest(batchToDelete._id, deleteRuns);
      toast.success("Batch test permanently deleted");
      setDeleteModalOpen(false);
      setBatchToDelete(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete batch test");
    } finally {
      setDeleteLoading(false);
    }
  };

  if (batchTestsLoading && uniqueBatches.length === 0) {
    return <BatchTestsCardSkeleton count={6} />;
  }

  if (uniqueBatches.length === 0) {
    return <p className="text-muted-foreground p-4">No batch tests in trash.</p>;
  }

  const getProjectName = (project: BatchTest["project"]) => {
    if (!project) return undefined;
    if (typeof project === "object" && "name" in project) return project.name as string;
    if (typeof project === "string" && projects) {
      return projects.find(p => p._id === project)?.name;
    }
    return undefined;
  };

  return (
    <section>
      <header className="px-4 mb-4">
        <h2 className="text-xl font-semibold">Trashed Batch Tests</h2>
      </header>
      <section
        className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 p-4"
        aria-label="Trashed batch tests list"
      >
        {uniqueBatches.map((batch, idx) => {
          const runsCount = batch.testrunsCount ?? (batch.testruns ? batch.testruns.length : 0);
          const successfulRuns = batch.successfulRuns ?? 0;
          const failedRuns = batch.failedRuns ?? 0;
          const testName =
            typeof batch.test === "object" && batch.test && "name" in batch.test
              ? (batch.test as { name: string }).name
              : "Batch Test";

          return (
            <article
              key={`${batch._id}-${idx}`}
              className="rounded-3xl border dark:border-0 bg-card/80 p-4 flex flex-col gap-3"
            >
              <header className="flex items-start gap-3">
                <figure
                  className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-xl font-bold shrink-0"
                  aria-hidden="true"
                >
                  {testName[0]}
                </figure>
                <section className="flex-1 min-w-0">
                  <h3 className="font-semibold leading-tight truncate" title={testName}>
                    {testName}
                  </h3>
                  {getProjectName(batch.project) && (
                    <p
                      className="text-sm text-muted-foreground line-clamp-2"
                      title={getProjectName(batch.project)}
                    >
                      {getProjectName(batch.project)}
                    </p>
                  )}
                </section>
                <nav onClick={e => e.stopPropagation()} data-stop-row>
                  <TrashCardActionsDropdown
                    onRestore={() => handleRestore(batch)}
                    onDelete={() => promptDelete(batch)}
                  />
                </nav>
              </header>

              <section className="flex items-center gap-2 mt-auto">
                <span className="text-xs bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-1.5 py-0 rounded-md">
                  ✓ {successfulRuns}
                </span>
                <span className="text-xs bg-red-500/10 text-red-700 dark:text-red-400 px-1.5 py-0 rounded-md">
                  ✗ {failedRuns}
                </span>
                <span className="text-xs bg-primary/10 dark:bg-primary/20 text-primary-foreground dark:text-neutral-200 px-1.5 py-0 rounded-md">
                  {runsCount} runs
                </span>
              </section>
            </article>
          );
        })}
      </section>

      <DeleteBatchTestModal
        open={deleteModalOpen}
        setOpen={setDeleteModalOpen}
        batchTestName={batchToDelete ? (typeof batchToDelete.test === "object" && batchToDelete.test && "name" in batchToDelete.test ? (batchToDelete.test as { name: string }).name : "Batch Test") : null}
        onConfirm={confirmDelete}
        loading={deleteLoading}
      />
    </section>
  );
} 