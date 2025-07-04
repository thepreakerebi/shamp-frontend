import { useAuth } from "@/lib/auth";
import { useEffect, useCallback } from "react";
import io from "socket.io-client";
import { useBatchTestsStore } from "@/lib/store/batchTests";
import { useTestRunsStore } from "@/lib/store/testruns";
import type { TestRun } from "@/hooks/use-testruns";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL as string;

export interface BatchTest {
  _id: string;
  project: string | { _id: string; name?: string };
  test: string | { _id: string; name?: string; description?: string };
  batchPersona?: string | { _id: string; name?: string };
  testruns?: string[];
  testrunsCount?: number;
  successfulRuns?: number;
  failedRuns?: number;
  status?: 'idle' | 'running' | 'paused' | 'stopped' | 'completed';
  createdBy?: string;
  trashed?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface BatchTestAnalysis {
  result: Record<string, unknown>;
  createdAt: string;
  triggeredBy?: string;
}

export type BatchTestAnalysisHistoryEntry = BatchTestAnalysis;

const fetcher = (url: string, token: string, workspaceId?: string | null) =>
  fetch(`${API_BASE}${url}`, {
    credentials: "include",
    headers: { 
      Authorization: `Bearer ${token}`,
      ...(workspaceId ? { 'X-Workspace-ID': workspaceId } : {})
    },
  }).then(res => {
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
  });

export function useBatchTests() {
  const { token, currentWorkspaceId } = useAuth();
  const {
    batchTests,
    batchTestsLoading,
    batchTestsError,
    setBatchTests,
    setBatchTestsLoading,
    setBatchTestsError,
    addBatchTestToList,
    updateBatchTestInList,
    removeBatchTestFromList,
    trashedBatchTests,
    setTrashedBatchTests,
    emptyTrashedBatchTests,
  } = useBatchTestsStore();
  const { addTestRunToList } = useTestRunsStore();

  const fetchBatchTests = useCallback(async () => {
    if (!token || !currentWorkspaceId) {
      setBatchTestsLoading(false);
      setBatchTests([]);
      return;
    }
    setBatchTestsLoading(true);
    setBatchTestsError(null);
    try {
      const data = await fetcher("/batchtests", token, currentWorkspaceId);
      if (Array.isArray(data)) {
        setBatchTests(data.filter((b: BatchTest) => !b.trashed));
      } else {
        setBatchTests([]);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setBatchTestsError(err.message);
      } else {
        setBatchTestsError("Failed to fetch batch tests");
      }
    } finally {
      setBatchTestsLoading(false);
    }
  }, [token, currentWorkspaceId, setBatchTests, setBatchTestsLoading, setBatchTestsError]);

  const fetchTrashedBatchTests = useCallback(async () => {
    if (!token || !currentWorkspaceId) return;
    setBatchTestsLoading(true);
    try {
      const data = await fetcher('/batchtests/trashed', token, currentWorkspaceId);
      if (Array.isArray(data)) {
        setTrashedBatchTests(data);
      }
    } finally {
      setBatchTestsLoading(false);
    }
  }, [token, currentWorkspaceId, setTrashedBatchTests, setBatchTestsLoading]);

  useEffect(() => {
    if (!token || !currentWorkspaceId) return;
    fetchBatchTests();
    fetchTrashedBatchTests();
  }, [token, currentWorkspaceId, fetchBatchTests, fetchTrashedBatchTests]);

  useEffect(() => {
    if (!token || !currentWorkspaceId) return;
    const socket = io(SOCKET_URL, {
      transports: ["websocket"],
      auth: { token, workspaceId: currentWorkspaceId },
    });
    const handleUpdate = () => {
      fetchBatchTests();
    };

    // For created / deleted / generic updates just refetch active list.
    socket.on("batchTest:created", handleUpdate);
    socket.on("batchTest:deleted", handleUpdate);
    socket.on("batchTest:statusUpdated", handleUpdate);

    // Generic handler - merge and rely on updateBatchTestInList logic
    const mergeHandler = (bt: BatchTest) => {
      updateBatchTestInList(bt);
    };

    socket.on("batchTest:updated", mergeHandler);
    socket.on("batchTest:trashed", mergeHandler);

    // Handle analysis updates separately to merge latest analysis into store
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- server payload lacks type details
    socket.on("batchTest:analysisUpdated", (payload: { _id: string; latestAnalysis: any }) => {
      // Get the current batch test from store to merge properly
      const currentBatch = useBatchTestsStore.getState().batchTests?.find(bt => bt._id === payload._id);
      if (currentBatch) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const currentAnalysis = (currentBatch as any).analysis || [];
        // Add the new analysis to the beginning of the array (newest first)
        const updatedAnalysis = [payload.latestAnalysis, ...currentAnalysis];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        updateBatchTestInList({ _id: payload._id, analysis: updatedAnalysis } as any);
      } else {
        // If we don't have the batch test in store, just set the analysis array with the latest
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        updateBatchTestInList({ _id: payload._id, analysis: [payload.latestAnalysis] } as any);
      }
    });

    return () => {
      socket.off("batchTest:created", handleUpdate);
      socket.off("batchTest:deleted", handleUpdate);
      socket.off("batchTest:statusUpdated", handleUpdate);
      socket.off("batchTest:updated", mergeHandler);
      socket.off("batchTest:trashed", mergeHandler);
      socket.off("batchTest:analysisUpdated");
      socket.disconnect();
    };
  }, [fetchBatchTests, token, currentWorkspaceId]);

  const getBatchTestById = async (id: string): Promise<BatchTest> => {
    if (!token || !currentWorkspaceId) throw new Error("Not authenticated or no workspace context");
    const res = await fetch(`${API_BASE}/batchtests/${id}`, {
      credentials: "include",
      headers: { 
        Authorization: `Bearer ${token}`,
        'X-Workspace-ID': currentWorkspaceId
      },
    });
    if (!res.ok) throw new Error("Failed to fetch batch test");
    const batch = await res.json();
    addBatchTestToList(batch);
    return batch;
  };

  const createBatchTest = async (payload: Pick<BatchTest, 'project' | 'batchPersona' | 'test'>) => {
    if (!token || !currentWorkspaceId) throw new Error("Not authenticated or no workspace context");
    const res = await fetch(`${API_BASE}/batchtests`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        'X-Workspace-ID': currentWorkspaceId
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to create batch test");
    const batch = await res.json();
    addBatchTestToList(batch);
    return batch;
  };

  const updateBatchTest = async (id: string, payload: Partial<Pick<BatchTest, 'batchPersona' | 'test'>>) => {
    if (!token || !currentWorkspaceId) throw new Error("Not authenticated or no workspace context");
    const res = await fetch(`${API_BASE}/batchtests/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        'X-Workspace-ID': currentWorkspaceId
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to update batch test");
    const batch = await res.json();
    updateBatchTestInList(batch);
    return batch;
  };

  const moveBatchTestToTrash = async (id: string) => {
    if (!token || !currentWorkspaceId) throw new Error("Not authenticated or no workspace context");
    const res = await fetch(`${API_BASE}/batchtests/${id}/trash`, {
      method: "POST",
      credentials: "include",
      headers: { 
        Authorization: `Bearer ${token}`,
        'X-Workspace-ID': currentWorkspaceId
      },
    });
    if (!res.ok) throw new Error("Failed to move batch test to trash");
    const data = await res.json();
    const batch = data.batchTest ?? data;
    updateBatchTestInList(batch);
    return batch;
  };

  const restoreBatchTestFromTrash = async (id: string) => {
    if (!token || !currentWorkspaceId) throw new Error("Not authenticated or no workspace context");
    const res = await fetch(`${API_BASE}/batchtests/${id}/restore`, {
      method: "PATCH",
      credentials: "include",
      headers: { 
        Authorization: `Bearer ${token}`,
        'X-Workspace-ID': currentWorkspaceId
      },
    });
    if (!res.ok) throw new Error("Failed to restore batch test from trash");
    const data = await res.json();
    const batch = data.batchTest ?? data;
    updateBatchTestInList(batch);
    return batch;
  };

  const duplicateBatchTest = async (id: string) => {
    if (!token || !currentWorkspaceId) throw new Error("Not authenticated or no workspace context");
    const res = await fetch(`${API_BASE}/batchtests/${id}/duplicate`, {
      method: "POST",
      credentials: "include",
      headers: { 
        Authorization: `Bearer ${token}`,
        'X-Workspace-ID': currentWorkspaceId
      },
    });
    if (!res.ok) throw new Error("Failed to duplicate batch test");
    const batch = await res.json();
    addBatchTestToList(batch);
    return batch;
  };

  const deleteBatchTest = async (id: string, deleteTestRuns = false) => {
    if (!token || !currentWorkspaceId) throw new Error("Not authenticated or no workspace context");
    const url = `${API_BASE}/batchtests/${id}${deleteTestRuns ? `?deleteTestRuns=true` : ''}`;
    const res = await fetch(url, {
      method: "DELETE",
      credentials: "include",
      headers: { 
        Authorization: `Bearer ${token}`,
        'X-Workspace-ID': currentWorkspaceId
      },
    });
    if (!res.ok) throw new Error("Failed to delete batch test");
    removeBatchTestFromList(id);
    return res.json();
  };

  const analyzeBatchTestOutputs = async (id: string): Promise<BatchTestAnalysis> => {
    if (!token || !currentWorkspaceId) throw new Error("Not authenticated or no workspace context");
    const res = await fetch(`${API_BASE}/batchtests/${id}/analyze-outputs`, {
      credentials: "include",
      headers: { 
        Authorization: `Bearer ${token}`,
        'X-Workspace-ID': currentWorkspaceId
      },
    });
    if (!res.ok) throw new Error("Failed to analyze batch test outputs");
    return res.json();
  };

  const getBatchTestAnalysisHistory = async (id: string): Promise<BatchTestAnalysisHistoryEntry[]> => {
    if (!token || !currentWorkspaceId) throw new Error("Not authenticated or no workspace context");
    const res = await fetch(`${API_BASE}/batchtests/${id}/analysis-history`, {
      credentials: "include",
      headers: { 
        Authorization: `Bearer ${token}`,
        'X-Workspace-ID': currentWorkspaceId
      },
    });
    if (!res.ok) throw new Error("Failed to fetch batch test analysis history");
    return res.json();
  };

  const getTestRunsForBatchTest = async (
    batchTestId: string,
    forceRefresh = false
  ): Promise<TestRun[]> => {
    if (!token || !currentWorkspaceId) throw new Error("Not authenticated or no workspace context");

    const { getTestRunsForBatchTest: getCached, setTestRunsForBatchTest } = useBatchTestsStore.getState();
    const cached = getCached(batchTestId);
    if (cached && !forceRefresh) {
      return cached as unknown as TestRun[];
    }

    const res = await fetch(`${API_BASE}/batchtests/${batchTestId}/testruns`, {
      credentials: "include",
      headers: { 
        Authorization: `Bearer ${token}`,
        'X-Workspace-ID': currentWorkspaceId
      },
    });
    if (!res.ok) throw new Error("Failed to fetch batch test runs");
    const runs = (await res.json()) as TestRun[];

    // Sort newest-first using ObjectId timestamp
    const getTimestamp = (id: string) => parseInt(id.substring(0, 8), 16) * 1000;
    const sorted = [...runs].sort((a, b) => getTimestamp(b._id) - getTimestamp(a._id));

    setTestRunsForBatchTest(batchTestId, sorted);

    // Merge into global TestRuns store so other views benefit
    sorted.forEach(run => addTestRunToList(run));

    return sorted;
  };

  const emptyBatchTestTrash = async (deleteTestRuns = false) => {
    if (!token || !currentWorkspaceId) throw new Error("Not authenticated or no workspace context");
    const url = new URL(`${API_BASE}/batchtests/trash/empty`);
    if (deleteTestRuns) {
      url.searchParams.set('deleteTestRuns', 'true');
    }
    const res = await fetch(url.toString(), {
      method: "DELETE",
      credentials: "include",
      headers: { 
        Authorization: `Bearer ${token}`,
        'X-Workspace-ID': currentWorkspaceId
      },
    });
    if (!res.ok) throw new Error("Failed to empty batch test trash");
    const result = await res.json();
    emptyTrashedBatchTests();
    return result;
  };

  return {
    batchTests,
    batchTestsLoading,
    batchTestsError,
    trashedBatchTests,
    getBatchTestById,
    createBatchTest,
    updateBatchTest,
    moveBatchTestToTrash,
    restoreBatchTestFromTrash,
    duplicateBatchTest,
    deleteBatchTest,
    refetch: fetchBatchTests,
    refetchTrashed: fetchTrashedBatchTests,
    analyzeBatchTestOutputs,
    getBatchTestAnalysisHistory,
    getTestRunsForBatchTest,
    emptyBatchTestTrash,
    hasWorkspaceContext: !!currentWorkspaceId,
  };
} 