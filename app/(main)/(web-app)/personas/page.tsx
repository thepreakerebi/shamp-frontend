"use client";

import { PersonasList } from "./_components/personas-list";

export default function PersonasPage() {
  return (
      <main className="p-4 w-full flex flex-col gap-8">
        <PersonasList />
      </main>
  );
}
