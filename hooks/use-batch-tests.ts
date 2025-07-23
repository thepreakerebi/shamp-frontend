/* eslint-disable @typescript-eslint/no-explicit-any */
import { useAuth } from "@/lib/auth";
import { useEffect, useCallback, useRef } from "react";
import io from "socket.io-client";
import { useBatchTestsStore } from "@/lib/store/batchTests";
import { useTestRunsStore } from "@/lib/store/testruns";
import type { TestRun } from "@/hooks/use-testruns";
import { apiFetch } from '@/lib/api-client';

// API_BASE no longer needed – we build relative paths
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
  workspace?: string;
}

export interface BatchTestAnalysis {
  result: Record<string, unknown>;
  createdAt: string;
  triggeredBy?: string;
}

export type BatchTestAnalysisHistoryEntry = BatchTestAnalysis;

const fetcher = (url: string, workspaceId?: string | null) =>
  apiFetch(url, { workspaceId }).then(res => {
    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();
  });

export function useBatchTests() {
  const { currentWorkspaceId } = useAuth();
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
    getTestRunsForBatchTest: getCachedRuns,
    setTestRunsForBatchTest,
  } = useBatchTestsStore();
  const { addTestRunToList } = useTestRunsStore();

  const previousWorkspaceId = useRef<string | null>(null);

  const fetchBatchTests = useCallback(async () => {
    if (!currentWorkspaceId) {
      setBatchTestsLoading(false);
      setBatchTests([]);
      return;
    }
    setBatchTestsLoading(true);
    setBatchTestsError(null);
    try {
      const data = await fetcher("/batchtests", currentWorkspaceId);
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
  }, [currentWorkspaceId, setBatchTests, setBatchTestsLoading, setBatchTestsError]);

  const fetchTrashedBatchTests = useCallback(async () => {
    if (!currentWorkspaceId) return;
    setBatchTestsLoading(true);
    try {
      const data = await fetcher('/batchtests/trashed', currentWorkspaceId);
      if (Array.isArray(data)) {
        setTrashedBatchTests(data);
      }
    } finally {
      setBatchTestsLoading(false);
    }
  }, [currentWorkspaceId, setTrashedBatchTests, setBatchTestsLoading]);

  useEffect(() => {
    if (!currentWorkspaceId) {
      setBatchTests([]);
      setTrashedBatchTests([]);
      setBatchTestsLoading(false);
      return;
    }

    if (previousWorkspaceId.current && previousWorkspaceId.current !== currentWorkspaceId) {
      setBatchTests(null);
      setTrashedBatchTests(null);
      setBatchTestsLoading(true);
    }
    previousWorkspaceId.current = currentWorkspaceId;

    fetchBatchTests();
    fetchTrashedBatchTests();
  }, [currentWorkspaceId, fetchBatchTests, fetchTrashedBatchTests, setBatchTests, setTrashedBatchTests, setBatchTestsLoading]);

  useEffect(() => {
    if (!currentWorkspaceId) return;
    const socket = io(SOCKET_URL, {
      transports: ["websocket"],
      auth: { workspaceId: currentWorkspaceId },
    });

    const createdHandler = (data: BatchTest & { workspace?: string }) => {
      if (data.workspace && data.workspace === currentWorkspaceId) {
        addBatchTestToList(data);
      }
    };

    const deletedHandler = (data: { _id?: string; workspace?: string }) => {
      if (data.workspace && data.workspace === currentWorkspaceId && data._id) {
        removeBatchTestFromList(data._id);
      }
    };

    const statusUpdatedHandler = (data: { _id?: string; status?: string; workspace?: string }) => {
      if (data.workspace && data.workspace === currentWorkspaceId && data._id) {
        updateBatchTestInList({ _id: data._id, status: data.status } as BatchTest);
      }
    };

    const mergeHandler = (bt: BatchTest & { workspace?: string }) => {
      if (bt.workspace && bt.workspace === currentWorkspaceId) {
        updateBatchTestInList(bt);
      }
    };

    socket.on("batchTest:created", createdHandler);
    socket.on("batchTest:deleted", deletedHandler);
    socket.on("batchTest:statusUpdated", statusUpdatedHandler);
    socket.on("batchTest:updated", mergeHandler);
    socket.on("batchTest:trashed", mergeHandler);

    socket.on("batchTest:analysisUpdated", (payload: { _id: string; latestAnalysis: any; workspace?: string }) => {
      if (payload.workspace && payload.workspace !== currentWorkspaceId) return;
      const currentBatch = useBatchTestsStore.getState().batchTests?.find(bt => bt._id === payload._id);
      if (currentBatch) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const currentAnalysis = (currentBatch as any).analysis || [];
        const updatedAnalysis = [payload.latestAnalysis, ...currentAnalysis];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        updateBatchTestInList({ _id: payload._id, analysis: updatedAnalysis } as any);
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        updateBatchTestInList({ _id: payload._id, analysis: [payload.latestAnalysis] } as any);
      }
    });

    return () => {
      socket.off("batchTest:created", createdHandler);
      socket.off("batchTest:deleted", deletedHandler);
      socket.off("batchTest:statusUpdated", statusUpdatedHandler);
      socket.off("batchTest:updated", mergeHandler);
      socket.off("batchTest:trashed", mergeHandler);
      socket.off("batchTest:analysisUpdated");
      socket.disconnect();
    };
  }, [currentWorkspaceId, addBatchTestToList, removeBatchTestFromList, updateBatchTestInList]);

  const getBatchTestById = async (id: string): Promise<BatchTest> => {
    if (!currentWorkspaceId) throw new Error("No workspace context");
    const res = await apiFetch(`/batchtests/${id}`, { workspaceId: currentWorkspaceId });
    if (!res.ok) throw new Error("Failed to fetch batch test");
    const batch = await res.json();
    addBatchTestToList(batch);
    return batch;
  };

  const createBatchTest = async (payload: Pick<BatchTest, 'project' | 'batchPersona' | 'test'>) => {
    if (!currentWorkspaceId) throw new Error("No workspace context");
    const res = await apiFetch('/batchtests', {
      workspaceId: currentWorkspaceId,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to create batch test");
    const batch = await res.json();
    addBatchTestToList(batch);
    return batch;
  };

  const updateBatchTest = async (id: string, payload: Partial<Pick<BatchTest, 'batchPersona' | 'test'>>) => {
    if (!currentWorkspaceId) throw new Error("No workspace context");
    const res = await apiFetch(`/batchtests/${id}`, {
      workspaceId: currentWorkspaceId,
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to update batch test");
    const batch = await res.json();
    updateBatchTestInList(batch);
    return batch;
  };

  const moveBatchTestToTrash = async (id: string) => {
    if (!currentWorkspaceId) throw new Error("No workspace context");
    const res = await apiFetch(`/batchtests/${id}/trash`, { workspaceId: currentWorkspaceId, method:'POST' });
    if (!res.ok) throw new Error("Failed to move batch test to trash");
    const data = await res.json();
    const batch = data.batchTest ?? data;
    updateBatchTestInList(batch);
    return batch;
  };

  const restoreBatchTestFromTrash = async (id: string) => {
    if (!currentWorkspaceId) throw new Error("No workspace context");
    const res = await apiFetch(`/batchtests/${id}/restore`, { workspaceId: currentWorkspaceId, method:'PATCH' });
    if (!res.ok) throw new Error("Failed to restore batch test from trash");
    const data = await res.json();
    const batch = data.batchTest ?? data;
    updateBatchTestInList(batch);
    return batch;
  };

  const duplicateBatchTest = async (id: string) => {
    if (!currentWorkspaceId) throw new Error("No workspace context");
    const res = await apiFetch(`/batchtests/${id}/duplicate`, { workspaceId: currentWorkspaceId, method:'POST' });
    if (!res.ok) throw new Error("Failed to duplicate batch test");
    const batch = await res.json();
    addBatchTestToList(batch);
    return batch;
  };

  const deleteBatchTest = async (id: string, deleteTestRuns = false) => {
    if (!currentWorkspaceId) throw new Error("No workspace context");
    const path = `/batchtests/${id}${deleteTestRuns ? `?deleteTestRuns=true` : ''}`;
    const res = await apiFetch(path, { workspaceId: currentWorkspaceId, method:'DELETE' });
    if (!res.ok) throw new Error("Failed to delete batch test");
    removeBatchTestFromList(id);
    return res.json();
  };

  const analyzeBatchTestOutputs = async (id: string): Promise<BatchTestAnalysis> => {
    if (!currentWorkspaceId) throw new Error("No workspace context");
    const res = await apiFetch(`/batchtests/${id}/analyze-outputs`, {
      workspaceId: currentWorkspaceId,
    });
    if (!res.ok) throw new Error("Failed to analyze batch test outputs");
    return res.json();
  };

  const getBatchTestAnalysisHistory = async (id: string): Promise<BatchTestAnalysisHistoryEntry[]> => {
    if (!currentWorkspaceId) throw new Error("No workspace context");
    const res = await apiFetch(`/batchtests/${id}/analysis-history`, {
      workspaceId: currentWorkspaceId,
    });
    if (!res.ok) throw new Error("Failed to fetch batch test analysis history");
    return res.json();
  };

  const getTestRunsForBatchTest = async (
    batchTestId: string,
    forceRefresh = false
  ): Promise<TestRun[]> => {
    if (!currentWorkspaceId) throw new Error("No workspace context");

    const cached = getCachedRuns(batchTestId);
    if (cached && !forceRefresh) {
      return cached as unknown as TestRun[];
    }

    const res = await apiFetch(`/batchtests/${batchTestId}/testruns`, {
      workspaceId: currentWorkspaceId,
    });
    if (!res.ok) throw new Error("Failed to fetch batch test runs");
    const runs = (await res.json()) as TestRun[];

    const getTimestamp = (id: string) => parseInt(id.substring(0, 8), 16) * 1000;
    const sorted = [...runs].sort((a, b) => getTimestamp(b._id) - getTimestamp(a._id));

    const existing = getCachedRuns(batchTestId);
    if (existing) {
      const merged = [...existing, ...sorted];
      const dedup = Array.from(new Map(merged.map(r => [ (r as { _id: string })._id, r ])).values()) as TestRun[];
      setTestRunsForBatchTest(batchTestId, dedup);
    } else {
      setTestRunsForBatchTest(batchTestId, sorted);
    }

    sorted.forEach(run => addTestRunToList(run));

    return sorted;
  };

  const emptyBatchTestTrash = async (deleteTestRuns = false) => {
    if (!currentWorkspaceId) throw new Error("No workspace context");
    const url = new URL(`/batchtests/trash/empty`);
    if (deleteTestRuns) {
      url.searchParams.set('deleteTestRuns', 'true');
    }
    const res = await apiFetch(url.toString(), { workspaceId: currentWorkspaceId, method:'DELETE' });
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