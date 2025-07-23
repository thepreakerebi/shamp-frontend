"use client";
import { useParams, notFound, useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useTests } from "@/hooks/use-tests";
import type { Test as TestType } from "@/hooks/use-tests";
import { useTestsStore } from "@/lib/store/tests";
import DetailsSection from "./_components/details-section";
import AnalysisSection from "./_components/analysis-section";
import TestRunsSection from "./_components/test-runs-section";
import { DetailsSectionSkeleton } from "./_components/details-section-skeleton";
import { AnalysisSectionSkeleton } from "./_components/analysis-section-skeleton";

// Force dynamic rendering to prevent static generation issues with useSearchParams
export const dynamic = 'force-dynamic';

export default function TestDetailPage() {
  const { testId } = useParams<{ testId: string }>();
  const router = useRouter();
  const { tests, getTestById } = useTests();
  const { currentWorkspaceId } = useAuth();
  const storeTest = useTestsStore(state => state.tests?.find(t => t._id === testId));
  const [test, setTest] = useState(() => tests?.find(t => t._id === testId));
  const [loading, setLoading] = useState(!test);
  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState("details");

  useEffect(() => {
    setMounted(true);
    // Get tab from URL once component mounts on client
    const urlParams = new URLSearchParams(window.location.search);
    const initialTabParam = urlParams.get("tab");
    const initialTab = initialTabParam === "analysis" || initialTabParam === "runs" ? initialTabParam : "details";
    setTab(initialTab);
  }, []);

  // Fetch the test once we have a workspace context. Without the header the
  // backend returns 400/403 which previously triggered the catch→notFound
  // path even though the test exists.
  useEffect(() => {
    if (!testId) return;
    if (!currentWorkspaceId) return; // wait until workspace resolved
    let needsFetch = false;
    if (!test) {
      needsFetch = true;
    } else {
      const analysisArr = (test as unknown as { analysis?: unknown[] }).analysis;
      needsFetch = !(Array.isArray(analysisArr) && analysisArr.length > 0);
    }
    if (needsFetch) {
      (async () => {
        setLoading(true);
        try {
          const fetched = await getTestById(testId);
          setTest(fetched);
          try { useTestsStore.getState().updateTestInList(fetched as TestType); } catch {}
        } catch {
          notFound();
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [testId, test, currentWorkspaceId]);

  // Sync local state when store updates (e.g., via Socket.IO after edit)
  useEffect(() => {
    const testsLoaded = useTestsStore.getState().tests !== null;
    if (storeTest) {
      // Update local copy only if content actually changed (using updatedAt or reference absence)
      const storeUpdatedAt = (storeTest as { updatedAt?: string }).updatedAt;
      const localUpdatedAt = (test as { updatedAt?: string } | null)?.updatedAt;
      if (!test || storeUpdatedAt !== localUpdatedAt) {
        setTest(storeTest);
        setLoading(false);
      }
      // If test is trashed or deleted flag, redirect
      if (storeTest.trashed) {
        router.push('/tests');
      }
    } else if (testsLoaded && !loading) {
      // Store loaded and not currently fetching, but test still missing → redirect
      router.push('/tests');
    }
  }, [storeTest, loading]);

  // Prevent rendering until client-side mount to avoid hydration issues
  if (!mounted) {
    return null;
  }

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