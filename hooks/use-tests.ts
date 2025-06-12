import { useAuth } from "@/lib/auth";
import { useEffect, useCallback } from "react";
import io from "socket.io-client";
import { useTestsStore } from "@/lib/store/tests";

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
  description?: string;
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
  const store = useTestsStore();

  const fetchTests = useCallback(async () => {
    if (!token) {
      store.setTestsLoading(false);
      store.setTests([]);
      return;
    }
    store.setTestsLoading(true);
    store.setTestsError(null);
    try {
      const data = await fetcher("/tests", token);
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
  }, [token, store]);

  const fetchCount = useCallback(async () => {
    if (!token) {
      store.setCountLoading(false);
      store.setCount(0);
      return;
    }
    store.setCountLoading(true);
    store.setCountError(null);
    try {
      const data = await fetcher("/tests/count", token);
      store.setCount(data.count ?? 0);
    } catch (err: unknown) {
      if (err instanceof Error) {
        store.setCountError(err.message);
      } else {
        store.setCountError("Failed to fetch test count");
      }
    } finally {
      store.setCountLoading(false);
    }
  }, [token, store]);

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
    store.addTestToList(test);
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
    store.updateTestInList(test);
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
    store.removeTestFromList(id);
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

  return {
    tests: store.tests,
    testsError: store.testsError,
    testsLoading: store.testsLoading,
    count: store.count,
    countError: store.countError,
    countLoading: store.countLoading,
    createTest,
    updateTest,
    deleteTest,
    getTestById,
    refetch,
    analyzeTestOutputs,
    getTestAnalysisHistory,
  };
} 