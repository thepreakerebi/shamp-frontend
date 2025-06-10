"use client";
import { useEffect, useState } from "react";
import { useParams, notFound } from "next/navigation";
import { usePersonas } from "@/hooks/use-personas";
import type { Persona } from "@/hooks/use-personas";
import Image from "next/image";
import { PersonaCardDropdown } from "../_components/persona-card-dropdown";

export default function PersonaPage() {
  const { personaId } = useParams();
  const { personas, personasLoading, getPersonaById } = usePersonas();
  const [persona, setPersona] = useState<Persona | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!personaId) return;
    // Try to find the persona in the store first
    const found = personas?.find((p) => p._id === personaId) || null;
    if (found) {
      setPersona(found);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    getPersonaById(personaId as string)
      .then((p) => setPersona(p))
      .catch((err) => setError(err.message || "Failed to load persona"))
      .finally(() => setLoading(false));
  }, [personaId, personas, getPersonaById]);

  if (!personasLoading && !loading && (!persona || error)) {
    notFound();
    return null;
  }

  return (
    <main className="p-4 w-full flex flex-col gap-6 max-w-2xl mx-auto">
      {(personasLoading || loading) && <div className="py-8 text-center text-muted-foreground">Loading persona...</div>}
      {error && <div className="py-8 text-center text-destructive">{error}</div>}
      {persona && (
        <>
          {/* 1. Top Section: Avatar, Name & Gender, Dropdown */}
          <section className="flex items-center gap-6 w-full">
            {/* Avatar */}
            <section className="flex-shrink-0">
              {persona.avatarUrl ? (
                <Image
                  src={persona.avatarUrl}
                  alt={persona.name}
                  className="rounded-full object-cover w-20 h-20 border border-border bg-muted"
                  width={80}
                  height={80}
                  unoptimized
                />
              ) : (
                <section className="rounded-full w-20 h-20 flex items-center justify-center bg-muted text-muted-foreground border border-border text-3xl font-bold">
                  {persona.name?.[0]?.toUpperCase() || "?"}
                </section>
              )}
            </section>
            {/* Name & Gender */}
            <section className="flex flex-col flex-1 min-w-0 gap-1">
              <h1 className="text-3xl font-bold text-foreground truncate" title={persona.name}>{persona.name}</h1>
              <span className="text-base text-muted-foreground">{persona.gender || "-"}</span>
            </section>
            {/* Dropdown */}
            <section className="flex-shrink-0">
              <PersonaCardDropdown showOpen={false} onEdit={() => {}} onDelete={() => {}} />
            </section>
          </section>

          {/* 2. Description */}
          <section className="w-full">
            <header className="mb-1 font-semibold text-base">Description</header>
            <p className="text-muted-foreground w-full">
              {persona.description?.trim()
                ? persona.description
                : "No description provided for this persona. Add a description to give more context about this persona's background, motivations, and unique characteristics."}
            </p>
          </section>

          {/* 3. Background */}
          {persona.background && (
            <section className="w-full">
              <header className="mb-1 font-semibold text-base">Background</header>
              <p className="text-muted-foreground w-full">{persona.background}</p>
            </section>
          )}

          {/* 4. Goals */}
          {persona.goals && persona.goals.length > 0 && (
            <section className="w-full">
              <header className="mb-1 font-semibold text-base">Goals</header>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                {persona.goals.map((goal, i) => (
                  <li key={i}>{goal}</li>
                ))}
              </ul>
            </section>
          )}

          {/* 5. Frustrations */}
          {persona.frustrations && persona.frustrations.length > 0 && (
            <section className="w-full">
              <header className="mb-1 font-semibold text-base">Frustrations</header>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                {persona.frustrations.map((frustration, i) => (
                  <li key={i}>{frustration}</li>
                ))}
              </ul>
            </section>
          )}

          {/* 6. Traits */}
          {persona.traits && (
            Array.isArray(persona.traits) ? (
              persona.traits.length > 0 && (
                <section className="w-full">
                  <header className="mb-1 font-semibold text-base">Traits</header>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    {persona.traits.map((trait, i) => (
                      <li key={i}>{typeof trait === "string" ? trait : JSON.stringify(trait)}</li>
                    ))}
                  </ul>
                </section>
              )
            ) : (
              Object.keys(persona.traits).length > 0 && (
                <section className="w-full">
                  <header className="mb-1 font-semibold text-base">Traits</header>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    {Object.entries(persona.traits).map(([key, value]) => (
                      <li key={key}><span className="font-medium">{key}:</span> {String(value)}</li>
                    ))}
                  </ul>
                </section>
              )
            )
          )}

          {/* 7. Preferred Devices */}
          {persona.preferredDevices && persona.preferredDevices.length > 0 && (
            <section className="w-full">
              <header className="mb-1 font-semibold text-base">Preferred Devices</header>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                {persona.preferredDevices.map((device, i) => (
                  <li key={i}>{device}</li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </main>
  );
}
