"use client";
import React from "react";
import { useBatchPersonas } from "@/hooks/use-batch-personas";
import { BatchPersonasImage } from "./batch-personas-image";
import { BatchPersonaCardDropdown } from "./batch-persona-card-dropdown";
import { toast } from "sonner";
import { BatchPersonasListSkeleton } from "./batch-personas-list-skeleton";
import { BatchPersonasListEmpty } from "./batch-personas-list-empty";
import { useCreateBatchPersonasModal } from "./create-batch-personas-modal";

// Optionally, you can create skeleton/empty components for batch personas as well

export function BatchPersonasList() {
  const { batchPersonas, batchPersonasLoading, batchPersonasError, deleteBatchPersona } = useBatchPersonas();
  const { setOpen: setCreateBatchOpen } = useCreateBatchPersonasModal();

  const handleDelete = async (id: string) => {
    try {
      await deleteBatchPersona(id);
      toast.success("Batch persona deleted!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete batch persona");
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
              <BatchPersonasImage avatarUrls={avatarUrls} />
            </section>
            <section className="flex flex-col w-full min-w-0 gap-1">
              <h3 className="font-semibold text-lg truncate w-full" title={batch.name}>{batch.name}</h3>
              <p className="text-sm text-muted-foreground truncate w-full">{Array.isArray(batch.personas) ? batch.personas.length : 0} personas</p>
            </section>
            <BatchPersonaCardDropdown
              batchPersonaId={batch._id}
              onOpen={() => {}}
              onDelete={() => handleDelete(batch._id)}
            />
          </section>
        );
      })}
    </section>
  );
} 