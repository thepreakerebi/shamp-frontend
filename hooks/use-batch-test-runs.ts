import { useAuth } from "@/lib/auth";
import { useTestRunsStore } from "@/lib/store/testruns";
import { useBatchTestsStore } from "@/lib/store/batchTests";
import type { TestRun } from "@/hooks/use-testruns";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

export interface BatchTest {
  _id: string;
  project: string;
  batchPersona: string;
  test: string;
  testRuns: string[];
  // Add other fields as needed
}

export interface BatchTestActionResult {
  success: boolean;
  testRuns: string[];
  batchTest: BatchTest;
}

export function useBatchTestRuns() {
  const { token, currentWorkspaceId } = useAuth();
  const { addTestRunToList, updateTestRunInList } = useTestRunsStore();

  if (!token || !currentWorkspaceId) {
    // Return no-op functions when unauthenticated to avoid extra guards in callers
    return {
      startBatchTestRuns: async () => { throw new Error("Not authenticated or no workspace context"); },
      pauseBatchTestRuns: async () => { throw new Error("Not authenticated or no workspace context"); },
      resumeBatchTestRuns: async () => { throw new Error("Not authenticated or no workspace context"); },
      stopBatchTestRuns: async () => { throw new Error("Not authenticated or no workspace context"); },
      hasWorkspaceContext: false,
    } as const;
  }

  const startBatchTestRuns = async (batchTestId: string) => {
      const res = await fetch(`${API_BASE}/batchtestruns/start`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          'X-Workspace-ID': currentWorkspaceId
        },
        body: JSON.stringify({ batchTestId: batchTestId.toString() }),
      });
      if (!res.ok) throw new Error("Failed to start batch test runs");
    const data = await res.json();
    const runs: unknown[] = Array.isArray(data.testRuns) ? data.testRuns : [];
    runs.forEach(r => addTestRunToList(r as TestRun));

    // Cache runs per-batch so DetailsSection and TestRunsSection update in real-time
    const { setTestRunsForBatchTest } = useBatchTestsStore.getState();
    if (runs.length) {
      const existing = useBatchTestsStore.getState().batchTestRuns[batchTestId] ?? [];
      const merged = [...existing, ...(runs as TestRun[])];
      const dedup = Array.from(new Map(merged.map(r => [ (r as { _id: string })._id, r ])).values());
      setTestRunsForBatchTest(batchTestId, dedup as TestRun[]);
    }

    // Background-refresh full run list so we don't miss earlier runs
    (async () => {
      try {
        const resFull = await fetch(`${API_BASE}/batchtests/${batchTestId}/testruns`, {
          credentials: "include",
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Workspace-ID': currentWorkspaceId,
          },
        });
        if (resFull.ok) {
          const fullRuns = (await resFull.json()) as TestRun[];
          const dedupFull = Array.from(new Map(fullRuns.map(r => [ (r as { _id: string })._id, r ])).values());
          setTestRunsForBatchTest(batchTestId, dedupFull as TestRun[]);
          dedupFull.forEach(r => addTestRunToList(r as TestRun));
        }
      } catch {/* ignore */}
    })();

    // If backend returns batchTest object, merge it into the global list so
    // clients relying on rich fields (project, test, batchPersona) keep them.
    if (data.batchTest) {
      useBatchTestsStore.getState().updateBatchTestInList(data.batchTest);
    }

    return data;
  };

  const postAction = async (id: string, action: "pause" | "resume" | "stop") => {
    const res = await fetch(`${API_BASE}/batchtestruns/${id.toString()}/${action}`, {
        method: "POST",
        credentials: "include",
        headers: { 
          Authorization: `Bearer ${token}`,
          'X-Workspace-ID': currentWorkspaceId
        },
      });
    if (!res.ok) throw new Error("Failed to post action");
    const data = await res.json();
    const runs: unknown[] = Array.isArray(data.testRuns) ? data.testRuns : [];
    runs.forEach(r => updateTestRunInList(r as TestRun));

    const { setTestRunsForBatchTest } = useBatchTestsStore.getState();
    if (runs.length) {
      const existing = useBatchTestsStore.getState().batchTestRuns[id] ?? [];
      const merged = [...existing, ...(runs as TestRun[])];
      const dedup = Array.from(new Map(merged.map(r => [ (r as { _id: string })._id, r ])).values());
      setTestRunsForBatchTest(id, dedup as TestRun[]);
    }

    if (data.batchTest) {
      useBatchTestsStore.getState().updateBatchTestInList(data.batchTest);
    }

    return data as BatchTestActionResult;
  };

  const pauseBatchTestRuns = (id: string) => postAction(id, "pause");
  const resumeBatchTestRuns = (id: string) => postAction(id, "resume");
  const stopBatchTestRuns = (id: string) => postAction(id, "stop");

  return {
    startBatchTestRuns,
    pauseBatchTestRuns,
    resumeBatchTestRuns,
    stopBatchTestRuns,
    hasWorkspaceContext: !!currentWorkspaceId,
  } as const;
}