"use client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useProjects } from "@/hooks/use-projects";
import { useTestRuns } from "@/hooks/use-testruns";
import { useTestRunsStore } from "@/lib/store/testruns";
import { TestRunCard, MinimalRun } from "@/app/(main)/(web-app)/tests/[testId]/_components/test-run-card";
import { TestRunsCardSkeleton } from "@/app/(main)/(web-app)/tests/[testId]/_components/test-runs-card-skeleton";
import TestRunsFilter from "@/app/(main)/(web-app)/tests/[testId]/_components/test-runs-filter";
import { TestRunsListEmpty } from "@/app/(main)/(web-app)/test-runs/_components/test-runs-list-empty";

export function ProjectTestrunsTabContent() {
  const { projectId } = useParams<{ projectId: string }>();
  const { getProjectTestruns } = useProjects();
  const { testRuns: globalRuns, refetchAllTestRuns } = useTestRuns();
  const storeRuns = useTestRunsStore(s => s.testRuns);

  // Prefill from global store for snappy UX
  const initial = (globalRuns ?? []).filter(r => typeof r.test === "string" ? false : true); // we'll further filter later

  const [runs, setRuns] = useState<import("@/hooks/use-testruns").TestRun[] | null>(initial);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ result: "any", run: "any", persona: "any" });

  useEffect(() => {
    if (!projectId) return;
    let mounted = true;
    // If we already have some runs, don't block UI
    if (!runs || runs.length === 0) setLoading(true);

    // Kick off a workspace-level fetch so other views benefit
    refetchAllTestRuns();

    getProjectTestruns(projectId as string)
      .then((data: unknown[]) => {
        const enriched = data.map((r) => {
          // r is unknown, cast to record
          const run = r as Record<string, unknown>;
          if (!run.personaName) {
            const personaObj = run.persona as Record<string, unknown> | undefined;
            const n = personaObj && typeof personaObj === 'object' ? (personaObj.name as string|undefined) : undefined;
            return { ...run, personaName: n } as unknown;
          }
          return r;
        });
        if (mounted) setRuns(enriched as import("@/hooks/use-testruns").TestRun[]);
      })
      .catch(() => {
        if (mounted) setRuns([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [projectId]);

  // When the global TestRuns store updates (e.g. a run is deleted or moved to
  // trash), remove or update the matching items in our local state so the UI
  // reflects the change instantly without a manual refresh.
  useEffect(() => {
    if (!storeRuns) return;
    setRuns(prev => {
      if (!prev) return prev;
      const ids = new Set(storeRuns.map(r => r._id));
      const updated = prev.filter(r => ids.has(r._id));
      return updated.length === prev.length ? prev : updated;
    });
  }, [storeRuns]);

  if (loading && (runs === null || runs.length === 0)) {
    return <TestRunsCardSkeleton />;
  }

  if (!loading && (runs === null || runs.length === 0)) {
    return <TestRunsListEmpty />;
  }

  const personaOptions = Array.from(
    new Set(
      (runs ?? []).map(r => {
        const pName = (r as { personaName?: string }).personaName;
        if (pName) return pName;
        if (r.persona && typeof r.persona === "object") {
          return (r.persona as { name?: string }).name;
        }
        return undefined;
      }).filter(Boolean)
    )
  ) as string[];

  const filtered = (runs ?? []).filter(r => {
    if (filters.result !== "any" && r.status !== filters.result) return false;
    if (filters.run !== "any" && r.browserUseStatus !== filters.run) return false;
    const pName = (r as { personaName?: string }).personaName || (r.persona && typeof r.persona === "object" ? (r.persona as { name?: string }).name : undefined);
    if (filters.persona !== "any" && pName !== filters.persona) return false;
    return true;
  });

  return (
    <section className="p-4 space-y-4">
      <section className="sticky top-[60px] z-10 bg-background flex items-center justify-between gap-4 py-2">
        <h2 className="text-xl font-semibold">Project test runs</h2>
        <TestRunsFilter personaOptions={personaOptions} filters={filters} onChange={setFilters} />
      </section>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">No runs match the selected filters.</p>
      ) : (
        <section className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filtered.map(run => (
            <TestRunCard key={run._id} run={run as unknown as MinimalRun} />
          ))}
        </section>
      )}
    </section>
  );
} 