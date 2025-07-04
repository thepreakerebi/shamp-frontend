import { useAuth } from "@/lib/auth";
import type { TestRun } from "@/hooks/use-testruns";
import { useEffect, useCallback } from "react";
import io from "socket.io-client";
import { useTestsStore } from "@/lib/store/tests";
import { useTestRunsStore } from "@/lib/store/testruns";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL as string;

export interface Test {
  _id: string;
  name: string;
  description?: string;
  project: string;
  persona?: string;
  personaNames?: string[];
  createdBy?: string;
  trashed?: boolean;
  totalRuns?: number;
  browserViewportWidth?: number;
  browserViewportHeight?: number;
  maxAgentSteps?: number;
  // Add other fields as needed
}

export interface TestPayload {
  name: string;
  description?: string;
  project: string;
  persona?: string;
  browserViewportWidth?: number;
  browserViewportHeight?: number;
  maxAgentSteps?: number;
}

export interface TestAnalysis {
  recommendedChanges?: string;
  observedBehavior?: string;
  additionalNotes?: string;
  testRunsAnalyzed?: number;
  analysisDate?: string;
  success?: boolean;
  error?: string;
}

export interface TestAnalysisHistoryEntry {
  _id: string;
  testRunsAnalyzed: number;
  recommendedChanges?: string;
  observedBehavior?: string;
  additionalNotes?: string;
  createdAt: string;
}

export interface TestSearch {
  query: string;
  results: Test[];
  loading: boolean;
  error: string | null;
}

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

export function useTests() {
  const { token, currentWorkspaceId } = useAuth();
  const store = useTestsStore();

  // Fetch tests
  const fetchTests = useCallback(async () => {
    if (!token || !currentWorkspaceId) return;
    store.setTestsLoading(true);
    store.setTestsError(null);
    try {
      const data = await fetcher("/tests", token, currentWorkspaceId);
      store.setTests(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      if (err instanceof Error) {
        store.setTestsError(err.message);
      } else {
        store.setTestsError("Failed to fetch tests");
      }
    } finally {
      store.setTestsLoading(false);
    }
  }, [token, currentWorkspaceId, store]);

  // Fetch trashed tests
  const fetchTrashedTests = useCallback(async () => {
    if (!token || !currentWorkspaceId) return;
    store.setTrashedTestsLoading(true);
    store.setTrashedTestsError(null);
    try {
      const data = await fetcher("/tests/trash", token, currentWorkspaceId);
      store.setTrashedTests(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      if (err instanceof Error) {
        store.setTrashedTestsError(err.message);
      } else {
        store.setTrashedTestsError("Failed to fetch trashed tests");
      }
    } finally {
      store.setTrashedTestsLoading(false);
    }
  }, [token, currentWorkspaceId, store]);

  // Fetch count
  const fetchCount = useCallback(async () => {
    if (!token || !currentWorkspaceId) return;
    store.setCountLoading(true);
    store.setCountError(null);
    try {
      const data = await fetcher("/tests/count", token, currentWorkspaceId);
      store.setCount(typeof data.count === "number" ? data.count : 0);
    } catch (err: unknown) {
      if (err instanceof Error) {
        store.setCountError(err.message);
      } else {
        store.setCountError("Failed to fetch count");
      }
    } finally {
      store.setCountLoading(false);
    }
  }, [token, currentWorkspaceId, store]);

  // Refetch all
  const refetch = useCallback(() => {
    fetchTests();
    fetchCount();
  }, [fetchTests, fetchCount]);

  useEffect(() => {
    if (!token || !currentWorkspaceId) return;
    fetchTests();
    fetchCount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, currentWorkspaceId]);

  useEffect(() => {
    if (!token || !currentWorkspaceId) return;
    const socket = io(SOCKET_URL, {
      transports: ["websocket"],
      auth: { token, workspaceId: currentWorkspaceId },
    });
    const handleUpdate = () => {
      refetch();
    };
    socket.on("test:created", handleUpdate);
    socket.on("test:deleted", handleUpdate);
    socket.on("test:updated", handleUpdate);
    socket.on("test:trashed", handleUpdate);
    return () => {
      socket.off("test:created", handleUpdate);
      socket.off("test:deleted", handleUpdate);
      socket.off("test:updated", handleUpdate);
      socket.off("test:trashed", handleUpdate);
      socket.disconnect();
    };
  }, [refetch, token, currentWorkspaceId]);

  // Create a test
  const createTest = async (payload: TestPayload) => {
    if (!token || !currentWorkspaceId) throw new Error("Not authenticated or no workspace context");
    const res = await fetch(`${API_BASE}/tests`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        'X-Workspace-ID': currentWorkspaceId
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to create test");
    const test = await res.json();
    useTestsStore.getState().addTestToList(test);
    return test;
  };

  // Get a single test by ID
  const getTestById = async (id: string): Promise<Test> => {
    if (!token || !currentWorkspaceId) throw new Error("Not authenticated or no workspace context");
    const res = await fetch(`${API_BASE}/tests/${id}`, {
      credentials: "include",
      headers: { 
        Authorization: `Bearer ${token}`,
        'X-Workspace-ID': currentWorkspaceId
      },
    });
    if (res.status === 404) throw new Error("Not found");
    if (!res.ok) throw new Error("Failed to fetch test");
    const test = await res.json();
    useTestsStore.getState().updateTestInList(test);
    return test;
  };

  // Update a test
  const updateTest = async (id: string, payload: TestPayload) => {
    if (!token || !currentWorkspaceId) throw new Error("Not authenticated or no workspace context");
    const res = await fetch(`${API_BASE}/tests/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        'X-Workspace-ID': currentWorkspaceId
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to update test");
    const test = await res.json();
    useTestsStore.getState().updateTestInList(test);
    return test;
  };

  // Delete a test
  const deleteTest = async (id: string, deleteTestRuns = false) => {
    if (!token || !currentWorkspaceId) throw new Error("Not authenticated or no workspace context");
    const url = `${API_BASE}/tests/${id}${deleteTestRuns ? `?deleteTestRuns=true` : ''}`;
    const res = await fetch(url, {
      method: "DELETE",
      credentials: "include",
      headers: { 
        Authorization: `Bearer ${token}`,
        'X-Workspace-ID': currentWorkspaceId
      },
    });
    if (!res.ok) throw new Error("Failed to delete test");
    useTestsStore.getState().removeTestFromList(id);
    return res.json();
  };

  // Move test to trash
  const moveTestToTrash = async (id: string) => {
    if (!token || !currentWorkspaceId) throw new Error("Not authenticated or no workspace context");
    const res = await fetch(`${API_BASE}/tests/${id}/trash`, {
      method: "PATCH",
      credentials: "include",
      headers: { 
        Authorization: `Bearer ${token}`,
        'X-Workspace-ID': currentWorkspaceId
      },
    });
    if (!res.ok) throw new Error("Failed to move test to trash");
    const test = await res.json();
    useTestsStore.getState().removeTestFromList(id);
    useTestsStore.getState().addTrashedTest({ ...test, trashed: true });
    return test;
  };

  // Restore test from trash
  const restoreTestFromTrash = async (id: string) => {
    if (!token || !currentWorkspaceId) throw new Error("Not authenticated or no workspace context");
    const res = await fetch(`${API_BASE}/tests/${id}/restore`, {
      method: "PATCH",
      credentials: "include",
      headers: { 
        Authorization: `Bearer ${token}`,
        'X-Workspace-ID': currentWorkspaceId
      },
    });
    if (!res.ok) throw new Error("Failed to restore test from trash");
    const test = await res.json();
    useTestsStore.getState().removeTrashedTest(id);
    useTestsStore.getState().addTestToList({ ...test, trashed: false });
    return test;
  };

  // Duplicate a test
  const duplicateTest = async (id: string) => {
    if (!token || !currentWorkspaceId) throw new Error("Not authenticated or no workspace context");
    const res = await fetch(`${API_BASE}/tests/${id}/duplicate`, {
      method: "POST",
      credentials: "include",
      headers: { 
        Authorization: `Bearer ${token}`,
        'X-Workspace-ID': currentWorkspaceId
      },
    });
    if (!res.ok) throw new Error("Failed to duplicate test");
    const test = await res.json();
    useTestsStore.getState().addTestToList(test);
    return test;
  };

  // Analyze all test runs for a test (aggregate analysis)
  const analyzeTestOutputs = async (id: string): Promise<TestAnalysis> => {
    if (!token || !currentWorkspaceId) throw new Error("Not authenticated or no workspace context");
    const res = await fetch(`${API_BASE}/tests/${id}/analyze-outputs`, {
      credentials: "include",
      headers: { 
        Authorization: `Bearer ${token}`,
        'X-Workspace-ID': currentWorkspaceId
      },
    });
    if (!res.ok) throw new Error("Failed to analyze test outputs");
    return res.json();
  };

  // Get full analysis history for a test
  const getTestAnalysisHistory = async (id: string): Promise<TestAnalysisHistoryEntry[]> => {
    if (!token || !currentWorkspaceId) throw new Error("Not authenticated or no workspace context");
    const res = await fetch(`${API_BASE}/tests/${id}/analysis-history`, {
      credentials: "include",
      headers: { 
        Authorization: `Bearer ${token}`,
        'X-Workspace-ID': currentWorkspaceId
      },
    });
    if (!res.ok) throw new Error("Failed to fetch test analysis history");
    return res.json();
  };

  // Search tests
  const searchTests = async (query: string): Promise<TestSearch> => {
    if (!token || !currentWorkspaceId) {
      return { query, results: [], loading: false, error: "Not authenticated or no workspace context" };
    }
    
    try {
      const res = await fetch(`${API_BASE}/tests/search?q=${encodeURIComponent(query)}`, {
        credentials: "include",
        headers: { 
          Authorization: `Bearer ${token}`,
          'X-Workspace-ID': currentWorkspaceId
        },
      });
      if (!res.ok) throw new Error("Failed to search tests");
      const results = await res.json();
      return { query, results: Array.isArray(results) ? results : [], loading: false, error: null };
    } catch (err) {
      return { 
        query, 
        results: [], 
        loading: false, 
        error: err instanceof Error ? err.message : "Failed to search tests" 
      };
    }
  };

  // Get test runs for a test (with caching)
  const getTestRunsForTest = async (
    testId: string,
    forceRefresh = false
  ): Promise<TestRun[]> => {
    if (!token || !currentWorkspaceId) throw new Error("Not authenticated or no workspace context");

    const { getTestRunsForTest: getCached, setTestRunsForTest } = useTestsStore.getState();
    const cached = getCached(testId);
    if (cached && !forceRefresh) {
      return cached as unknown as TestRun[];
    }

    const res = await fetch(`${API_BASE}/tests/${testId}/testruns`, {
      credentials: "include",
      headers: { 
        Authorization: `Bearer ${token}`,
        'X-Workspace-ID': currentWorkspaceId
      },
    });
    if (!res.ok) throw new Error("Failed to fetch test runs");
    const runs = (await res.json()) as TestRun[];

    // Sort newest-first using ObjectId timestamp
    const getTs = (id: string) => parseInt(id.substring(0, 8), 16) * 1000;
    const sorted = [...runs].sort((a, b) => getTs(b._id) - getTs(a._id));

    setTestRunsForTest(testId, sorted);

    // Merge into global TestRuns store so other views benefit
    const { addTestRunToList } = useTestRunsStore.getState();
    sorted.forEach(run => addTestRunToList(run));

    return sorted;
  };

  // Empty trash - permanently delete all trashed tests
  const emptyTestTrash = async (deleteTestRuns?: boolean) => {
    if (!token || !currentWorkspaceId) throw new Error("Not authenticated or no workspace context");
    const url = new URL(`${API_BASE}/tests/trash/empty`);
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
    if (!res.ok) throw new Error("Failed to empty test trash");
    const result = await res.json();
    useTestsStore.getState().emptyTrashedTests();
    return result;
  };

  return {
    tests: store.tests,
    trashedTests: store.trashedTests,
    testsError: store.testsError,
    testsLoading: store.testsLoading,
    count: store.count,
    countError: store.countError,
    countLoading: store.countLoading,
    createTest,
    updateTest,
    deleteTest,
    moveTestToTrash,
    restoreTestFromTrash,
    duplicateTest,
    getTestById,
    refetch,
    refetchTrashed: fetchTrashedTests,
    analyzeTestOutputs,
    getTestAnalysisHistory,
    searchTests,
    getTestRunsForTest,
    emptyTestTrash,
    hasWorkspaceContext: !!currentWorkspaceId,
  };
} 