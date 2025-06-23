"use client";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useBatchTestRuns } from "@/hooks/use-batch-test-runs";
import { toast } from "sonner";
import { BatchTest } from "@/hooks/use-batch-tests";
import { EllipsisVerticalIcon } from "lucide-react";

export default function DetailsSection({ batch }: { batch: BatchTest }) {
  const { startBatchTestRuns } = useBatchTestRuns();
  const [running, setRunning] = useState(false);

  const handleRun = async () => {
    if (running) return;
    setRunning(true);
    try {
      await startBatchTestRuns(batch._id);
      toast.success("Batch test runs started");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to start runs");
    } finally {
      setRunning(false);
    }
  };

  const testName = typeof batch.test === "object" && batch.test ? (batch.test as { name?: string }).name : undefined;

  return (
    <article className="p-4 space-y-6" aria-labelledby="batch-details-heading">
      <header className="flex items-start justify-between gap-4">
        <h2 id="batch-details-heading" className="text-xl font-semibold truncate flex-1 min-w-0">
          {testName ?? "Batch Test"}
        </h2>
        <Button variant="ghost" size="icon" aria-label="Batch test options" disabled>
          <EllipsisVerticalIcon className="w-4 h-4" />
        </Button>
        <Button onClick={handleRun} variant="secondary" disabled={running} className="gap-1">
          {running && <Loader2 className="w-4 h-4 animate-spin" />}
          Run batch
        </Button>
      </header>
    </article>
  );
} 