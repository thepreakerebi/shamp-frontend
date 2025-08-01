"use client";
import { useParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { useProjects } from "@/hooks/use-projects";
import { useProjectsStore } from "@/lib/store/projects";
import { useTestRunsStore } from "@/lib/store/testruns";
import { useTestRuns } from "@/hooks/use-testruns";
import { TestRunCard, MinimalRun } from "@/app/(main)/(web-app)/tests/[testId]/_components/test-run-card";
import { TestRunsCardSkeleton } from "@/app/(main)/(web-app)/tests/[testId]/_components/test-runs-card-skeleton";
import TestRunsFilter from "@/app/(main)/(web-app)/tests/[testId]/_components/test-runs-filter";
import { TestRunsListEmpty } from "@/app/(main)/(web-app)/test-runs/_components/test-runs-list-empty";
import { useAuth } from "@/lib/auth";
import { usePersonasStore } from "@/lib/store/personas";

export function ProjectTestrunsTabContent() {
  const { projectId } = useParams<{ projectId: string }>();
  const { getProjectTestruns } = useProjects();
  const projectsStore = useProjectsStore();
  const storeRuns = useTestRunsStore(s => s.testRuns);
  const projectStoreRuns = useProjectsStore(state => (projectId ? state.projectTestRuns[projectId as string] : undefined));
  const { token } = useAuth();
  const personasStore = usePersonasStore(state=>state.personas);

  const cached = projectId ? projectsStore.getTestRunsForProject(projectId as string) : undefined;

  // Ensure socket listeners from useTestRuns are active while this tab is
  // mounted so real-time events update the global store, which then feeds
  // into this component via `storeRuns`.
  // We don't need the returned API functions here, so we just invoke the
  // hook and ignore its return value.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _rt = useTestRuns();

  const [runs, setRuns] = useState<import("@/hooks/use-testruns").TestRun[] | null>(cached ?? null);
  const [loading, setLoading] = useState(cached ? false : true);
  const [filters, setFilters] = useState({ result: "any", run: "any", persona: "any", testName: "any" });

  // Track whether we've seen at least one Socket.IO event for this project's
  // test runs. Until then we ignore merge attempts that would wipe the list
  // and momentarily show the empty-state placeholder, causing a flicker.
  const initializedRef = useRef<boolean>(false);

  useEffect(() => {
    if (!projectId) return;
    let mounted = true;
    if (!cached) setLoading(true);

    getProjectTestruns(projectId as string, true)
      .then((data: unknown[]) => {
        const enriched = data.map((r) => {
          // r is unknown, cast to record
          const run = r as Record<string, unknown>;
          if (!run.personaName) {
            const personaObj = run.persona as Record<string, unknown> | undefined;
            const n = personaObj && typeof personaObj === 'object' ? (personaObj.name as string|undefined) : undefined;
            return { ...run, personaName: n } as unknown;
          }
          // Ensure avatarUrl present if missing
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          if (!run.personaAvatarUrl && run.persona) {
            let avatar;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if (typeof run.persona === 'object' && 'avatarUrl' in (run.persona as any)) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              avatar = (run.persona as any).avatarUrl as string | undefined;
            }
            if (!avatar && personasStore) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const pid = (run.persona as any)?._id ?? run.persona;
              const p = personasStore.find(p => p._id === pid);
              avatar = p?.avatarUrl;
            }
            if (avatar) {
              return { ...run, personaAvatarUrl: avatar } as unknown;
            }
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
  }, [projectId, token, cached, getProjectTestruns, personasStore]);

  // Merge real-time changes from the global testRuns store into this project
  // tab’s local list. We update existing runs, append new ones that belong to
  // this project, and remove runs that disappeared (e.g. deleted).
  useEffect(() => {
    if (!storeRuns || storeRuns.length === 0) return;
    setRuns(prev => {
      const list = prev ?? [];
      // Map current runs by id for quick lookup
      const currentMap = new Map(list.map(r => [r._id, r]));

      // Helper to extract project id from run.project (string or {_id})
      const extractPid = (run: { project?: unknown }): string | undefined => {
        const p = run.project;
        if (!p) return undefined;
        if (typeof p === 'string') return p;
        if (typeof p === 'object' && p && '_id' in p) return (p as { _id: string })._id;
        return undefined;
      };

      // Determine which global runs belong to this project
      const relevant = storeRuns.filter(r => extractPid(r as { project?: unknown }) === projectId);

      // Build merged list using relevant runs and also update any currently
      // displayed run whose _id appears in storeRuns even if its project
      // field is missing (socket events omit project). This guarantees pause/
      // resume/stop status updates propagate.

      const storeMap = new Map(storeRuns.map(r => [r._id, r]));

      const merged: import("@/hooks/use-testruns").TestRun[] = relevant.map(r => {
        const existing = currentMap.get(r._id);
        return existing ? { ...existing, ...r } : (r as unknown as import("@/hooks/use-testruns").TestRun);
      });

      // Update existing items that weren't included in "relevant" because of
      // missing project field, but whose status changed.
      list.forEach(orig => {
        if (!merged.some(r => r._id === orig._id) && storeMap.has(orig._id)) {
          merged.push({ ...orig, ...storeMap.get(orig._id)! });
        }
      });

      // If we haven't received any socket events for this project yet, avoid
      // replacing the existing list with an empty array (which would trigger
      // the empty-state UI). Once we receive at least one relevant event we
      // mark the project as initialized so further real-time diffs apply.
      if (!initializedRef.current) {
        if (merged.length === 0) {
          return prev;
        }
        initializedRef.current = true;
      }

      // If length and content unchanged, skip setState to avoid extra renders
      if (merged.length === list.length && merged.every((r, i) => {
        const prevItem = list[i] as import("@/hooks/use-testruns").TestRun;
        return r._id === prevItem._id && r.browserUseStatus === prevItem.browserUseStatus && r.status === prevItem.status;
      })) {
        return prev;
      }
      return merged as unknown as import("@/hooks/use-testruns").TestRun[];
    });
  }, [storeRuns, projectId]);

  // If the project-specific cache becomes available later (e.g., after fetch completed in background), adopt it
  useEffect(() => {
    if (projectStoreRuns && (runs === null || runs.length === 0)) {
      setRuns(projectStoreRuns as unknown as import("@/hooks/use-testruns").TestRun[]);
      setLoading(false);
    }
  }, [projectStoreRuns, runs]);

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

  const testNameOptions = Array.from(
    new Set(
      (runs ?? []).map(r => (r as { testName?: string }).testName).filter(Boolean)
    )
  ) as string[];

  const filtered = (runs ?? []).filter(r => {
    if (filters.result !== "any" && r.status !== filters.result) return false;
    if (filters.run !== "any" && r.browserUseStatus !== filters.run) return false;
    const pName = (r as { personaName?: string }).personaName || (r.persona && typeof r.persona === "object" ? (r.persona as { name?: string }).name : undefined);
    if (filters.persona !== "any" && pName !== filters.persona) return false;
    const tName = (r as { testName?: string }).testName;
    if (filters.testName !== "any" && tName !== filters.testName) return false;
    return true;
  });

  return (
    <section className="p-4 space-y-4">
      <section className="sticky top-[60px] z-10 bg-background flex items-center justify-between gap-4 py-2">
        <h2 className="text-xl font-semibold">Project test runs · {(runs ?? []).length}</h2>
        <TestRunsFilter personaOptions={personaOptions} testNameOptions={testNameOptions} filters={filters} onChange={setFilters} />
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