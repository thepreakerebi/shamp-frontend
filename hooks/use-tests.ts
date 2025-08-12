import { useAuth } from "@/lib/auth";
import type { TestRun } from "@/hooks/use-testruns";
import { useEffect, useCallback, useRef } from "react";
import io from "socket.io-client";
import { apiFetch } from '@/lib/api-client';
import { useTestsStore } from "@/lib/store/tests";
import { useTestRunsStore } from "@/lib/store/testruns";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL as string;

export interface Test {
  _id: string;
  name: string;
  description?: string;
  descriptionBlocks?: unknown;
  project: string;
  workspace: string; // Which workspace this test belongs to
  persona?: string;
  personaNames?: string[];
  createdBy?: {
    _id: string;
    name: string;
    firstName?: string;
    lastName?: string;
    email: string;
  };
  trashed?: boolean;
  totalRuns?: number;
  browserViewportWidth?: number;
  browserViewportHeight?: number;
  maxAgentSteps?: number;
  files?: { fileName: string; contentType: string }[];
  // Add other fields as needed
}

export type TestRunSummary = TestRun;

export interface TestFilePayload {
  fileName: string;
  contentType: string;
  data: string; // base64-encoded file contents
}

export interface TestPayload {
  name: string;
  description?: string;
  descriptionBlocks?: unknown;
  project: string;
  persona?: string;
  browserViewportWidth?: number;
  browserViewportHeight?: number;
  maxAgentSteps?: number;
  files?: TestFilePayload[];
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

export interface TestSearchParams {
  [key: string]: string | number | boolean | undefined;
}

// Legacy fetcher removed – apiFetch covers credentials, CSRF and optional auth

export function useTests() {
  const { currentWorkspaceId } = useAuth();
  const store = useTestsStore();
  const previousWorkspaceId = useRef<string | null>(null);

  // Fetch tests
  const fetchTests = useCallback(async () => {
    if (!currentWorkspaceId) {
      store.setTests([]);
      store.setTestsLoading(false);
      store.setTestsError(null);
      return;
    }
    
    store.setTestsLoading(true);
    store.setTestsError(null);
    try {
      const res = await apiFetch('/tests', { workspaceId: currentWorkspaceId });
      const data = await res.json();
      // Handle paginated response - extract tests from data.data array
      const tests = data.data || data;
      store.setTests(Array.isArray(tests) ? tests : []);
    } catch (err: unknown) {
      if (err instanceof Error) {
        store.setTestsError(err.message);
      } else {
        store.setTestsError("Failed to fetch tests");
      }
    } finally {
      store.setTestsLoading(false);
    }
  }, [currentWorkspaceId, store]);

  // Fetch trashed tests
  const fetchTrashedTests = useCallback(async () => {
    if (!currentWorkspaceId) {
      store.setTrashedTests([]);
      return;
    }
    try {
      const res = await apiFetch('/tests/trashed', { workspaceId: currentWorkspaceId });
      const data = await res.json();
      // Handle paginated response - extract tests from data.data array
      const trashedTests = data.data || data;
      store.setTrashedTests(Array.isArray(trashedTests) ? trashedTests : []);
    } catch (err: unknown) {
      // Silently handle errors for trashed tests - don't interfere with main error state
      console.error("Failed to fetch trashed tests:", err);
    }
  }, [currentWorkspaceId, store]);

  // Fetch count
  const fetchCount = useCallback(async () => {
    if (!currentWorkspaceId) {
      store.setCount(0);
      store.setCountLoading(false);
      store.setCountError(null);
      return;
    }
    store.setCountLoading(true);
    store.setCountError(null);
    try {
      const res = await apiFetch('/tests/count', { workspaceId: currentWorkspaceId });
      const data = await res.json();
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
  }, [currentWorkspaceId, store]);

  // Refetch all
  const refetch = useCallback(() => {
    fetchTests();
    fetchCount();
    fetchTrashedTests();
  }, [fetchTests, fetchCount, fetchTrashedTests]);

  useEffect(() => {
    if (!currentWorkspaceId) {
      // When there's no auth context, set loading to false to prevent infinite skeleton
      store.setTestsLoading(false);
      store.setCountLoading(false);
      store.setTests([]);
      store.setCount(0);
      return;
    }
    
    // Check if workspace has changed
    if (previousWorkspaceId.current && previousWorkspaceId.current !== currentWorkspaceId) {
      // Clear store data when workspace changes
      store.setTests(null);
      store.setTrashedTests(null);
      store.setCount(0);
      store.setCountLoading(true);
      store.setTestsLoading(true);
    }
    
    // Update the ref to current workspace
    previousWorkspaceId.current = currentWorkspaceId;
    
    fetchTests();
    fetchCount();
    fetchTrashedTests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWorkspaceId]);

  useEffect(() => {
    if (!currentWorkspaceId) return;
    const socket = io(SOCKET_URL, {
      transports: ["websocket"],
      auth: { workspaceId: currentWorkspaceId },
    });
    
    const handleTestCreated = (data: { test?: Test; workspace?: string }) => {
      // Only process events for the current workspace
      if (data.workspace && data.workspace === currentWorkspaceId) {
        if (data.test) {
          store.addTestToList(data.test);
        }
        // Update count
        const currentCount = store.count;
        store.setCount(currentCount + 1);
      }
    };
    
    const handleTestUpdated = (data: { test?: Test; workspace?: string }) => {
      // Only process events for the current workspace
      if (data.workspace && data.workspace === currentWorkspaceId) {
        if (data.test) {
          store.updateTestInList(data.test);
        }
      }
    };
    
    const handleTestDeleted = (data: { _id?: string; workspace?: string }) => {
      // Only process events for the current workspace
      if (data.workspace && data.workspace === currentWorkspaceId) {
        if (data._id) {
          store.removeTestFromList(data._id);
          // Update count by decrementing current count
          const currentCount = store.count;
          store.setCount(Math.max(0, currentCount - 1));
        }
      }
    };
    
    const handleTestTrashed = (data: { _id?: string; test?: Test; workspace?: string }) => {
      // Only process events for the current workspace
      if (data.workspace && data.workspace === currentWorkspaceId) {
        if (data._id) {
          store.removeTestFromList(data._id);
          // Update count by decrementing current count
          const currentCount = store.count;
          store.setCount(Math.max(0, currentCount - 1));
        }
        if (data.test) {
          store.addTrashedTest({ ...data.test, trashed: true });
        }
      }
    };
    
    const handleTestRestored = (data: { _id?: string; test?: Test; workspace?: string }) => {
      // Only process events for the current workspace
      if (data.workspace && data.workspace === currentWorkspaceId) {
        if (data._id) {
          store.removeTrashedTest(data._id);
        }
        if (data.test) {
          store.addTestToList({ ...data.test, trashed: false });
          // Update count by incrementing current count
          const currentCount = store.count;
          store.setCount(currentCount + 1);
        }
      }
    };
    
    const handleTrashEmptied = (data: { deletedCount?: number; workspace?: string }) => {
      // Only process events for the current workspace
      if (data.workspace && data.workspace === currentWorkspaceId) {
        store.emptyTrashedTests();
      }
    };
    
    socket.on("test:created", handleTestCreated);
    socket.on("test:deleted", handleTestDeleted);
    socket.on("test:updated", handleTestUpdated);
    socket.on("test:trashed", handleTestTrashed);
    socket.on("test:restored", handleTestRestored);
    socket.on("test:trashEmptied", handleTrashEmptied);
    
    return () => {
      socket.off("test:created", handleTestCreated);
      socket.off("test:deleted", handleTestDeleted);
      socket.off("test:updated", handleTestUpdated);
      socket.off("test:trashed", handleTestTrashed);
      socket.off("test:restored", handleTestRestored);
      socket.off("test:trashEmptied", handleTrashEmptied);
      socket.disconnect();
    };
  }, [refetch, currentWorkspaceId, store]);

  // Create a test
  const createTest = async (payload: TestPayload) => {
    if (!currentWorkspaceId) throw new Error("No workspace context");
    const res = await apiFetch('/tests', { workspaceId: currentWorkspaceId, method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (!res.ok) throw new Error("Failed to create test");
    const test = await res.json();
    // Let Socket.IO handle the store update
    return test;
  };

  // Get a single test by ID
  const getTestById = async (id: string): Promise<Test> => {
    if (!currentWorkspaceId) throw new Error("No workspace context");
    const res = await apiFetch(`/tests/${id}`, { workspaceId: currentWorkspaceId });
    if (res.status === 404) throw new Error("Not found");
    if (!res.ok) throw new Error("Failed to fetch test");
    const test = await res.json();
    useTestsStore.getState().updateTestInList(test);
    return test;
  };

  // Update a test
  const updateTest = async (id: string, payload: TestPayload) => {
    if (!currentWorkspaceId) throw new Error("No workspace context");
    const res = await apiFetch(`/tests/${id}`, { workspaceId: currentWorkspaceId, method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (!res.ok) throw new Error("Failed to update test");
    const test = await res.json();
    // Let Socket.IO handle the store update
    return test;
  };

  // Delete a test
  const deleteTest = async (id: string, deleteTestRuns = false) => {
    if (!currentWorkspaceId) throw new Error("No workspace context");
    const path = `/tests/${id}${deleteTestRuns ? '?deleteTestRuns=true' : ''}`;
    const res = await apiFetch(path, { workspaceId: currentWorkspaceId, method: 'DELETE' });
    if (!res.ok) throw new Error("Failed to delete test");
    // Let Socket.IO handle the store update
    return res.json();
  };

  // Move test to trash
  const moveTestToTrash = async (id: string) => {
    if (!currentWorkspaceId) throw new Error("No workspace context");
    const res = await apiFetch(`/tests/${id}/trash`, { workspaceId: currentWorkspaceId, method: 'PATCH' });
    if (!res.ok) throw new Error("Failed to move test to trash");
    const test = await res.json();
    // Let Socket.IO handle the store update
    return test;
  };

  // Restore test from trash
  const restoreTestFromTrash = async (id: string) => {
    if (!currentWorkspaceId) throw new Error("No workspace context");
    const res = await apiFetch(`/tests/${id}/restore`, { workspaceId: currentWorkspaceId, method: 'PATCH' });
    if (!res.ok) throw new Error("Failed to restore test from trash");
    const test = await res.json();
    // Let Socket.IO handle the store update
    return test;
  };

  // Duplicate a test
  const duplicateTest = async (id: string) => {
    if (!currentWorkspaceId) throw new Error("No workspace context");
    const res = await apiFetch(`/tests/${id}/duplicate`, { workspaceId: currentWorkspaceId, method: 'POST' });
    if (!res.ok) throw new Error("Failed to duplicate test");
    const test = await res.json();
    // Let Socket.IO handle the store update
    return test;
  };

  // Analyze all test runs for a test (aggregate analysis)
  const analyzeTestOutputs = async (id: string): Promise<TestAnalysis> => {
    if (!currentWorkspaceId) throw new Error("No workspace context");
    const res = await apiFetch(`/tests/${id}/analyze-outputs`, { workspaceId: currentWorkspaceId });
    if (!res.ok) throw new Error("Failed to analyze test outputs");
    return res.json();
  };

  // Get full analysis history for a test
  const getTestAnalysisHistory = async (id: string): Promise<TestAnalysisHistoryEntry[]> => {
    if (!currentWorkspaceId) throw new Error("No workspace context");
    const res = await apiFetch(`/tests/${id}/analysis-history`, { workspaceId: currentWorkspaceId });
    if (!res.ok) throw new Error("Failed to fetch test analysis history");
    return res.json();
  };

  // Search tests
  let currentSearchSeq = 0;
  const searchTests = async (query: string | TestSearchParams): Promise<TestSearch> => {
    const mySeq = ++currentSearchSeq;
    const { setTests } = useTestsStore.getState();
    if (!currentWorkspaceId) {
      const queryStr = typeof query === 'string' ? query : '';
      return { query: queryStr, results: [], loading: false, error: "Not authenticated or no workspace context" };
    }
    
    // Early exit: if query is an object with no meaningful filters, just refresh full list
    if (typeof query !== 'string') {
      const obj = query as TestSearchParams;
      const hasFilters = Object.values(obj).some(v => v !== undefined && v !== null && v !== '');
      if (!hasFilters) {
        await fetchTests();
        return { query: '', results: store.tests ?? [], loading: false, error: null } as TestSearch;
      }
    }

    try {
      let path: string;
      if (typeof query === 'string') {
        path = `/tests/search?q=${encodeURIComponent(query)}`;
      } else {
        // Handle object parameters by converting to query string
        const params = new URLSearchParams();
        Object.entries(query).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params.set(key, String(value));
          }
        });
        path = `/tests/search?${params.toString()}`;
      }
      
      const res = await apiFetch(path, { workspaceId: currentWorkspaceId });
      if (!res.ok) throw new Error("Failed to search tests");
      const raw: unknown = await res.json();
      const dataField = (raw as { data?: unknown }).data;
      const arrayResultsUnknown = Array.isArray(raw)
        ? (raw as unknown[])
        : Array.isArray(dataField)
        ? (dataField as unknown[])
        : [];
      const arrayResults = arrayResultsUnknown as Test[];
      // Only apply results if this is the latest in-flight search (prevents older unfiltered fetches from overwriting newer filtered ones)
      if (mySeq === currentSearchSeq) {
        setTests(arrayResults);
      }
      const queryStr = typeof query === 'string' ? query : JSON.stringify(query);
      return { query: queryStr, results: arrayResults, loading: false, error: null };
    } catch (err) {
      const queryStr = typeof query === 'string' ? query : JSON.stringify(query);
      return { 
        query: queryStr, 
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
    if (!currentWorkspaceId) throw new Error("Not authenticated or no workspace context");

    const { getTestRunsForTest: getCached, setTestRunsForTest } = useTestsStore.getState();
    const cached = getCached(testId);
    if (cached && !forceRefresh) {
      return cached as unknown as TestRun[];
    }

    const res = await apiFetch(`/tests/${testId}/testruns`, { workspaceId: currentWorkspaceId });
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
    if (!currentWorkspaceId) throw new Error("Not authenticated or no workspace context");
    const endpoint = deleteTestRuns ? '/tests/trash/empty?deleteTestRuns=true' : '/tests/trash/empty';
    const res = await apiFetch(endpoint, { workspaceId: currentWorkspaceId, method: 'DELETE' });
    if (!res.ok) throw new Error("Failed to empty test trash");
    const result = await res.json();
    // Let Socket.IO handle the store update
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

// Permission utility functions
export const canEditTest = (test: Test, user: { _id: string; currentWorkspaceRole?: 'admin' | 'member' | null } | null): boolean => {
  if (!user) return false;
  
  // Admin can edit any test in the workspace
  if (user.currentWorkspaceRole === 'admin') return true;
  
  // Members can only edit tests they created
  if (user.currentWorkspaceRole === 'member') {
    return test.createdBy?._id === user._id;
  }
  
  // Default to false if no role or unrecognized role
  return false;
};

export const canTrashTest = (test: Test, user: { _id: string; currentWorkspaceRole?: 'admin' | 'member' | null } | null): boolean => {
  if (!user) return false;
  
  // Admin can trash any test in the workspace
  if (user.currentWorkspaceRole === 'admin') return true;
  
  // Members can only trash tests they created
  if (user.currentWorkspaceRole === 'member') {
    return test.createdBy?._id === user._id;
  }
  
  // Default to false if no role or unrecognized role
  return false;
}; 