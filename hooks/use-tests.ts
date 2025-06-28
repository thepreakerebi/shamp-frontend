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

type TestPayload = {
  name: string;
  description: string;
  project: string;
  persona: string;
  browserViewportWidth?: number;
  browserViewportHeight?: number;
};

export interface TestAnalysis {
  result: Record<string, unknown>;
  createdAt: string;
  triggeredBy?: string;
}

export type TestAnalysisHistoryEntry = TestAnalysis;

export interface TestRunSummary {
  _id: string;
  personaName?: string;
  status: string;
  browserUseStatus?: string;
  stepsWithScreenshots?: { step: Record<string, unknown>; screenshot: string | null }[];
  recordings?: Record<string, unknown>[];
  analysis?: Record<string, unknown>;
  test?: string;
  scheduledFor?: string;
}

const fetcher = (url: string, token: string) =>
  fetch(`${API_BASE}${url}`, {
    credentials: "include",
    headers: { Authorization: `Bearer ${token}` },
  }).then(res => {
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
  });

export function useTests() {
  const { token } = useAuth();
  const {
    tests,
    testsError,
    testsLoading,
    count,
    countError,
    countLoading,
    setTests,
    trashedTests,
    setTrashedTests,
    addTrashedTest,
    removeTrashedTest,
    emptyTrashedTests,
    setTestsLoading,
    setTestsError,
    setCount,
    setCountLoading,
    setCountError,
  } = useTestsStore();

  const fetchTests = useCallback(async () => {
    if (!token) {
      setTestsLoading(false);
      setTests([]);
      return;
    }
    setTestsLoading(true);
    setTestsError(null);
    try {
      const data = await fetcher(`/tests?page=1&limit=250`, token);
      if (Array.isArray(data)) {
        setTests(data.filter((t: Test) => t.trashed !== true));
      } else if (data && Array.isArray(data.data)) {
        setTests(data.data.filter((t: Test) => t.trashed !== true));
      } else {
        setTests([]);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setTestsError(err.message);
      } else {
        setTestsError("Failed to fetch tests");
      }
    } finally {
      setTestsLoading(false);
    }
  }, [token, setTests, setTestsLoading, setTestsError]);

  const fetchCount = useCallback(async () => {
    if (!token) {
      setCountLoading(false);
      setCount(0);
      return;
    }
    setCountLoading(true);
    setCountError(null);
    try {
      const data = await fetcher("/tests/count", token);
      setCount(data.count ?? 0);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setCountError(err.message);
      } else {
        setCountError("Failed to fetch test count");
      }
    } finally {
      setCountLoading(false);
    }
  }, [token, setCount, setCountLoading, setCountError]);

  const fetchTrashedTests = useCallback(async () => {
    if (!token) return;
    try {
      const data = await fetcher('/tests/trashed', token);
      if (Array.isArray(data)) {
        setTrashedTests(data);
      }
    } catch {
      // silent
    }
  }, [token, setTrashedTests]);

  // Remote search/filter
  const searchTests = useCallback(
    async (params: Record<string, string | number | undefined>) => {
      if (!token) return;
      setTestsLoading(true);
      setTestsError(null);
      try {
        const filtered: Record<string, string> = {};
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== "") {
            filtered[key] = String(value);
          }
        });
        const qs = new URLSearchParams(filtered).toString();
        const data = await fetcher(`/tests/search?${qs}`, token);
        // expects { total, page, limit, data }
        if (data && Array.isArray(data.data)) {
          setTests(data.data.filter((t: Test)=> t.trashed !== true));
        } else {
          setTests([]);
        }
        setCount(data.total ?? data.data?.length ?? 0);
      } catch (err: unknown) {
        if (err instanceof Error) setTestsError(err.message);
        else setTestsError("Failed to search tests");
      } finally {
        setTestsLoading(false);
      }
    },
    [token, setTests, setTestsLoading, setTestsError, setCount]
  );

  // Refetch both tests and count
  const refetch = useCallback(() => {
    fetchTests();
    fetchCount();
  }, [fetchTests, fetchCount]);

  useEffect(() => {
    if (!token) return;
    fetchTests();
    fetchCount();
    fetchTrashedTests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (!token) return;
    const socket = io(SOCKET_URL, {
      transports: ["websocket"],
      auth: { token },
    });
    socket.on("test:created", () => {
      refetch();
    });
    socket.on("test:deleted", ({ _id }: { _id: string }) => {
      useTestsStore.getState().removeTestFromList(_id);
      removeTrashedTest(_id);
    });
    socket.on("test:trashed", (test: Test) => {
      useTestsStore.getState().removeTestFromList(test._id);
      addTrashedTest({ ...test, trashed: true });
    });
    socket.on("test:updated", (test: Test) => {
      if (test.trashed) {
        useTestsStore.getState().removeTestFromList(test._id);
        addTrashedTest({ ...test, trashed: true });
      } else {
        removeTrashedTest(test._id);
        useTestsStore.getState().updateTestInList(test);
      }
    });
    return () => {
      socket.disconnect();
    };
  }, [token, refetch, addTrashedTest, removeTrashedTest]);

  // Get a single test by ID
  const getTestById = async (id: string): Promise<Test> => {
    if (!token) throw new Error("Not authenticated");
    const res = await fetch(`${API_BASE}/tests/${id}`, {
      credentials: "include",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to fetch test");
    return res.json();
  };

  // Create a test
  const createTest = async (payload: TestPayload) => {
    if (!token) throw new Error("Not authenticated");
    const res = await fetch(`${API_BASE}/tests`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to create test");
    const test = await res.json();
    useTestsStore.getState().addTestToList(test);
    return test;
  };

  // Update a test
  const updateTest = async (id: string, payload: TestPayload) => {
    if (!token) throw new Error("Not authenticated");
    const res = await fetch(`${API_BASE}/tests/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
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
    if (!token) throw new Error("Not authenticated");
    const url = `${API_BASE}/tests/${id}${deleteTestRuns ? `?deleteTestRuns=true` : ''}`;
    const res = await fetch(url, {
      method: "DELETE",
      credentials: "include",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to delete test");
    useTestsStore.getState().removeTestFromList(id);
    return res.json();
  };

  // Analyze all test runs for a test (aggregate analysis)
  const analyzeTestOutputs = async (id: string): Promise<TestAnalysis> => {
    if (!token) throw new Error("Not authenticated");
    const res = await fetch(`${API_BASE}/tests/${id}/analyze-outputs`, {
      credentials: "include",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to analyze test outputs");
    return res.json();
  };

  // Get full analysis history for a test
  const getTestAnalysisHistory = async (id: string): Promise<TestAnalysisHistoryEntry[]> => {
    if (!token) throw new Error("Not authenticated");
    const res = await fetch(`${API_BASE}/tests/${id}/analysis-history`, {
      credentials: "include",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to fetch test analysis history");
    return res.json();
  };

  // Move a test to trash
  const moveTestToTrash = async (id: string) => {
    if (!token) throw new Error("Not authenticated");
    const res = await fetch(`${API_BASE}/tests/${id}/trash`, {
      method: "PATCH",
      credentials: "include",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to move test to trash");
    const data = await res.json();
    const updated = data.test ?? data;
    useTestsStore.getState().removeTestFromList(id);
    addTrashedTest({ ...updated, trashed: true });
    return updated;
  };

  // Restore a test from trash
  const restoreTestFromTrash = async (id: string) => {
    if (!token) throw new Error("Not authenticated");
    const res = await fetch(`${API_BASE}/tests/${id}/restore`, {
      method: "PATCH",
      credentials: "include",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to restore test from trash");
    const data = await res.json();
    const restored = data.test ?? data;
    removeTrashedTest(id);
    useTestsStore.getState().updateTestInList(restored);
    return restored;
  };

  // Duplicate a test
  const duplicateTest = async (id: string) => {
    if (!token) throw new Error("Not authenticated");
    const res = await fetch(`${API_BASE}/tests/${id}/duplicate`, {
      method: "POST",
      credentials: "include",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to duplicate test");
    const test = await res.json();
    useTestsStore.getState().addTestToList(test);
    return test;
  };

  // Get all test runs for a test (non-trashed)
  const getTestRunsForTest = async (id: string, forceRefresh = false): Promise<TestRunSummary[]> => {
    if (!token) throw new Error("Not authenticated");
    const cached = useTestsStore.getState().getTestRunsForTest(id);
    if (cached && !forceRefresh) {
      return cached as unknown as TestRunSummary[];
    }
    const res = await fetch(`${API_BASE}/tests/${id}/testruns`, {
      credentials: "include",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to fetch test runs");
    const runs = (await res.json()) as TestRunSummary[];
    const getTimestamp = (id: string) => parseInt(id.substring(0, 8), 16) * 1000;
    const sorted = [...runs].sort((a, b) => getTimestamp(b._id) - getTimestamp(a._id));
    useTestsStore.getState().setTestRunsForTest(id, sorted as unknown as TestRun[]);
    // Merge into global TestRuns store without overwriting existing list
    const { addTestRunToList } = useTestRunsStore.getState();
    sorted.forEach(r => addTestRunToList(r as unknown as import("@/hooks/use-testruns").TestRun));
    return sorted;
  };

  // Empty trash - permanently delete all trashed tests
  const emptyTestTrash = async (deleteTestRuns = false) => {
    if (!token) throw new Error("Not authenticated");
    const url = `${API_BASE}/tests/trash/empty${deleteTestRuns ? `?deleteTestRuns=true` : ''}`;
    const res = await fetch(url, {
      method: "DELETE",
      credentials: "include",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to empty test trash");
    const result = await res.json();
    emptyTrashedTests();
    return result;
  };

  return {
    tests,
    trashedTests,
    testsError,
    testsLoading,
    count,
    countError,
    countLoading,
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
  };
} 