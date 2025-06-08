import { useAuth } from "@/lib/auth";
import { useState, useCallback } from "react";

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Start batch test runs
  const startBatchTestRuns = useCallback(async (batchTestId: string) => {
    if (!token) throw new Error("Not authenticated");
    setLoading(true);
    setError(null);
    try {
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
      return await res.json() as BatchTest;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to start batch test runs");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Pause batch test runs
  const pauseBatchTestRuns = useCallback(async (id: string) => {
    if (!token) throw new Error("Not authenticated");
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/batchtestruns/${id}/pause`, {
        method: "POST",
        credentials: "include",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to pause batch test runs");
      return await res.json() as BatchTestActionResult;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to pause batch test runs");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Resume batch test runs
  const resumeBatchTestRuns = useCallback(async (id: string) => {
    if (!token) throw new Error("Not authenticated");
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/batchtestruns/${id}/resume`, {
        method: "POST",
        credentials: "include",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to resume batch test runs");
      return await res.json() as BatchTestActionResult;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to resume batch test runs");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Stop batch test runs
  const stopBatchTestRuns = useCallback(async (id: string) => {
    if (!token) throw new Error("Not authenticated");
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/batchtestruns/${id}/stop`, {
        method: "POST",
        credentials: "include",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to stop batch test runs");
      return await res.json() as BatchTestActionResult;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to stop batch test runs");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [token]);

  return {
    loading,
    error,
    startBatchTestRuns,
    pauseBatchTestRuns,
    resumeBatchTestRuns,
    stopBatchTestRuns,
  };
} 