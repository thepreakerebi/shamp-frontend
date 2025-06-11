"use client";

import { useState } from "react";
import { PersonasList } from "./_components/personas-list";
import { usePersonas } from "@/hooks/use-personas";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { PersonaDetailsTab } from "./_components/persona-details-tab";

export default function PersonasPage() {
  // Ensure personas are fetched and store is hydrated
  usePersonas();
  const [tab, setTab] = useState("individuals");
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
              {/* TODO: Add Groups list/component here */}
              <div className="text-muted-foreground text-center py-8">Groups coming soon...</div>
            </TabsContent>
          </section>
        </nav>
      </Tabs>
    </main>
  );
}
