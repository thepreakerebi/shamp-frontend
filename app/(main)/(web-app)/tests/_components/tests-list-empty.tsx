"use client";
import { Button } from "@/components/ui/button";
import { ClipboardList, Plus } from "lucide-react";
import React from "react";
import { useRouter } from "next/navigation";

export function TestsListEmpty() {
  const router = useRouter();
  const handleCreate = () => router.push("/tests/create");
  return (
    <section className="flex flex-col items-center justify-center w-full py-16 gap-4 bg-background rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
      <ClipboardList className="text-muted-foreground mb-2" size={40} />
      <h2 className="text-xl font-semibold text-foreground mb-1">No tests found</h2>
      <p className="text-muted-foreground text-sm mb-4 text-center max-w-xs">
        You haven&apos;t created any usability tests yet. Start by creating your first test to get insights!
      </p>
      <Button onClick={handleCreate} className="gap-2" variant="default">
        <Plus className="size-4" />
        Create test
      </Button>
    </section>
  );
} 