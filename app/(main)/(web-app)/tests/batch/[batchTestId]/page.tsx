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
  const [batchTest, setBatchTest] = useState(() => batchTests?.find(t => t._id === batchTestId));
  const [loading, setLoading] = useState(!batchTest);

  useEffect(() => {
    if (!batchTestId) return;
    let needsFetch = false;
    if (!batchTest) {
      needsFetch = true;
    } else {
      const analysisArr = (batchTest as unknown as { analysis?: unknown[] }).analysis;
      needsFetch = !(Array.isArray(analysisArr) && analysisArr.length > 0);
    }
    if (needsFetch) {
      (async () => {
        setLoading(true);
        try {
          const fetched = await getBatchTestById(batchTestId);
          setBatchTest(fetched);
          try { useBatchTestsStore.getState().updateBatchTestInList(fetched); } catch {}
        } catch {
          notFound();
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [batchTestId, batchTest, getBatchTestById]);

  const [tab, setTab] = useState<"details"|"analysis"|"runs">("details");

  if (loading && !batchTest) {
    return (
      <main className="p-4 w-full flex flex-col gap-8">
        <Skeleton className="h-32 w-full" />
        <AnalysisSectionSkeleton />
      </main>
    );
  }

  if (!loading && !batchTest) {
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
              <DetailsSection batch={batchTest!} />
            </TabsContent>
            <TabsContent value="analysis">
              <AnalysisSection batch={batchTest!} />
            </TabsContent>
            <TabsContent value="runs">
              <BatchTestRunsSection batch={batchTest!} />
            </TabsContent>
          </section>
        </div>
      </Tabs>
    </main>
  );
} 