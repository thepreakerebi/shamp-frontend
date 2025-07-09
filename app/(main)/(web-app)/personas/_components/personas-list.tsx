"use client";
import { usePersonas } from "@/hooks/use-personas";
import { PersonaCard } from "./persona-card";
import { DeletePersonaModal } from "./delete-persona-modal";
import React from "react";
import type { Persona } from "@/hooks/use-personas";
import { toast } from "sonner";
import { PersonaListSkeleton } from "./persona-list-skeleton";
import { PersonaListEmpty } from "./persona-list-empty";
import { useRouter } from "next/navigation";

function PersonasListInner() {
  const { personas, personasLoading, personasError, deletePersona } = usePersonas();
  const router = useRouter();
  // Removed edit modal state; edit now navigates to edit page.
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deletingPersona, setDeletingPersona] = React.useState<Persona | null>(null);
  const [deleteLoading, setDeleteLoading] = React.useState(false);

  const handleDelete = async () => {
    if (!deletingPersona) return;
    setDeleteLoading(true);
    try {
      await deletePersona(deletingPersona._id);
      toast.success("Persona deleted!");
      setDeleteOpen(false);
      setDeletingPersona(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete persona");
    } finally {
      setDeleteLoading(false);
    }
  };

  if (personasLoading && (!personas || personas.length === 0)) return <PersonaListSkeleton />;
  if (personasError) return <div className="py-8 text-center text-destructive">{personasError}</div>;
  if (!personas || personas.length === 0) return <PersonaListEmpty onCreate={() => router.push('/personas/create')} />;

  return (
    <>
      <section className="grid grid-cols-1 lsm:grid-cols-2 sm:grid-cols-3 gap-4 w-full">
        {personas.map((persona) => (
          <PersonaCard
            key={persona._id}
            persona={persona}
            onEdit={() => router.push(`/personas/${persona._id}/edit`)}
            onOpen={() => {}}
            onDelete={() => {
              setDeletingPersona(persona);
              setDeleteOpen(true);
            }}
          />
        ))}
      </section>
      <DeletePersonaModal open={deleteOpen} setOpen={setDeleteOpen} persona={deletingPersona} onConfirm={handleDelete} loading={deleteLoading} />
    </>
  );
}

export function PersonasList() {
  return <PersonasListInner />;
} 