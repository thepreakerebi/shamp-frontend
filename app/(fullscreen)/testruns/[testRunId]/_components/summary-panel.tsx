"use client";
import { ArrowLeftIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ThemeSwitcher } from "@/app/(main)/(web-app)/_components/theme-switcher";
import { useRouter } from "next/navigation";
import type { TestRunStatus } from "@/hooks/use-testruns";
import React from "react";
import { TestRunCardActionsDropdown } from "@/app/(main)/(web-app)/tests/[testId]/_components/test-run-card-actions-dropdown";
import { useTestRuns } from "@/hooks/use-testruns";

interface Props {
  run: TestRunStatus;
  personaName?: string;
}

export function SummaryPanel({ run, personaName }: Props) {
  const router = useRouter();
  const { deleteTestRun, moveTestRunToTrash, testRuns } = useTestRuns();

  // Pick latest run data from store if available
  const liveRun = (testRuns ?? []).find(r => r._id === run._id) as TestRunStatus | undefined;
  const active = liveRun ?? run;

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      succeeded: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
      failed: "bg-red-500/10 text-red-700 dark:text-red-400",
    };
    const cls = map[status] ?? "bg-muted text-muted-foreground";
    return (
      <Badge variant="secondary" className={cn("px-1.5 py-0 text-xs", cls)}>
        {status}
      </Badge>
    );
  };

  const browserStatusBadge = (status?: string) => {
    if (!status) return null;
    const running = status === "running";
    return (
      <Badge variant="outline" className="text-xs whitespace-nowrap flex items-center gap-1">
        {running && (
          <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>
        )}
        {status}
      </Badge>
    );
  };

  // Extract narration and summary from browserUseOutput
  const narrationMatch = active.browserUseOutput?.match(/<narration>([\s\S]*?)<\/narration>/i);
  const summaryMatch = active.browserUseOutput?.match(/<summary>([\s\S]*?)<\/summary>/i);

  let narration: string | undefined = narrationMatch ? narrationMatch[1].trim() : undefined;
  const summary: string | undefined = summaryMatch ? summaryMatch[1].trim() : undefined;

  // Fallback: if both tags are absent but we have plain text, treat it as narration
  if (!narration && !summary && active.browserUseOutput) {
    narration = active.browserUseOutput.trim();
  }

  // Pull additional analysis data for prominent display
  const analysisSummary = (() => {
    if (!active.analysis || typeof active.analysis !== "object") return undefined;
    const obj = active.analysis as Record<string, unknown>;
    const val = obj["summary"];
    return typeof val === "string" ? val : undefined;
  })();

  const personaAlignment = (() => {
    if (!active.analysis || typeof active.analysis !== "object") return undefined;
    const obj = active.analysis as Record<string, unknown>;
    const val1 = obj["personaAlignment"];
    if (typeof val1 === "string") return val1;
    const val2 = obj["persona_alignment"];
    if (typeof val2 === "string") return val2;
    return undefined;
  })();

  const handleActionComplete = () => {
    router.push('/test-runs');
  };

  return (
    <aside className="flex flex-col h-full overflow-hidden border-r">
      {/* Header */}
      <header className="p-4 flex flex-col gap-4 border-b">
        <section className="flex items-start gap-2">
          <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="Back">
            <ArrowLeftIcon className="w-4 h-4" />
          </Button>
          <section className="flex-1">
            <h2 className="font-semibold text-lg leading-none">Summary</h2>
            {personaName && <p className="text-xs text-muted-foreground mt-1">{personaName}&rsquo;s run</p>}
          </section>
          {/* Actions dropdown */}
          <TestRunCardActionsDropdown
            runId={run._id}
            runPersonaName={personaName}
            actions={{ deleteTestRun, moveTestRunToTrash }}
            showOpenOptions={false}
            onActionComplete={handleActionComplete}
          />
        </section>
        <section className="flex items-center gap-2">
          {( ["finished", "stopped"].includes(active.browserUseStatus ?? "") ) && statusBadge(active.status)}
          {active.status !== "cancelled" && browserStatusBadge(active.browserUseStatus)}
        </section>
      </header>

      {/* Scrollable content */}
      <section className="flex-1 overflow-auto p-4 space-y-6">
        {narration && (
          <section>
            <h3 className="font-semibold mb-1">Narration</h3>
            <p className="whitespace-pre-line text-sm text-muted-foreground">{narration}</p>
          </section>
        )}
        {summary && (
          <section>
            <h3 className="font-semibold mb-1">Run Summary</h3>
            <p className="whitespace-pre-line text-sm text-muted-foreground">{summary}</p>
          </section>
        )}
        {analysisSummary && (
          <section>
            <h3 className="font-semibold mb-1">Analysis Summary</h3>
            <p className="whitespace-pre-line text-sm text-muted-foreground">{analysisSummary}</p>
          </section>
        )}
        {personaAlignment && (
          <section>
            <h3 className="font-semibold mb-1">Persona Alignment</h3>
            <p className="whitespace-pre-line text-sm text-muted-foreground">{personaAlignment}</p>
          </section>
        )}
        {active.analysis && (
          <section className="space-y-4">
            <h3 className="font-semibold">AI Analysis</h3>
            {Object.entries(active.analysis).map(([key, value]) => {
              // Skip empty values
              if (value === undefined || value === null) return null;

              // Exclude keys we show elsewhere or user does not want
              const excludedKeys = [
                "summary",
                "personaAlignment",
                "persona_alignment",
                "helpRequests",
                "help_requests",
                "backtracks",
                "goalsAchieved",
                "goals_achieved",
                "errorsDetected",
                "errors_detected",
                "stepsCount",
                "steps_count",
              ];
              if (excludedKeys.includes(key)) return null;

              if (Array.isArray(value)) {
                if (value.length === 0) return null;
                return (
                  <section key={key}>
                    <h4 className="font-medium capitalize mb-1">{key}</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                      {value.map((v, i) => (
                        <li key={i}>{String(v)}</li>
                      ))}
                    </ul>
                  </section>
                );
              }

              if (typeof value === "string") {
                if (value.trim() === "") return null;
                return (
                  <section key={key}>
                    <p className="text-sm text-muted-foreground"><span className="font-medium capitalize">{key}: </span>{value}</p>
                  </section>
                );
              }

              if (typeof value === "number") {
                return (
                  <section key={key}>
                    <p className="text-sm text-muted-foreground"><span className="font-medium capitalize">{key}: </span>{value}</p>
                  </section>
                );
              }
              return null;
            })}
          </section>
        )}
      </section>

      {/* Footer */}
      <footer className="p-4 border-t">
        <ThemeSwitcher />
      </footer>
    </aside>
  );
} 