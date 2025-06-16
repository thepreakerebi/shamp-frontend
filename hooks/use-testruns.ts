import { useAuth } from "@/lib/auth";
import { useEffect, useCallback } from "react";
import io from "socket.io-client";
import { useTestRunsStore } from "@/lib/store/testruns";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000";

export interface TestRun {
  _id: string;
  test: string;
  persona: string;
  status: string;
  artifacts: string[];
  startedAt?: string;
  finishedAt?: string;
  trashed?: boolean;
  // Add other fields as needed
}

export interface Artifact {
  _id: string;
  testRun: string;
  type: string;
  url?: string;
  metadata?: Record<string, unknown>;
  createdBy?: string;
  source?: string;
  createdAt?: string;
}

export interface TestRunStatus extends TestRun {
  browserUseStatus?: string;
  browserUseOutput?: string;
  browserUseSteps?: Record<string, unknown>[];
  browserUseLiveUrl?: string;
  browserUseCreatedAt?: string;
  browserUseFinishedAt?: string;
  stepsWithScreenshots?: { step: Record<string, unknown>; screenshot: string | null }[];
  analysis?: Record<string, unknown>;
}

export interface ChatMessage {
  testId?: string;
  testRunId?: string;
  personaId?: string;
  message: string;
  role: 'user' | 'agent';
  createdAt?: string;
}

const fetcher = (url: string, token: string): Promise<unknown> =>
  fetch(`${API_BASE}${url}`, {
    credentials: "include",
    headers: { Authorization: `Bearer ${token}` },
  }).then(res => {
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json() as Promise<unknown>;
  });

export function useTestRuns() {
  const { token } = useAuth();
  const store = useTestRunsStore();
  const {
    setSuccessfulCount,
    setFailedCount,
    addTestRunToList,
    removeTestRunFromList,
    updateTestRunInList,
  } = store;

  // Real-time updates
  useEffect(() => {
    if (!token) return;
    const socket = io(SOCKET_URL, {
      transports: ["websocket"],
      auth: { token },
    });
    // Listen for test run events
    socket.on("testRun:started", ({ testRun }: { testRun: TestRun }) => {
      addTestRunToList(testRun);
    });
    socket.on("testRun:trashed", ({ _id }: { _id: string }) => {
      removeTestRunFromList(_id);
    });
    socket.on("testRun:deleted", ({ _id }: { _id: string }) => {
      removeTestRunFromList(_id);
    });
    socket.on("testRun:stopped", ({ testRunId }: { testRunId: string }) => {
      {
        const existing = store.testRuns?.find(r => r._id === testRunId);
        if (existing) updateTestRunInList({ ...existing, status: 'cancelled' });
      }
    });
    socket.on("testRun:paused", ({ testRunId }: { testRunId: string }) => {
      {
        const existing = store.testRuns?.find(r => r._id === testRunId);
        if (existing) updateTestRunInList({ ...existing, status: 'cancelled' });
      }
    });
    socket.on("testRun:resumed", ({ testRunId }: { testRunId: string }) => {
      {
        const existing = store.testRuns?.find(r => r._id === testRunId);
        if (existing) updateTestRunInList({ ...existing, status: 'running' });
      }
    });
    socket.on("testRun:finished", ({ testRunId }: { testRunId: string }) => {
      {
        const existing = store.testRuns?.find(r => r._id === testRunId);
        if (existing) updateTestRunInList({ ...existing, status: 'succeeded' });
      }
    });
    socket.on("testRun:failed", ({ testRunId }: { testRunId: string }) => {
      {
        const existing = store.testRuns?.find(r => r._id === testRunId);
        if (existing) updateTestRunInList({ ...existing, status: 'failed' });
      }
    });
    socket.on("testRun:artifact", () => {
      // Optionally update artifacts in testRuns state
    });
    socket.on("testRun:chatMessage", () => {});
    return () => {
      socket.disconnect();
    };
  }, [token, addTestRunToList, removeTestRunFromList, updateTestRunInList]);

  // Analytics
  const fetchSuccessfulCount = useCallback(async () => {
    if (!token) return;
    try {
      const data = await fetcher("/testruns/count/successful", token) as { count?: number };
      setSuccessfulCount(data.count ?? 0);
    } catch {
      setSuccessfulCount(null);
    }
  }, [token, setSuccessfulCount]);

  const fetchFailedCount = useCallback(async () => {
    if (!token) return;
    try {
      const data = await fetcher("/testruns/count/failed", token) as { count?: number };
      setFailedCount(data.count ?? 0);
    } catch {
      setFailedCount(null);
    }
  }, [token, setFailedCount]);

  // Start a test run
  const startTestRun = async (testId: string) => {
    if (!token) throw new Error("Not authenticated");
    const res = await fetch(`${API_BASE}/testruns/start`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ testId }),
    });
    if (!res.ok) throw new Error("Failed to start test run");
    return res.json() as Promise<{ testRun: TestRun; message: string }>;
  };

  // Stop, pause, resume, delete
  const stopTestRun = async (id: string) => {
    if (!token) throw new Error("Not authenticated");
    const res = await fetch(`${API_BASE}/testruns/${id}/stop`, {
      method: "PATCH",
      credentials: "include",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to stop test run");
    return res.json() as Promise<{ success: boolean; testRun: TestRun }>;
  };
  const pauseTestRun = async (id: string) => {
    if (!token) throw new Error("Not authenticated");
    const res = await fetch(`${API_BASE}/testruns/${id}/pause`, {
      method: "PATCH",
      credentials: "include",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to pause test run");
    return res.json() as Promise<{ success: boolean; testRun: TestRun }>;
  };
  const resumeTestRun = async (id: string) => {
    if (!token) throw new Error("Not authenticated");
    const res = await fetch(`${API_BASE}/testruns/${id}/resume`, {
      method: "PATCH",
      credentials: "include",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to resume test run");
    return res.json() as Promise<{ success: boolean; testRun: TestRun }>;
  };
  const deleteTestRun = async (id: string) => {
    if (!token) throw new Error("Not authenticated");
    const res = await fetch(`${API_BASE}/testruns/${id}`, {
      method: "DELETE",
      credentials: "include",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to delete test run");
    const resJson = await res.json() as { success: boolean };
    removeTestRunFromList(id);
    return resJson;
  };

  // Move a test run to trash (soft delete)
  const moveTestRunToTrash = async (id: string) => {
    if (!token) throw new Error("Not authenticated");
    const res = await fetch(`${API_BASE}/testruns/${id}/trash`, {
      method: "PATCH",
      credentials: "include",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to move test run to trash");
    const { testRun } = await res.json();
    removeTestRunFromList(id);
    return testRun;
  };

  // Get status, media
  const getTestRunStatus = async (id: string): Promise<TestRunStatus> => {
    if (!token) throw new Error("Not authenticated");
    const res = await fetch(`${API_BASE}/testruns/${id}/status`, {
      credentials: "include",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to fetch test run status");
    return res.json() as Promise<TestRunStatus>;
  };
  const getTestRunMedia = async (id: string): Promise<Artifact[]> => {
    if (!token) throw new Error("Not authenticated");
    const res = await fetch(`${API_BASE}/testruns/${id}/media`, {
      credentials: "include",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to fetch test run media");
    return res.json() as Promise<Artifact[]>;
  };

  // Chat
  const chatWithAgent = async (payload: { testId?: string; testRunId?: string; message: string }) => {
    if (!token) throw new Error("Not authenticated");
    const res = await fetch(`${API_BASE}/testruns/chat`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to chat with agent");
    return res.json() as Promise<{ answer: string }>;
  };
  const getChatHistory = async (params: { testId: string; testRunId?: string; personaId?: string }) => {
    if (!token) throw new Error("Not authenticated");
    const url = new URL(`${API_BASE}/testruns/chat/history`, window.location.origin);
    url.searchParams.append('testId', params.testId);
    if (params.testRunId) url.searchParams.append('testRunId', params.testRunId);
    if (params.personaId) url.searchParams.append('personaId', params.personaId);
    const res = await fetch(url.toString(), {
      credentials: "include",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to fetch chat history");
    return res.json() as Promise<ChatMessage[]>;
  };

  return {
    testRuns: store.testRuns,
    successfulCount: store.successfulCount,
    failedCount: store.failedCount,
    startTestRun,
    stopTestRun,
    pauseTestRun,
    resumeTestRun,
    deleteTestRun,
    moveTestRunToTrash,
    getTestRunStatus,
    getTestRunMedia,
    chatWithAgent,
    getChatHistory,
    fetchSuccessfulCount,
    fetchFailedCount,
  };
} 