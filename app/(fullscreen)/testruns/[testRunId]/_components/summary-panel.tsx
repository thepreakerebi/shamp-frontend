"use client";
import { ArrowLeftIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ThemeSwitcher } from "@/app/(main)/(web-app)/_components/theme-switcher";
import { useRouter } from "next/navigation";
import type { TestRunStatus } from "@/hooks/use-testruns";
import React from "react";

interface Props {
  run: TestRunStatus;
  personaName?: string;
}

export function SummaryPanel({ run, personaName }: Props) {
  const router = useRouter();

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
  const narrationMatch = run.browserUseOutput?.match(/<narration>([\s\S]*?)<\/narration>/i);
  const summaryMatch = run.browserUseOutput?.match(/<summary>([\s\S]*?)<\/summary>/i);
  const narration = narrationMatch ? narrationMatch[1].trim() : undefined;
  const summary = summaryMatch ? summaryMatch[1].trim() : undefined;

  return (
    <aside className="flex flex-col h-full overflow-hidden border-r">
      {/* Header */}
      <header className="p-4 flex flex-col gap-4 border-b">
        <div className="flex items-start gap-2">
          <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="Back">
            <ArrowLeftIcon className="w-4 h-4" />
          </Button>
          <div>
            <h2 className="font-semibold text-lg leading-none">Summary</h2>
            {personaName && <p className="text-xs text-muted-foreground mt-1">{personaName}&rsquo;s run</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {(["finished", "stopped"].includes(run.browserUseStatus ?? "")) && statusBadge(run.status)}
          {run.status !== "cancelled" && browserStatusBadge(run.browserUseStatus)}
        </div>
      </header>

      {/* Scrollable content */}
      <section className="flex-1 overflow-auto p-4 space-y-6">
        {narration && (
          <div>
            <h3 className="font-semibold mb-1">Narration</h3>
            <p className="whitespace-pre-line text-sm text-muted-foreground">{narration}</p>
          </div>
        )}
        {summary && (
          <div>
            <h3 className="font-semibold mb-1">Run Summary</h3>
            <p className="whitespace-pre-line text-sm text-muted-foreground">{summary}</p>
          </div>
        )}
        {run.analysis && (
          <div className="space-y-4">
            <h3 className="font-semibold">AI Analysis</h3>
            {Object.entries(run.analysis).map(([key, value]) => {
              if (Array.isArray(value)) {
                return (
                  <div key={key}>
                    <h4 className="font-medium capitalize mb-1">{key}</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                      {value.map((v, i) => (
                        <li key={i}>{String(v)}</li>
                      ))}
                    </ul>
                  </div>
                );
              }
              if (typeof value === "string" || typeof value === "number") {
                return (
                  <p key={key} className="text-sm text-muted-foreground"><span className="font-medium capitalize">{key}: </span>{String(value)}</p>
                );
              }
              return null;
            })}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="p-4 border-t">
        <ThemeSwitcher />
      </footer>
    </aside>
  );
} 