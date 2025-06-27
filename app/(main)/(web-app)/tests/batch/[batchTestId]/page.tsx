"use client";
import { useParams, notFound } from "next/navigation";
import { useBatchTests } from "@/hooks/use-batch-tests";
import { useEffect, useState } from "react";
import { useBatchTestsStore } from "@/lib/store/batchTests";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DetailsSection from "./_components/details-section";
import AnalysisSection from "./_components/analysis-section";
import BatchTestRunsSection from "./_components/test-runs-section";
import { AnalysisSectionSkeleton } from "./_components/analysis-section-skeleton";

export default function BatchTestPage() {
  const { batchTestId } = useParams<{ batchTestId: string }>();
  const { getBatchTestById } = useBatchTests();
  const { batchTests } = useBatchTestsStore();
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
      .catch(() => {
        setBatchTest(null);
        setLoading(false);
      });
  }, [batchTestId, batchTest]);

  // Keep local state in sync with store updates (realtime socket events)
  useEffect(() => {
    const updated = batchTests?.find((b) => b._id === batchTestId);
    if (updated && updated !== batchTest) {
      setBatchTest(updated);
    }
  }, [batchTests, batchTestId]);

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