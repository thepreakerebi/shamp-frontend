"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { usePersonas } from "@/hooks/use-personas";

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
      <main className="p-8 w-full flex flex-col items-center justify-center min-h-[60vh]">
        <h1 className="text-3xl md:text-4xl font-bold mb-4 text-center">Personas</h1>
        <p className="text-lg text-muted-foreground text-center max-w-xl">
          This is the Personas page. Here you will be able to view, create, and manage user personas for your workspace. More features and UI coming soon!
        </p>
      </main>
  );
}
