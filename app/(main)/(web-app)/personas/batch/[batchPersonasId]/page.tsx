"use client";
import { useParams } from "next/navigation";
import { useBatchPersonas, BatchPersona } from "@/hooks/use-batch-personas";
import { useEffect, useState } from "react";

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
        setError(err instanceof Error ? err.message : "Failed to fetch batch persona");
        setLoading(false);
      });
  }, [batchPersonasId]);

  if (loading) {
    return <div className="py-8 text-center text-muted-foreground">Loading batch personas...</div>;
  }
  if (error) {
    return <div className="py-8 text-center text-destructive">{error}</div>;
  }
  if (!batchPersona) {
    return <div className="py-8 text-center text-muted-foreground">Batch persona not found.</div>;
  }

  return (
    <main className="p-4 w-full flex flex-col gap-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-foreground truncate" title={batchPersona.name}>{batchPersona.name}</h1>
    </main>
  );
} 