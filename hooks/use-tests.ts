import { useAuth } from "@/lib/auth";
import { useEffect, useState, useCallback } from "react";
import io from "socket.io-client";

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
  const [tests, setTests] = useState<Test[] | null>(null);
  const [testsLoading, setTestsLoading] = useState(true);
  const [testsError, setTestsError] = useState<string | null>(null);
  const [count, setCount] = useState(0);
  const [countLoading, setCountLoading] = useState(true);
  const [countError, setCountError] = useState<string | null>(null);

  const fetchTests = useCallback(async () => {
    if (!token) return;
    setTestsLoading(true);
    setTestsError(null);
    try {
      const data = await fetcher("/tests", token);
      setTests(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setTestsError(err.message);
      } else {
        setTestsError("Failed to fetch tests");
      }
    } finally {
      setTestsLoading(false);
    }
  }, [token]);

  const fetchCount = useCallback(async () => {
    if (!token) return;
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
  }, [token]);

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
    return res.json();
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
    return res.json();
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
    tests,
    testsError,
    testsLoading,
    count,
    countError,
    countLoading,
    createTest,
    updateTest,
    deleteTest,
    getTestById,
    refetch,
    analyzeTestOutputs,
    getTestAnalysisHistory,
  };
} 