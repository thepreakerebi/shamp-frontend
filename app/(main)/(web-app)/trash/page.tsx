"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { TrashTab } from "./_components/trash-tab";
import { TrashedProjectsList } from "./_components/projects-list";
import { TrashedTestsList } from "./_components/tests-list";
import { TrashedBatchTestsList } from "./_components/batch-tests-list";
import { TrashedSchedulesList } from "./_components/schedules-list";
import { TrashedRunsList } from "./_components/runs-list";

const TAB_OPTIONS = [
  { key: "projects", label: "Projects" },
  { key: "tests", label: "Tests" },
  { key: "batch", label: "Batch tests" },
  { key: "schedules", label: "Schedules" },
  { key: "runs", label: "Test runs" },
];

// Force dynamic rendering to prevent static generation issues with useSearchParams
export const dynamic = 'force-dynamic';

export default function TrashPage() {
  const searchParams = useSearchParams();
  const initialParam = searchParams.get("tab");
  const valid = TAB_OPTIONS.map(t => t.key);
  const initialTab = valid.includes(initialParam ?? "") ? initialParam! : "projects";
  const [tab, setTab] = useState(initialTab);

  return (
    <main className="p-4 w-full flex flex-col gap-8">
      <Tabs value={tab} onValueChange={setTab} className="flex-1 w-full">
        <nav className="flex flex-col md:flex-row gap-4 w-full" aria-label="Trash navigation">
          <TrashTab />
          <section className="flex-1 min-w-0">
            <TabsContent value="projects"><TrashedProjectsList /></TabsContent>
            <TabsContent value="tests"><TrashedTestsList /></TabsContent>
            <TabsContent value="batch"><TrashedBatchTestsList /></TabsContent>
            <TabsContent value="schedules"><TrashedSchedulesList /></TabsContent>
            <TabsContent value="runs"><TrashedRunsList /></TabsContent>
          </section>
        </nav>
      </Tabs>
    </main>
  );
} 