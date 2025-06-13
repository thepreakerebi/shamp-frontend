"use client";
import { useParams } from "next/navigation";
import { useTests } from "@/hooks/use-tests";

export default function TestDetailPage() {
  const { testId } = useParams<{ testId: string }>();
  const { tests } = useTests();
  const test = tests?.find(t => t._id === testId);

  return (
    <main className="p-6 w-full max-w-2xl mx-auto space-y-4">
      <h1 className="text-2xl font-semibold">{test?.name || "Test"}</h1>
      {!test && <p className="text-muted-foreground">Loading…</p>}
    </main>
  );
} 