import { useAuth } from "@/lib/auth";
import { useTestRunsStore } from "@/lib/store/testruns";
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
  const { token } = useAuth();
  const { addTestRunToList, updateTestRunInList } = useTestRunsStore();

  if (!token) {
    // Return no-op functions when unauthenticated to avoid extra guards in callers
    return {
      startBatchTestRuns: async () => { throw new Error("Not authenticated"); },
      pauseBatchTestRuns: async () => { throw new Error("Not authenticated"); },
      resumeBatchTestRuns: async () => { throw new Error("Not authenticated"); },
      stopBatchTestRuns: async () => { throw new Error("Not authenticated"); },
    } as const;
  }

  const startBatchTestRuns = async (batchTestId: string) => {
      const res = await fetch(`${API_BASE}/batchtestruns/start`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ batchTestId }),
      });
      if (!res.ok) throw new Error("Failed to start batch test runs");
    const data = await res.json();
    const runs: unknown[] = Array.isArray(data.testRuns) ? data.testRuns : [];
    runs.forEach(r => addTestRunToList(r as TestRun));
    return data;
  };

  const postAction = async (id: string, action: "pause" | "resume" | "stop") => {
    const res = await fetch(`${API_BASE}/batchtestruns/${id}/${action}`, {
        method: "POST",
        credentials: "include",
        headers: { Authorization: `Bearer ${token}` },
      });
    if (!res.ok) throw new Error(`Failed to ${action} batch test runs`);
    const data = await res.json();
    const runs: unknown[] = Array.isArray(data.testRuns) ? data.testRuns : [];
    runs.forEach(r => updateTestRunInList(r as TestRun));
    return data;
  };

  return {
    startBatchTestRuns,
    pauseBatchTestRuns: (id: string) => postAction(id, "pause"),
    resumeBatchTestRuns: (id: string) => postAction(id, "resume"),
    stopBatchTestRuns: (id: string) => postAction(id, "stop"),
  } as const;
} 