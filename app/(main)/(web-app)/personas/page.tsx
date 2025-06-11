"use client";

import { PersonasList } from "./_components/personas-list";
import { usePersonas } from "@/hooks/use-personas";

export default function PersonasPage() {
  // Ensure personas are fetched and store is hydrated
  usePersonas();
  return (
    <main className="p-4 w-full flex flex-col gap-8">
      <PersonasList />
    </main>
  );
}
