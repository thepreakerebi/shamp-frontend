"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { usePersonas } from "@/hooks/use-personas";
import { PersonasList } from "./_components/personas-list";

export default function PersonasPage() {
  const { personas } = usePersonas();
  const prevCount = useRef(personas ? personas.length : 0);

  useEffect(() => {
    if (personas && personas.length > prevCount.current) {
      toast.success("New persona created!");
    }
    prevCount.current = personas ? personas.length : 0;
  }, [personas]);

  return (
      <main className="p-4 w-full flex flex-col gap-8">
        <PersonasList />
      </main>
  );
}
