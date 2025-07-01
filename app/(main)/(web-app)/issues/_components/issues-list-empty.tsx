"use client";
import { Bug } from "lucide-react";
import React from "react";

export function IssuesListEmpty() {
  return (
    <section className="flex flex-col items-center justify-center w-full py-16 gap-4 bg-background rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
      <Bug className="text-muted-foreground mb-2" size={40} />
      <h2 className="text-xl font-semibold text-foreground mb-1">No issues found</h2>
      <p className="text-muted-foreground text-sm mb-4 text-center max-w-xs">
        Great! We didn&apos;t detect any issues yet. New issues will appear here after running tests.
      </p>
    </section>
  );
} 