"use client";
import { Button } from "@/components/ui/button";
import { UserPlus, Plus } from "lucide-react";
import React from "react";

export function PersonaListEmpty({ onCreate }: { onCreate?: () => void }) {
  return (
    <section className="flex flex-col items-center justify-center w-full py-16 gap-4 bg-background rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
      <UserPlus className="text-muted-foreground mb-2" size={40} />
      <h2 className="text-xl font-semibold text-foreground mb-1">No personas found</h2>
      <p className="text-muted-foreground text-sm mb-4 text-center max-w-xs">
        You haven&apos;t created any personas yet. Start by creating your first persona to get started!
      </p>
      <Button onClick={onCreate} className="gap-2" variant="default">
        <Plus className="size-4" />
        Create persona
      </Button>
    </section>
  );
} 