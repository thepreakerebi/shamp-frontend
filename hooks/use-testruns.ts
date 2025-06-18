import { useAuth } from "@/lib/auth";
import { useEffect, useCallback } from "react";
import io from "socket.io-client";
import { useTestRunsStore } from "@/lib/store/testruns";
import { useTestsStore } from "@/lib/store/tests";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000";

export interface TestRun {
  _id: string;
  test: string;
  persona: string;
  status: "pending" | "running" | "paused" | "succeeded" | "failed" | "cancelled";
  artifacts: Artifact[];
  startedAt?: string;
  finishedAt?: string;
  trashed?: boolean;
  browserUseStatus?: string;
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
    addTrashedTestRun,
    removeTrashedTestRun,
  } = store;

  // Helper to always get the latest store snapshot inside socket listeners
  const getState = useTestRunsStore.getState;

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
      const existing = getState().testRuns?.find(r => r._id === _id);
      if (existing) {
        removeTestRunFromList(_id);
        addTrashedTestRun({ ...existing, trashed: true });
      }
    });
    socket.on("testRun:deleted", (payload: { _id?: string; testRunId?: string }) => {
      const idToRemove = payload.testRunId ?? payload._id;
      if (idToRemove) {
        removeTestRunFromList(idToRemove);
        removeTrashedTestRun(idToRemove);
        // also purge from tests store cache
        useTestsStore.getState().removeTestRunFromList(idToRemove);
      }
    });
    socket.on("testRun:stopped", async ({ testRunId }: { testRunId: string }) => {
      const current = getState().testRuns?.find(r => r._id === testRunId);
      if (!current) return;

      // Attempt to get the definitive status from the backend; if the request
      // fails we at least update browserUseStatus without touching status.
      try {
        const res = await fetch(`${API_BASE}/testruns/${testRunId}`, {
          credentials: "include",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const run = (await res.json()) as TestRunStatus;
          updateTestRunInList({
            ...current,
            status: run.status as typeof current.status,
            browserUseStatus: run.browserUseStatus,
          });
          return;
        }
      } catch {/* ignore */}

      // Fallback: keep existing status, only mark browserUseStatus stopped
      // updateTestRunInList({ ...current, browserUseStatus: "stopped" });
    });
    socket.on("testRun:paused", ({ testRunId }: { testRunId: string }) => {
      {
        const existing = getState().testRuns?.find(r => r._id === testRunId);
        if (existing) updateTestRunInList({ ...existing, status: 'paused', browserUseStatus: 'paused' });
      }
    });
    socket.on("testRun:resumed", ({ testRunId }: { testRunId: string }) => {
      {
        const existing = getState().testRuns?.find(r => r._id === testRunId);
        if (existing) updateTestRunInList({ ...existing, status: 'running', browserUseStatus: 'running' });
      }
    });
    socket.on("testRun:finished", async ({ testRunId }: { testRunId: string }) => {
      try {
        // Fetch the latest status from the backend so we know whether it
        // ended in "succeeded" or "failed".
        const res = await fetch(`${API_BASE}/testruns/${testRunId}`, {
          credentials: "include",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const run = (await res.json()) as TestRunStatus;
          // Map only the fields we keep in the list
          const existing = getState().testRuns?.find(r => r._id === testRunId);
          if (existing) {
            updateTestRunInList({
              ...existing,
              status: run.status as typeof existing.status,
              browserUseStatus: run.browserUseStatus,
            });
          }
          return;
        }
      } catch {
        /* swallow */
      }
      // Fallback: assume success if we cannot fetch
      const existing = getState().testRuns?.find(r => r._id === testRunId);
      if (existing) updateTestRunInList({ ...existing, status: "succeeded", browserUseStatus: "finished" });
    });
    socket.on(
      "testRun:artifact",
      ({ testRunId, artifact }: { testRunId: string; artifact: Artifact }) => {
        const existing = getState().testRuns?.find(r => r._id === testRunId);
        if (existing && !(existing.artifacts || []).some(a => a._id === artifact._id)) {
          updateTestRunInList({
            ...existing,
            artifacts: [...(existing.artifacts ?? []), artifact],
          });
        }
      }
    );
    socket.on("testRun:chatMessage", () => {});
    socket.on("testRun:restored", ({ testRun }: { testRun: TestRun }) => {
      // remove from trash and add to active list
      removeTrashedTestRun(testRun._id);
      addTestRunToList(testRun);
    });
    return () => {
      socket.disconnect();
    };
  }, [token, addTestRunToList, removeTestRunFromList, updateTestRunInList, addTrashedTestRun, removeTrashedTestRun]);

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
    const data = (await res.json()) as { testRun: TestRun; message: string };
    // Optimistically add to store so UI updates immediately
    addTestRunToList(data.testRun);
    return data;
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
    useTestsStore.getState().removeTestRunFromList(id);
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
    addTrashedTestRun({ ...testRun, trashed: true });
    return testRun;
  };

  // Get status, media
  const getTestRunStatus = async (id: string): Promise<TestRunStatus> => {
    if (!token) throw new Error("Not authenticated");
    const res = await fetch(`${API_BASE}/testruns/${id}`, {
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
    url.searchParams.append("testId", params.testId);
    if (params.testRunId) url.searchParams.append("testRunId", params.testRunId);
    if (params.personaId) url.searchParams.append("personaId", params.personaId);
    const res = await fetch(url.toString(), {
      credentials: "include",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to fetch chat history");
    return res.json() as Promise<ChatMessage[]>;
  };

  const restoreTestRunFromTrash = async (id: string) => {
    if (!token) throw new Error("Not authenticated");
    const res = await fetch(`${API_BASE}/testruns/${id}/restore`, {
      method: "PATCH",
      credentials: "include",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to restore test run");
    const { testRun } = await res.json();
    removeTrashedTestRun(id);
    addTestRunToList(testRun);
    return testRun;
  };

  return {
    testRuns: store.testRuns,
    trashedTestRuns: store.trashedTestRuns,
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
    restoreTestRunFromTrash,
  };
}