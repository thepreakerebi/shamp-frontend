"use client";
import { usePersonas } from "@/hooks/use-personas";
import Image from "next/image";
import { PersonaCardDropdown } from "./persona-card-dropdown";
import { EditPersonaModal } from "./edit-persona-modal";
import React from "react";
import type { Persona } from "@/hooks/use-personas";

function PersonaCard({ persona, onEdit, onOpen, onDelete }: {
  persona: Persona,
  onEdit?: () => void,
  onOpen?: () => void,
  onDelete?: () => void,
}) {
  return (
    <section
      className="flex items-center gap-4 p-4 bg-card rounded-2xl border border-border hover:bg-muted/60 transition-colors"
    >
      <section className="flex-shrink-0">
        {persona.avatarUrl ? (
          <Image
            src={persona.avatarUrl}
            alt={persona.name}
            className="rounded-full object-cover w-16 h-16 border border-border bg-muted"
            width={64}
            height={64}
            unoptimized
          />
        ) : (
          <section className="rounded-full w-16 h-16 flex items-center justify-center bg-muted text-muted-foreground border border-border text-2xl font-bold">
            {persona.name?.[0]?.toUpperCase() || "?"}
          </section>
        )}
      </section>
      <section className="flex flex-col min-w-0">
        <h3 className="font-semibold text-lg truncate" title={persona.name}>{persona.name}</h3>
        <p className="text-sm text-muted-foreground mt-1 truncate" title={persona.gender}>{persona.gender || "-"}</p>
      </section>
      <PersonaCardDropdown
        onOpen={onOpen}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </section>
  );
}

function PersonasListInner() {
  const { personas, personasLoading, personasError } = usePersonas();
  const [editOpen, setEditOpen] = React.useState(false);
  const [editingPersona, setEditingPersona] = React.useState<Persona | null>(null);

  if (personasLoading && (!personas || personas.length === 0)) return <div className="py-8 text-center text-muted-foreground">Loading personas...</div>;
  if (personasError) return <div className="py-8 text-center text-destructive">{personasError}</div>;
  if (!personas || personas.length === 0) return <div className="py-8 text-center text-muted-foreground">No personas found.</div>;

  return (
    <>
      <section className="grid grid-cols-1 lsm:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 w-full">
        {personas.map((persona) => (
          <PersonaCard
            key={persona._id}
            persona={persona}
            onEdit={() => {
              setEditingPersona(persona);
              setEditOpen(true);
            }}
            onOpen={() => {}}
            onDelete={() => {}}
          />
        ))}
      </section>
      <EditPersonaModal open={editOpen} setOpen={setEditOpen} persona={editingPersona} />
    </>
  );
}

export function PersonasList() {
  return <PersonasListInner />;
} 