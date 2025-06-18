"use client";
import { useParams, notFound } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import { useTests } from "@/hooks/use-tests";
import type { Test as TestType } from "@/hooks/use-tests";
import { useTestsStore } from "@/lib/store/tests";
import DetailsSection from "./_components/details-section";
import AnalysisSection from "./_components/analysis-section";
import TestRunsSection from "./_components/test-runs-section";
import { DetailsSectionSkeleton } from "./_components/details-section-skeleton";
import { AnalysisSectionSkeleton } from "./_components/analysis-section-skeleton";

export default function TestDetailPage() {
  const { testId } = useParams<{ testId: string }>();
  const { tests, getTestById } = useTests();
  const [test, setTest] = useState(() => tests?.find(t => t._id === testId));
  const [loading, setLoading] = useState(!test);

  useEffect(() => {
    if (!test && testId) {
      (async () => {
        setLoading(true);
        try {
          const fetched = await getTestById(testId);
          setTest(fetched);
          try {
            useTestsStore.getState().updateTestInList(fetched as TestType);
          } catch {}
        } catch {
          notFound();
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [test, testId, getTestById]);

  const [tab, setTab] = useState("details");

  if (loading && !test) {
    return (
      <main className="p-4 w-full flex flex-col gap-8">
        <DetailsSectionSkeleton />
        <AnalysisSectionSkeleton />
      </main>
    );
  }

  if (!loading && !test) {
    notFound();
    return null;
  }

  return (
    <main className="p-4 w-full flex flex-col gap-8">
      <Tabs value={tab} onValueChange={setTab} className="flex-1 w-full">
        <div className="flex flex-col md:flex-row gap-4 w-full">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
            <TabsTrigger value="runs">Test runs</TabsTrigger>
          </TabsList>
          <section className="flex-1 min-w-0">
            <TabsContent value="details">
              <DetailsSection test={test!} />
            </TabsContent>
            <TabsContent value="analysis">
              <AnalysisSection test={test!} />
            </TabsContent>
            <TabsContent value="runs">
              <TestRunsSection test={test!} />
            </TabsContent>
          </section>
        </div>
      </Tabs>
    </main>
  );
} 