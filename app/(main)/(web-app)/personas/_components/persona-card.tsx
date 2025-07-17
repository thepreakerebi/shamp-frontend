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
      role="button"
      tabIndex={0}
      onClick={() => router.push(`/personas/${persona._id}`)}
      className="flex cursor-pointer items-center gap-4 p-4 bg-card rounded-2xl border border-border dark:border-0 hover:bg-muted/60 transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-secondary"
    >
      <section className="flex-shrink-0">
        {persona.avatarUrl ? (
          <Image
            src={persona.avatarUrl}
            alt={persona.name}
            className="rounded-full object-cover w-16 h-16 border border-border bg-muted select-none"
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
      <section className="flex flex-col w-full min-w-0 gap-1">
        <h3 className="font-semibold text-lg truncate w-full" title={persona.name}>{persona.name}</h3>
        <p className="text-sm text-muted-foreground truncate w-full" title={persona.gender}>{persona.gender || "-"}</p>
      </section>
      <nav
        onClick={(e)=>e.stopPropagation()}
        onPointerDown={(e)=>e.stopPropagation()}
        data-stop-row
      >
        <PersonaCardDropdown
          onOpen={onOpen}
          onEdit={onEdit}
          onDelete={onDelete}
          personaId={persona._id}
        />
      </nav>
    </section>
  );
} 