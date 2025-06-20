"use client";
import { Test } from "@/hooks/use-tests";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ProjectBadge } from "@/components/ui/project-badge";
import { PersonaBadge } from "@/components/ui/persona-badge";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";
import { useTestRuns } from "@/hooks/use-testruns";
import { usePersonas } from "@/hooks/use-personas";
import { Loader2, CalendarClock } from "lucide-react";
import { toast } from "sonner";
import { RowActionsDropdown } from "../../_components/row-actions-dropdown";
import { useTests } from "@/hooks/use-tests";
import { useRouter } from "next/navigation";

/**
 * DetailsSection
 * Displays key information about a usability test in a clean, grouped layout.
 * - Test name & description
 * - Project & persona badges
 * - Run statistics (successful / failed / total)
 */
export default function DetailsSection({ test }: { test: Test }) {
  const { startTestRun } = useTestRuns();
  const { moveTestToTrash, deleteTest, duplicateTest } = useTests();
  const [running, setRunning] = useState(false);
  const router = useRouter();
  const { personas: allPersonas } = usePersonas();

  const handleRun = async () => {
    if (running) return;
    setRunning(true);
    try {
      await startTestRun(test._id);
      toast.success("Test run started");
    } catch {
      toast.error("Failed to start test run");
    }
    setRunning(false);
  };

  const handleSchedule = () => {
    router.push(`/tests/${test._id}/schedule-run`);
  };

  // Build list of persona names robustly
  const displayedPersonaNames = useMemo(() => {
    const namesArr: unknown = (test as unknown as { personaNames?: unknown }).personaNames;
    if (Array.isArray(namesArr) && namesArr.length && namesArr.every(n=>typeof n === "string")) {
      return namesArr as string[];
    }

    const personasField = (test as unknown as { personas?: unknown }).personas as unknown;
    if (Array.isArray(personasField) && personasField.length) {
      return (personasField as unknown[]).map((p) => {
        if (p && typeof p === "object" && "name" in p) return (p as {name:string}).name;
        if (typeof p === "string" && allPersonas) {
          const match = allPersonas.find(ap => ap._id === p);
          return match?.name;
        }
        return undefined;
      }).filter((v): v is string => Boolean(v));
    }

    // fallback single persona field
    if (test.persona && typeof test.persona === "object" && "name" in test.persona) {
      return [(test.persona as { name: string }).name];
    }
    return [];
  }, [test, allPersonas]);

  // successfulRuns and failedRuns may be undefined on type Test, fallback to 0
  const successfulRuns = "successfulRuns" in test ? (test as unknown as { successfulRuns?: number }).successfulRuns ?? 0 : 0;
  const failedRuns = "failedRuns" in test ? (test as unknown as { failedRuns?: number }).failedRuns ?? 0 : 0;
  const totalRuns = "totalRuns" in test
    ? (test as unknown as { totalRuns?: number }).totalRuns ?? successfulRuns + failedRuns
    : successfulRuns + failedRuns;

  // Prepare badges content using computed names or detailed objects
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const personasWithIds: Array<{ _id: string; name: string }> | undefined = (test as unknown as { personas?: Array<{ _id: string; name: string }> }).personas;

  return (
    <article className="p-4 space-y-6" aria-labelledby="test-details-heading">
      {/* Header */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <section className="space-y-1 flex-1 min-w-0">
          <h2 id="test-details-heading" className="text-xl font-semibold leading-tight truncate">
            {test.name}
          </h2>
          {test.description && (
            <p className="text-sm text-muted-foreground max-w-prose line-clamp-2">
              {test.description}
            </p>
          )}
        </section>
        <section className="flex items-center gap-4 shrink-0">
          <RowActionsDropdown
            testId={test._id}
            testName={test.name}
            actions={{ moveTestToTrash, deleteTest, duplicateTest }}
            showOpen={false}
            showRun={false}
          />
          <Button variant="outline" onClick={handleSchedule} className="flex items-center gap-1">
            <CalendarClock className="w-4 h-4" />
            Schedule run
          </Button>
          <Button onClick={handleRun} variant="secondary" disabled={running}>
            {running && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Run test
          </Button>
        </section>
      </header>

      <Separator />

      {/* Project & Personas */}
      <section className="flex flex-col md:flex-row gap-6">
        {/* Project */}
        <div className="space-y-2 w-full md:w-1/3">
          <h3 className="text-sm font-medium text-muted-foreground">Project</h3>
          {(() => {
            if (test.project && typeof test.project === "object" && "name" in test.project) {
              return (
                <ProjectBadge name={(test.project as { _id: string; name: string }).name} />
              );
            }
            return null;
          })()}
        </div>

        {/* Personas */}
        <div className="space-y-2 flex-1">
          <h3 className="text-sm font-medium text-muted-foreground">Personas</h3>
          <div className="flex flex-wrap items-center gap-2">
            {displayedPersonaNames && displayedPersonaNames.length > 0 ? (
              displayedPersonaNames.map(name => <PersonaBadge key={name} name={name} />)
            ) : personasWithIds && personasWithIds.length > 0 ? (
              personasWithIds.map(p => <PersonaBadge key={p._id} name={p.name} />)
            ) : test.persona && typeof test.persona === "object" && "name" in test.persona ? (
              <PersonaBadge name={(test.persona as { _id: string; name: string }).name} />
            ) : (
              <span className="text-sm text-muted-foreground">–</span>
            )}
          </div>
        </div>
      </section>

      <Separator />

      {/* Run statistics */}
      <footer className="flex items-center gap-2 flex-wrap">
        <h3 className="sr-only">Run statistics</h3>
        <Badge
          variant="secondary"
          className="px-2 py-1 text-sm bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
          aria-label={`Successful runs: ${successfulRuns}`}
        >
          ✓ {successfulRuns} {successfulRuns === 1 ? "successful run" : "successful runs"}
        </Badge>
        <Badge
          variant="secondary"
          className="px-2 py-1 text-sm bg-red-500/10 text-red-700 dark:text-red-400"
          aria-label={`Failed runs: ${failedRuns}`}
        >
          ✗ {failedRuns} {failedRuns === 1 ? "failed run" : "failed runs"}
        </Badge>
        {totalRuns > 0 && (
          <Badge
            variant="secondary"
            className="px-2 py-1 text-sm bg-primary/10 text-primary-foreground dark:text-primary"
            aria-label={`Total runs: ${totalRuns}`}
          >
            {totalRuns} {totalRuns === 1 ? "total run" : "total runs"}
          </Badge>
        )}
      </footer>
    </article>
  );
} 