"use client";

import { useState, useEffect } from "react";
import { PersonasList } from "./_components/personas-list";
import { usePersonas } from "@/hooks/use-personas";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { PersonaDetailsTab } from "./_components/persona-details-tab";
import { BatchPersonasList } from "./_components/batch-personas-list";

// Force dynamic rendering to prevent static generation issues with useSearchParams
export const dynamic = 'force-dynamic';

export default function PersonasPage() {
  // Ensure personas are fetched and store is hydrated
  usePersonas();
  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState("individuals");

  useEffect(() => {
    setMounted(true);
    // Get tab from URL once component mounts on client
    const urlParams = new URLSearchParams(window.location.search);
    const initialTab = urlParams.get("tab") === "groups" ? "groups" : "individuals";
    setTab(initialTab);
  }, []);

  // Prevent rendering until client-side mount to avoid hydration issues
  if (!mounted) {
    return null;
  }

  return (
    <main className="p-4 w-full flex flex-col gap-8">
      <Tabs value={tab} onValueChange={setTab} className="flex-1 w-full">
        <nav className="flex flex-col md:flex-row gap-4 w-full" aria-label="Persona details navigation">
          <PersonaDetailsTab />
          <section className="flex-1 min-w-0">
            <TabsContent value="individuals">
              <PersonasList />
            </TabsContent>
            <TabsContent value="groups">
              <BatchPersonasList />
            </TabsContent>
          </section>
        </nav>
      </Tabs>
    </main>
  );
}
