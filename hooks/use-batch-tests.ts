import { useAuth } from "@/lib/auth";
import { useEffect, useState, useCallback } from "react";
import io from "socket.io-client";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000";

export interface BatchTest {
  _id: string;
  project: string;
  batchPersona: string;
  test: string;
  testRuns?: string[];
  createdBy?: string;
  trashed?: boolean;
  // Add other fields as needed
}

export interface BatchTestAnalysis {
  result: Record<string, unknown>;
  createdAt: string;
  triggeredBy?: string;
}

export type BatchTestAnalysisHistoryEntry = BatchTestAnalysis;

const fetcher = (url: string, token: string) =>
  fetch(`${API_BASE}${url}`, {
    credentials: "include",
    headers: { Authorization: `Bearer ${token}` },
  }).then(res => {
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
  });

export function useBatchTests() {
  const { token } = useAuth();
  const [batchTests, setBatchTests] = useState<BatchTest[] | null>(null);
  const [batchTestsLoading, setBatchTestsLoading] = useState(true);
  const [batchTestsError, setBatchTestsError] = useState<string | null>(null);

  const fetchBatchTests = useCallback(async () => {
    if (!token) return;
    setBatchTestsLoading(true);
    setBatchTestsError(null);
    try {
      const data = await fetcher("/batchtests", token);
      setBatchTests(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setBatchTestsError(err.message);
      } else {
        setBatchTestsError("Failed to fetch batch tests");
      }
    } finally {
      setBatchTestsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    fetchBatchTests();
  }, [token, fetchBatchTests]);

  useEffect(() => {
    if (!token) return;
    const socket = io(SOCKET_URL, {
      transports: ["websocket"],
      auth: { token },
    });
    const handleUpdate = () => {
      fetchBatchTests();
    };
    socket.on("batchTest:created", handleUpdate);
    socket.on("batchTest:deleted", handleUpdate);
    socket.on("batchTest:updated", handleUpdate);
    socket.on("batchTest:trashed", handleUpdate);
    return () => {
      socket.off("batchTest:created", handleUpdate);
      socket.off("batchTest:deleted", handleUpdate);
      socket.off("batchTest:updated", handleUpdate);
      socket.off("batchTest:trashed", handleUpdate);
      socket.disconnect();
    };
  }, [fetchBatchTests, token]);

  const getBatchTestById = async (id: string): Promise<BatchTest> => {
    if (!token) throw new Error("Not authenticated");
    const res = await fetch(`${API_BASE}/batchtests/${id}`, {
      credentials: "include",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to fetch batch test");
    return res.json();
  };

  const createBatchTest = async (payload: Omit<BatchTest, '_id' | 'testRuns' | 'createdBy' | 'trashed'>) => {
    if (!token) throw new Error("Not authenticated");
    const res = await fetch(`${API_BASE}/batchtests`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to create batch test");
    return res.json();
  };

  const updateBatchTest = async (id: string, payload: Partial<Omit<BatchTest, '_id' | 'testRuns' | 'createdBy' | 'trashed'>>) => {
    if (!token) throw new Error("Not authenticated");
    const res = await fetch(`${API_BASE}/batchtests/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to update batch test");
    return res.json();
  };

  const moveBatchTestToTrash = async (id: string) => {
    if (!token) throw new Error("Not authenticated");
    const res = await fetch(`${API_BASE}/batchtests/${id}/trash`, {
      method: "POST",
      credentials: "include",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to move batch test to trash");
    return res.json();
  };

  const deleteBatchTest = async (id: string, deleteTestRuns = false) => {
    if (!token) throw new Error("Not authenticated");
    const url = `${API_BASE}/batchtests/${id}${deleteTestRuns ? `?deleteTestRuns=true` : ''}`;
    const res = await fetch(url, {
      method: "DELETE",
      credentials: "include",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to delete batch test");
    return res.json();
  };

  const analyzeBatchTestOutputs = async (id: string): Promise<BatchTestAnalysis> => {
    if (!token) throw new Error("Not authenticated");
    const res = await fetch(`${API_BASE}/batchtests/${id}/analyze-outputs`, {
      credentials: "include",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to analyze batch test outputs");
    return res.json();
  };

  const getBatchTestAnalysisHistory = async (id: string): Promise<BatchTestAnalysisHistoryEntry[]> => {
    if (!token) throw new Error("Not authenticated");
    const res = await fetch(`${API_BASE}/batchtests/${id}/analysis-history`, {
      credentials: "include",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to fetch batch test analysis history");
    return res.json();
  };

  return {
    batchTests,
    batchTestsError,
    batchTestsLoading,
    getBatchTestById,
    createBatchTest,
    updateBatchTest,
    moveBatchTestToTrash,
    deleteBatchTest,
    analyzeBatchTestOutputs,
    getBatchTestAnalysisHistory,
    refetch: fetchBatchTests,
  };
} 