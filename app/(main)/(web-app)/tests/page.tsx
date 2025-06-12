"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { TestsTab } from "./_components/tests-tab";
import { TestsList } from "./_components/tests-list";
import { BatchTestsList } from "./_components/batch-tests-list";
import { useTests } from "@/hooks/use-tests";

export default function TestsPage() {
  // Ensure tests are fetched and store is hydrated
  useTests();

  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "groups" ? "groups" : "individuals";
  const [tab, setTab] = useState(initialTab);

  return (
    <main className="p-4 w-full flex flex-col gap-8">
      <Tabs value={tab} onValueChange={setTab} className="flex-1 w-full">
        <nav className="flex flex-col md:flex-row gap-4 w-full" aria-label="Tests navigation">
          <TestsTab />
          <section className="flex-1 min-w-0">
            <TabsContent value="individuals">
              <TestsList />
            </TabsContent>
            <TabsContent value="groups">
              <BatchTestsList />
            </TabsContent>
          </section>
        </nav>
      </Tabs>
    </main>
  );
}
