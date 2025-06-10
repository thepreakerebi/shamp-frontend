"use client";
import { useEffect, useState } from "react";
import { useParams, notFound } from "next/navigation";
import { usePersonas } from "@/hooks/use-personas";
import type { Persona } from "@/hooks/use-personas";

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
    <main className="p-4 w-full flex flex-col gap-4">
      {(personasLoading || loading) && <div className="py-8 text-center text-muted-foreground">Loading persona...</div>}
      {error && <div className="py-8 text-center text-destructive">{error}</div>}
      {persona && (
        <h1 className="text-3xl font-bold text-foreground">{persona.name}</h1>
      )}
    </main>
  );
}
