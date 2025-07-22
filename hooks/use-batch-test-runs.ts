import { useAuth } from "@/lib/auth";
import { useTestRunsStore } from "@/lib/store/testruns";
import { useBatchTestsStore } from "@/lib/store/batchTests";
import type { TestRun } from "@/hooks/use-testruns";
import { apiFetch } from '@/lib/api-client';

// apiFetch used for mutations

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

  // We rely on the auth cookie; token may be null. Workspace id is required
  // for backend access control, but callers already handle the no-context
  // scenario by disabling the run buttons. Therefore we expose the functions
  // unconditionally and let them throw only when workspaceId is missing.

  const startBatchTestRuns = async (batchTestId: string) => {
    if (!currentWorkspaceId) throw new Error('No workspace context');
      const res = await apiFetch('/batchtestruns/start', { token, workspaceId: currentWorkspaceId, method: 'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ batchTestId: batchTestId.toString() }) });
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
        const resFull = await apiFetch(`/batchtests/${batchTestId}/testruns`, { token, workspaceId: currentWorkspaceId });
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
    if (!currentWorkspaceId) throw new Error('No workspace context');
    const res = await apiFetch(`/batchtestruns/${id}/${action}`, { token, workspaceId: currentWorkspaceId, method: 'POST' });
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