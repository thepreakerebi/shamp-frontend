import { useAuth } from "@/lib/auth";
import { useEffect, useCallback } from "react";
import io from "socket.io-client";
import { useTestsStore } from "@/lib/store/tests";
import React from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000";

export interface Test {
  _id: string;
  name: string;
  description?: string;
  project: string;
  persona?: string;
  createdBy?: string;
  trashed?: boolean;
  // Add other fields as needed
}

type TestPayload = {
  name: string;
  description: string;
  project: string;
  persona: string;
};

export interface TestAnalysis {
  result: Record<string, unknown>;
  createdAt: string;
  triggeredBy?: string;
}

export type TestAnalysisHistoryEntry = TestAnalysis;

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
    setTestsLoading,
    setTestsError,
    setCount,
    setCountLoading,
    setCountError,
  } = useTestsStore();

  const latestSearchIdRef = React.useRef<number>(0);

  const fetchTests = useCallback(async () => {
    if (useTestsStore.getState().filtered) return;
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
    if (useTestsStore.getState().filtered) return;
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

  // Remote search/filter
  const searchTests = useCallback(
    async (params: Record<string, string | number | undefined>) => {
      // track latest search to avoid race condition
      const currentId = Date.now();
      latestSearchIdRef.current = currentId;

      const hasFilters = Object.keys(params).some((k) => !["page", "limit"].includes(k) && params[k] !== "" && params[k] !== undefined);
      useTestsStore.getState().setFiltered(hasFilters);
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
        if (latestSearchIdRef.current !== currentId) return; // outdated response
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
  }, [token, fetchTests, fetchCount]);

  useEffect(() => {
    if (!token) return;
    const socket = io(SOCKET_URL, {
      transports: ["websocket"],
      auth: { token },
    });
    const handleUpdate = () => {
      if (!useTestsStore.getState().filtered) {
        refetch();
      }
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
  }, [refetch, token]);

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
    // remove from active tests list
    useTestsStore.getState().removeTestFromList(id);
    refetch();
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
    useTestsStore.getState().updateTestInList(restored);
    refetch();
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

  const clearFilters = () => {
    useTestsStore.getState().setFiltered(false);
    fetchTests();
    fetchCount();
  };

  return {
    tests,
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
    analyzeTestOutputs,
    getTestAnalysisHistory,
    searchTests,
    clearFilters,
  };
} 