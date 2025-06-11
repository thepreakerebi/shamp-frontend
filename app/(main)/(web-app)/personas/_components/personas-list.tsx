"use client";
import { usePersonas } from "@/hooks/use-personas";
import Image from "next/image";
import { PersonaCardDropdown } from "./persona-card-dropdown";
import { EditPersonaModal } from "./edit-persona-modal";
import { DeletePersonaModal } from "./delete-persona-modal";
import React from "react";
import type { Persona } from "@/hooks/use-personas";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { PersonaListSkeleton } from "./persona-list-skeleton";
import { PersonaListEmpty } from "./persona-list-empty";
import { useCreatePersonaModal } from "./create-persona-modal";

function PersonaCard({ persona, onEdit, onOpen, onDelete }: {
  persona: Persona,
  onEdit?: () => void,
  onOpen?: () => void,
  onDelete?: () => void,
}) {
  const router = useRouter();
  return (
    <section
      className="flex items-center gap-4 p-4 bg-card rounded-2xl border border-border hover:bg-muted/60 transition-colors"
    >
      <section className="flex-shrink-0">
        {persona.avatarUrl ? (
          <button
            type="button"
            className="p-0 m-0 border-none bg-transparent cursor-pointer"
            onClick={() => router.push(`/personas/${persona._id}`)}
            tabIndex={0}
            aria-label={`View persona ${persona.name}`}
          >
            <Image
              src={persona.avatarUrl}
              alt={persona.name}
              className="rounded-full object-cover w-16 h-16 border border-border bg-muted"
              width={64}
              height={64}
              unoptimized
            />
          </button>
        ) : (
          <section className="rounded-full w-16 h-16 flex items-center justify-center bg-muted text-muted-foreground border border-border text-2xl font-bold">
            {persona.name?.[0]?.toUpperCase() || "?"}
          </section>
        )}
      </section>
      <section className="flex flex-col w-full min-w-0 gap-1">
        <h3 className="font-semibold text-lg truncate w-full" title={persona.name}>{persona.name}</h3>
        <p className="text-sm text-muted-foreground truncate w-full" title={persona.gender}>{persona.gender || "-"}</p>
      </section>
      <PersonaCardDropdown
        onOpen={onOpen}
        onEdit={onEdit}
        onDelete={onDelete}
        personaId={persona._id}
      />
    </section>
  );
}

function PersonasListInner() {
  const { personas, personasLoading, personasError, deletePersona } = usePersonas();
  const { setOpen: setCreateOpen } = useCreatePersonaModal();
  const [editOpen, setEditOpen] = React.useState(false);
  const [editingPersona, setEditingPersona] = React.useState<Persona | null>(null);
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
  if (!personas || personas.length === 0) return <PersonaListEmpty onCreate={() => setCreateOpen(true)} />;

  return (
    <>
      <section className="grid grid-cols-1 lsm:grid-cols-2 sm:grid-cols-3 gap-4 w-full">
        {personas.map((persona) => (
          <PersonaCard
            key={persona._id}
            persona={persona}
            onEdit={() => {
              setEditingPersona(persona);
              setEditOpen(true);
            }}
            onOpen={() => {}}
            onDelete={() => {
              setDeletingPersona(persona);
              setDeleteOpen(true);
            }}
          />
        ))}
      </section>
      <EditPersonaModal open={editOpen} setOpen={setEditOpen} persona={editingPersona} />
      <DeletePersonaModal open={deleteOpen} setOpen={setDeleteOpen} persona={deletingPersona} onConfirm={handleDelete} loading={deleteLoading} />
    </>
  );
}

export function PersonasList() {
  return <PersonasListInner />;
} 