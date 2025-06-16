"use client";
import { useRouter } from "next/navigation";
import { ProjectBadge } from "@/components/ui/project-badge";
import { PersonaBadge } from "@/components/ui/persona-badge";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import React from "react";
import { Test, useTests } from "@/hooks/use-tests";
import { useTestRuns } from "@/hooks/use-testruns";
import { RowActionsDropdown } from "./row-actions-dropdown";
import { useAuth } from "@/lib/auth";
import { Separator } from "@/components/ui/separator";

export function TestCard({ test }: { test: Test }) {
  const router = useRouter();
  const { moveTestToTrash, deleteTest, duplicateTest } = useTests();
  const { testRuns } = useTestRuns();
  const { user } = useAuth();
  // successfulRuns and failedRuns may be undefined on type Test, fallback to 0
  const successfulRuns = 'successfulRuns' in test ? (test as unknown as { successfulRuns?: number }).successfulRuns ?? 0 : 0;
  const failedRuns = 'failedRuns' in test ? (test as unknown as { failedRuns?: number }).failedRuns ?? 0 : 0;
  const totalRuns = 'totalRuns' in test
    ? (test as unknown as { totalRuns?: number }).totalRuns ?? successfulRuns + failedRuns
    : successfulRuns + failedRuns;

  const isRunning = testRuns?.some(r => {
    const browserStatus = (r as { browserUseStatus?: string }).browserUseStatus;
    return r.test === test._id && (browserStatus === "running" || r.status === "running");
  });

  const runningBadge = (
    <Badge variant="secondary" className="px-1.5 py-0 text-xs bg-primary/10 text-primary-foreground dark:text-primary flex items-center gap-1">
      <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
      </svg>
      running
    </Badge>
  );

  const handleClick: React.MouseEventHandler<HTMLDivElement> = () => {
    router.push(`/tests/${test._id}`);
  };

  return (
    <section
      role="button"
      onClick={handleClick}
      className={cn(
        "rounded-3xl border dark:border-0 bg-card/80 hover:bg-muted/50 transition-all cursor-pointer flex flex-col p-4 gap-3 relative"
      )}
    >

      {/* Header: icon placeholder and name */}
      <header className="flex items-start gap-3">
        {/* Simple colored square as placeholder icon */}
        <figure className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-xl font-bold shrink-0" aria-hidden="true">
          {test.name?.[0]?.toUpperCase() || "T"}
        </figure>
        <section className="flex-1 min-w-0">
          <h3 className="font-semibold leading-tight truncate" title={test.name}>{test.name}</h3>
          {test.description && (
            <p className="text-sm text-muted-foreground line-clamp-2" title={test.description}>
              {test.description}
            </p>
          )}
        </section>
        <nav onClick={(e)=>e.stopPropagation()} data-stop-row>
        <RowActionsDropdown
          testId={test._id}
          testName={test.name}
          actions={{ moveTestToTrash, deleteTest, duplicateTest }}
        />
      </nav>
      </header>
      <Separator />

      {/* Badges & creator row */}
      <section className="flex flex-wrap items-center gap-2 mt-auto">
        {test.project && typeof test.project === "object" && 'name' in test.project && (
          <ProjectBadge name={(test.project as { _id: string; name: string }).name} />
        )}
        {(() => {
          const t = test as Test & { personaNames?: string[] };
          const firstPersonaName = t.personaNames && t.personaNames.length ? t.personaNames[0] : undefined;
          if (firstPersonaName) {
            return <PersonaBadge name={firstPersonaName} />;
          }
          if (test.persona && typeof test.persona === "object" && 'name' in test.persona) {
            return <PersonaBadge name={(test.persona as { _id: string; name: string }).name} />;
          }
          return null;
        })()}
        {test.createdBy && typeof test.createdBy === "object" && 'name' in test.createdBy && (
          <span className="text-xs text-muted-foreground truncate max-w-[120px]" title={(test.createdBy as { name: string }).name}>
            {(() => {
              const c = test.createdBy as { _id?: string; name: string };
              const isMe = user && (c._id ? c._id === user._id : c.name === `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim());
              return isMe ? "You" : c.name;
            })()}
          </span>
        )}
      </section>

      {/* Runs counts & running */}
      <footer className="flex items-center gap-2 pt-1">
        <Badge variant="secondary" className="px-1.5 py-0 text-xs bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
          ✓ {successfulRuns}
        </Badge>
        <Badge variant="secondary" className="px-1.5 py-0 text-xs bg-red-500/10 text-red-700 dark:text-red-400">
          ✗ {failedRuns}
        </Badge>
        {totalRuns > 0 && (
          <Badge variant="secondary" className="px-1.5 py-0 text-xs bg-primary/10 text-primary-foreground dark:text-primary">
            {totalRuns} runs
          </Badge>
        )}
        {isRunning && runningBadge}
      </footer>
    </section>
  );
} 