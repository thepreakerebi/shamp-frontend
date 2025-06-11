"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Persona } from "@/hooks/use-personas";
import { PersonaCardDropdown } from "./persona-card-dropdown";
import React from "react";

interface PersonaCardProps {
  persona: Persona;
  onEdit?: () => void;
  onOpen?: () => void;
  onDelete?: () => void;
}

export function PersonaCard({ persona, onEdit, onOpen, onDelete }: PersonaCardProps) {
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