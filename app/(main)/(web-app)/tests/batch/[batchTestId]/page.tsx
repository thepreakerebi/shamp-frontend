"use client";
import { useParams, notFound } from "next/navigation";
import { useBatchTests } from "@/hooks/use-batch-tests";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function BatchTestPage() {
  const { batchTestId } = useParams<{ batchTestId: string }>();
  const { getBatchTestById } = useBatchTests();
  const [batchTest, setBatchTest] = useState<import("@/hooks/use-batch-tests").BatchTest | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch once on mount; avoid re-fetching when store updates change function identity
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!batchTestId) return;
    // Only fetch if we don't have the batchTest yet
    if (batchTest) return;
    setLoading(true);
    getBatchTestById(batchTestId as string)
      .then((data) => {
        setBatchTest(data);
        setLoading(false);
      })
      .catch((err) => {
        const msg = err instanceof Error ? err.message.toLowerCase() : "";
        if (msg.includes("not found") || msg.includes("failed to fetch batch test")) {
          setBatchTest(null);
        }
        setLoading(false);
      });
  }, [batchTestId, batchTest]);

  if (loading) {
    return (
      <main className="p-4 w-full max-w-md mx-auto space-y-4">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-1/2" />
      </main>
    );
  }

  if (!batchTest) {
    notFound();
    return null;
  }

  const projectName = typeof batchTest.project === "object" && batchTest.project ? (batchTest.project as { name?: string }).name : undefined;
  const testName = typeof batchTest.test === "object" && batchTest.test ? (batchTest.test as { name?: string }).name : undefined;
  const batchPersonaName = typeof batchTest.batchPersona === "object" && batchTest.batchPersona ? (batchTest.batchPersona as { name?: string }).name : undefined;

  return (
    <main className="p-4 w-full max-w-md mx-auto space-y-4">
      {testName && <h1 className="text-2xl font-semibold truncate" title={testName}>{testName}</h1>}
      {projectName && (
        <p className="text-sm text-muted-foreground">Project: {projectName}</p>
      )}
      {batchPersonaName && (
        <p className="text-sm text-muted-foreground">Batch personas: {batchPersonaName}</p>
      )}
    </main>
  );
} 