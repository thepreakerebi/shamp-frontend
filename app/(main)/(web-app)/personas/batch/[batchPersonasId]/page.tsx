"use client";
import { useParams } from "next/navigation";
import { useBatchPersonas, BatchPersona } from "@/hooks/use-batch-personas";
import { useEffect, useState } from "react";
import { Persona } from "@/hooks/use-personas";
import { PersonaCard } from "../../_components/persona-card";
import { PersonaListSkeleton } from "../../_components/persona-list-skeleton";
import BatchPersonaNotFound from "./not-found";

export default function BatchPersonaPage() {
  const { batchPersonasId } = useParams();
  const { getBatchPersonaById } = useBatchPersonas();
  const [batchPersona, setBatchPersona] = useState<BatchPersona | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!batchPersonasId) return;
    setLoading(true);
    setError(null);
    getBatchPersonaById(batchPersonasId as string)
      .then((data) => {
        setBatchPersona(data);
        setLoading(false);
      })
      .catch((err) => {
        const msg = err instanceof Error ? err.message.toLowerCase() : "";
        if (msg.includes("not found") || msg.includes("failed to fetch batch persona")) {
          setBatchPersona(null);
          setError(null);
        } else {
          setError(err instanceof Error ? err.message : "Failed to fetch batch persona");
        }
        setLoading(false);
      });
  }, [batchPersonasId]);

  if (loading) {
    return <PersonaListSkeleton count={4} />;
  }
  if (error) {
    return <div className="py-8 text-center text-destructive">{error}</div>;
  }
  if (!batchPersona) {
    return <BatchPersonaNotFound />;
  }

  return (
    <main className="p-4 w-full flex flex-col gap-6">
      {/* Batch Persona Name */}
      <h1 className="text-xl font-medium text-foreground truncate" title={batchPersona.name}>{batchPersona.name}</h1>

      {/* Personas Grid */}
      {Array.isArray(batchPersona.personas) && (
        <section className="grid grid-cols-1 lsm:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 w-full">
          {(batchPersona.personas as Persona[])
            .filter((p) => typeof p === "object" && p !== null && "_id" in p)
            .map((persona) => (
              <PersonaCard key={(persona as Persona)._id} persona={persona as Persona} />
            ))}
        </section>
      )}
    </main>
  );
} 