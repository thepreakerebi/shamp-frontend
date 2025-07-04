"use client";
import { Button } from "@/components/ui/button";
import { Activity, Play } from "lucide-react";
import React from "react";

interface TestRunsListEmptyProps {
  onRunTest?: () => void;
}

export function TestRunsListEmpty({ onRunTest }: TestRunsListEmptyProps) {
  return (
    <section className="px-4 mt-4 w-full">
      <section className="flex flex-col items-center justify-center w-full py-16 gap-4 bg-background rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
      <Activity className="text-muted-foreground mb-2" size={40} />
      <h2 className="text-xl font-semibold text-foreground mb-1">No test runs found</h2>
      <p className="text-muted-foreground text-sm mb-4 text-center max-w-xs">
        You haven&apos;t executed any test runs yet. Start by running a test to see insights about your web app!
      </p>
      {onRunTest && (
        <Button onClick={onRunTest} className="gap-2" variant="default">
          <Play className="size-4" />
          Run test
        </Button>
        )}
      </section>
    </section>
  );
} 