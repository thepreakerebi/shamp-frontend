"use client";
import { useParams, notFound } from "next/navigation";
import { useBatchTests } from "@/hooks/use-batch-tests";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DetailsSection from "./_components/details-section";
import AnalysisSection from "./_components/analysis-section";
import BatchTestRunsSection from "./_components/test-runs-section";
import { AnalysisSectionSkeleton } from "./_components/analysis-section-skeleton";

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

  const [tab, setTab] = useState<"details"|"analysis"|"runs">("details");

  if (loading) {
    return (
      <main className="p-4 w-full flex flex-col gap-8">
        <Skeleton className="h-32 w-full" />
        <AnalysisSectionSkeleton />
      </main>
    );
  }

  if (!batchTest) {
    notFound();
    return null;
  }

  return (
    <main className="p-4 w-full flex flex-col gap-8">
      <Tabs value={tab} onValueChange={(v)=>setTab(v as "details"|"analysis"|"runs")} className="flex-1 w-full">
        <div className="flex flex-col md:flex-row gap-4 w-full">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
            <TabsTrigger value="runs">Test runs</TabsTrigger>
          </TabsList>
          <section className="flex-1 min-w-0">
            <TabsContent value="details">
              <DetailsSection batch={batchTest} />
            </TabsContent>
            <TabsContent value="analysis">
              <AnalysisSection batch={batchTest} />
            </TabsContent>
            <TabsContent value="runs">
              <BatchTestRunsSection batch={batchTest} />
            </TabsContent>
          </section>
        </div>
      </Tabs>
    </main>
  );
} 