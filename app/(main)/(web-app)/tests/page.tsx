"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { TestsTab } from "./_components/tests-tab";
import { TestsList } from "./_components/tests-list";
import { BatchTestsList } from "./_components/batch-tests-list";
import { SchedulesList } from "./_components/schedules-list";
import { useTests } from "@/hooks/use-tests";
// Force dynamic rendering to prevent static generation issues with useSearchParams
export const dynamic = 'force-dynamic';

export default function TestsPage() {
  // Ensure tests are fetched and store is hydrated
  useTests();

  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState("individuals");

  useEffect(() => {
    setMounted(true);
    // Get tab from URL once component mounts on client
    const urlParams = new URLSearchParams(window.location.search);
    const initialParam = urlParams.get("tab");
    const initialTab = initialParam === "batch" ? "batch" : initialParam === "schedules" ? "schedules" : "individuals";
    setTab(initialTab);
  }, []);

  // Prevent rendering until client-side mount to avoid hydration issues
  if (!mounted) {
    return null;
  }

  return (
    <main className="p-4 w-full flex flex-col gap-8">
      <Tabs value={tab} onValueChange={setTab} className="flex-1 w-full">
        <nav className="flex flex-col md:flex-row gap-4 w-full" aria-label="Tests navigation">
          <TestsTab />
          <section className="flex-1 min-w-0">
            <TabsContent value="individuals">
              <TestsList />
            </TabsContent>
            <TabsContent value="batch">
              <BatchTestsList />
            </TabsContent>
            <TabsContent value="schedules">
              <SchedulesList />
            </TabsContent>
          </section>
        </nav>
      </Tabs>
    </main>
  );
}
