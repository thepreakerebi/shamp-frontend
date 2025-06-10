"use client";
import { usePersonas } from "@/hooks/use-personas";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { EllipsisVerticalIcon } from "lucide-react";

export function PersonasList() {
  const { personas, personasLoading, personasError } = usePersonas();

  if (personasLoading) return <div className="py-8 text-center text-muted-foreground">Loading personas...</div>;
  if (personasError) return <div className="py-8 text-center text-destructive">{personasError}</div>;
  if (!personas || personas.length === 0) return <div className="py-8 text-center text-muted-foreground">No personas found.</div>;

  return (
    <section className="grid grid-cols-1 lsm:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 w-full">
      {personas.map((persona) => (
        <section
          key={persona._id}
          className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border hover:bg-muted transition-colors"
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
          <Button variant="ghost" size="icon" className="ml-auto" aria-label="Persona options">
            <EllipsisVerticalIcon className="w-4 h-4" />
          </Button>
        </section>
      ))}
    </section>
  );
} 