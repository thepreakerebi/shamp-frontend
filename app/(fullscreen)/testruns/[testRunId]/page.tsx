"use client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useTestRuns } from "@/hooks/use-testruns";

export default function TestRunCanvasPage() {
  const { testRunId } = useParams<{ testRunId: string }>();
  const { getTestRunStatus } = useTestRuns();
  const [personaName, setPersonaName] = useState<string | undefined>();

  useEffect(() => {
    (async () => {
      if (!testRunId) return;
      try {
        const run = await getTestRunStatus(testRunId);
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error personaName may not be present in type
        setPersonaName(run.personaName);
      } catch {
        /* ignore */
      }
    })();
  }, [testRunId, getTestRunStatus]);

  return (
    <div className="flex items-center justify-center h-screen w-full">
      <h1 className="text-3xl font-bold">
        {personaName ? `${personaName} Test Run` : "Loading..."}
      </h1>
    </div>
  );
} 