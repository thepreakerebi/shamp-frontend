"use client";
import React from "react";
import { useBatchPersonas } from "@/hooks/use-batch-personas";
import { BatchPersonasImage } from "./batch-personas-image";
import { BatchPersonaCardDropdown } from "./batch-persona-card-dropdown";
import { toast } from "sonner";
import { BatchPersonasListSkeleton } from "./batch-personas-list-skeleton";
import { BatchPersonasListEmpty } from "./batch-personas-list-empty";
import { useCreateBatchPersonasModal } from "./create-batch-personas-modal";
import { DeleteBatchPersonasModal } from "./delete-batch-personas-modal";
import { EditBatchPersonaNameModal } from "./edit-batch-persona-name-modal";
import { BatchPersona } from "@/hooks/use-batch-personas";
import Link from "next/link";

// Optionally, you can create skeleton/empty components for batch personas as well

export function BatchPersonasList() {
  const { batchPersonas, batchPersonasLoading, batchPersonasError, deleteBatchPersona } = useBatchPersonas();
  const { setOpen: setCreateBatchOpen } = useCreateBatchPersonasModal();

  // State for delete modal
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deletingBatchPersona, setDeletingBatchPersona] = React.useState<BatchPersona | null>(null);
  const [deleteLoading, setDeleteLoading] = React.useState(false);

  // State for rename modal
  const [renameOpen, setRenameOpen] = React.useState(false);
  const [renamingBatchPersona, setRenamingBatchPersona] = React.useState<BatchPersona | null>(null);

  const handleDelete = async () => {
    if (!deletingBatchPersona) return;
    setDeleteLoading(true);
    try {
      await deleteBatchPersona(deletingBatchPersona._id);
      toast.success("Batch persona deleted!");
      setDeleteOpen(false);
      setDeletingBatchPersona(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete batch persona");
    } finally {
      setDeleteLoading(false);
    }
  };

  if (batchPersonasLoading && (!batchPersonas || batchPersonas.length === 0)) {
    return <BatchPersonasListSkeleton />;
  }
  if (batchPersonasError) {
    return <div className="py-8 text-center text-destructive">{batchPersonasError}</div>;
  }
  if (!batchPersonas || batchPersonas.length === 0) {
    return <BatchPersonasListEmpty onCreate={() => setCreateBatchOpen(true)} />;
  }

  return (
    <>
    <section className="grid grid-cols-1 lsm:grid-cols-2 sm:grid-cols-3 gap-4 w-full">
      {batchPersonas.map((batch) => {
        // Get avatarUrls from personas (array of Persona or string IDs)
        let avatarUrls: string[] = [];
        if (Array.isArray(batch.personas)) {
          avatarUrls = (batch.personas as { avatarUrl?: string }[]).map((p) => p && p.avatarUrl ? p.avatarUrl : undefined).filter(Boolean) as string[];
        }
        return (
          <section
            key={batch._id}
            className="flex items-center gap-4 p-4 bg-card rounded-2xl border border-border hover:bg-muted/60 transition-colors"
          >
            <section className="flex-shrink-0">
                <Link href={`/personas/batch/${batch._id}`} aria-label={`View batch persona ${batch.name}`} tabIndex={0}>
              <BatchPersonasImage avatarUrls={avatarUrls} />
                </Link>
            </section>
            <section className="flex flex-col w-full min-w-0 gap-1">
              <h3 className="font-semibold text-lg truncate w-full" title={batch.name}>{batch.name}</h3>
              <p className="text-sm text-muted-foreground truncate w-full">{Array.isArray(batch.personas) ? batch.personas.length : 0} personas</p>
            </section>
            <BatchPersonaCardDropdown
              batchPersonaId={batch._id}
              onOpen={() => {}}
                onRename={() => {
                  setRenamingBatchPersona(batch);
                  setRenameOpen(true);
                }}
                onDelete={() => {
                  setDeletingBatchPersona(batch);
                  setDeleteOpen(true);
                }}
            />
          </section>
        );
      })}
    </section>
      <DeleteBatchPersonasModal
        open={deleteOpen}
        setOpen={setDeleteOpen}
        batchPersona={deletingBatchPersona}
        onConfirm={handleDelete}
        loading={deleteLoading}
      />
      <EditBatchPersonaNameModal
        open={renameOpen}
        setOpen={setRenameOpen}
        batchPersona={renamingBatchPersona}
      />
    </>
  );
} 