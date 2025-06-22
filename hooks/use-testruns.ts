import { useAuth } from "@/lib/auth";
import { useEffect, useCallback } from "react";
import io from "socket.io-client";
import { useTestRunsStore } from "@/lib/store/testruns";
import { useTestsStore } from "@/lib/store/tests";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000";

// --- Singleton guards so side-effects run only once per browser session ---
let socketInitialized = false;
let runsFetchedOnce = false;

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
  browserUseOutput?: string;
  browserUseTaskId?: string;
  scheduledFor?: string;
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
  recordings?: Artifact[];
  browserUseTaskId?: string;
  analysis?: Record<string, unknown>;
  personaAvatarUrl?: string;
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
    setTestRuns,
    setTestRunsLoading,
    setTestRunsError,
  } = store;

  // Helper to always get the latest store snapshot inside socket listeners
  const getState = useTestRunsStore.getState;

  // Helper: add or update a run in global list AND per-test cache
  const addRunToStores = (run: TestRun) => {
    addTestRunToList(run);
    const testId = (run as { test?: string }).test;
    if (testId) {
      const testsStore = useTestsStore.getState();
      const prev = testsStore.getTestRunsForTest(testId) || [];
      const idx = prev.findIndex(r=>r._id === run._id);
      const nextArr = idx === -1 ? [run, ...prev] : prev.map(r=> r._id===run._id? run: r);
      testsStore.setTestRunsForTest(testId, nextArr);
    }
  };

  // Real-time updates (initialize socket only once)
  useEffect(() => {
    if (!token || socketInitialized) return;
    socketInitialized = true;
    const socket = io(SOCKET_URL, {
      transports: ["websocket"],
      auth: { token },
    });
    // Listen for test run events
    socket.on("testRun:started", ({ testRun }: { testRun: TestRun }) => {
      addRunToStores(testRun);
    });
    socket.on("testRun:scheduled", ({ testRun }: { testRun: TestRun }) => {
      addRunToStores(testRun);
    });
    socket.on("testRun:trashed", ({ _id }: { _id: string }) => {
      const existing = getState().testRuns?.find(r => r._id === _id);
      if (existing) {
        removeTestRunFromList(_id);
        addTrashedTestRun({ ...existing, trashed: true });
        useTestsStore.getState().removeTestRunFromList(_id);
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
          const updated = {
            ...current,
            status: run.status as typeof current.status,
            browserUseStatus: run.browserUseStatus,
            browserUseOutput: (run as TestRunStatus).browserUseOutput,
          } as TestRun;
          updateTestRunInList(updated);
          if ((updated as { test?: string }).test) {
            const tId = (updated as { test?: string }).test as string;
            const testsStore = useTestsStore.getState();
            const prevRuns = testsStore.getTestRunsForTest(tId) || [];
            testsStore.setTestRunsForTest(tId, prevRuns.map(r=> r._id===updated._id ? updated : r));
          }
          return;
        }
      } catch {/* ignore */}

      // Fallback: keep existing status, only mark browserUseStatus stopped
      // updateTestRunInList({ ...current, browserUseStatus: "stopped" });
    });
    socket.on("testRun:paused", ({ testRunId }: { testRunId: string }) => {
      {
        const existing = getState().testRuns?.find(r => r._id === testRunId);
        if (existing) {
          const updated = { ...existing, status: 'paused', browserUseStatus: 'paused' } as TestRun;
          updateTestRunInList(updated);
          if ((updated as { test?: string }).test) {
            const tId = (updated as { test?: string }).test as string;
            const testsStore = useTestsStore.getState();
            const prevRuns = testsStore.getTestRunsForTest(tId) || [];
            testsStore.setTestRunsForTest(tId, prevRuns.map(r=> r._id===updated._id? updated: r));
          }
        }
      }
    });
    socket.on("testRun:resumed", ({ testRunId }: { testRunId: string }) => {
      {
        const existing = getState().testRuns?.find(r => r._id === testRunId);
        if (existing) {
          const updated = { ...existing, status: 'running', browserUseStatus: 'running' } as TestRun;
          updateTestRunInList(updated);
          if ((updated as { test?: string }).test) {
            const tId = (updated as { test?: string }).test as string;
            const testsStore = useTestsStore.getState();
            const prevRuns = testsStore.getTestRunsForTest(tId) || [];
            testsStore.setTestRunsForTest(tId, prevRuns.map(r=> r._id===updated._id? updated: r));
          }
        }
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
            const updated = {
              ...existing,
              status: run.status as typeof existing.status,
              browserUseStatus: run.browserUseStatus,
              browserUseOutput: (run as TestRunStatus).browserUseOutput,
            } as TestRun;
            updateTestRunInList(updated);
            if ((updated as { test?: string }).test) {
              const tId = (updated as { test?: string }).test as string;
              const testsStore = useTestsStore.getState();
              const prevRuns = testsStore.getTestRunsForTest(tId) || [];
              testsStore.setTestRunsForTest(tId, prevRuns.map(r=> r._id===updated._id? updated: r));
            }
          }
          return;
        }
      } catch {
        /* swallow */
      }
      // Fallback: assume success if we cannot fetch
      const existing = getState().testRuns?.find(r => r._id === testRunId);
      if (existing) {
        const updated = { ...existing, status: "succeeded", browserUseStatus: "finished" } as TestRun;
        updateTestRunInList(updated);
        if ((updated as { test?: string }).test) {
          const tId = (updated as { test?: string }).test as string;
          const testsStore = useTestsStore.getState();
          const prevRuns = testsStore.getTestRunsForTest(tId) || [];
          testsStore.setTestRunsForTest(tId, prevRuns.map(r=> r._id===updated._id? updated: r));
        }
      }
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
      addRunToStores(testRun);
    });
    return () => {
      socket.disconnect();
    };
  }, [token]);

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
    addRunToStores(data.testRun);
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
    const data = (await res.json()) as { status: string; browserUseStatus: string };
    const existing = getState().testRuns?.find(r=>r._id===id);
    if (existing) {
      const updated = { ...existing, status: data.status as TestRun["status"], browserUseStatus: data.browserUseStatus } as TestRun;
      updateTestRunInList(updated);
      if ((updated as { test?: string }).test) {
        const tId = (updated as { test?: string }).test as string;
        const testsStore = useTestsStore.getState();
        const prevRuns = testsStore.getTestRunsForTest(tId) || [];
        testsStore.setTestRunsForTest(tId, prevRuns.map(r=> r._id===updated._id? updated: r));
      }
    }
    return data;
  };
  const pauseTestRun = async (id: string) => {
    if (!token) throw new Error("Not authenticated");
    const res = await fetch(`${API_BASE}/testruns/${id}/pause`, {
      method: "PATCH",
      credentials: "include",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to pause test run");
    const data = (await res.json()) as { status: string; browserUseStatus: string };
    const existing = getState().testRuns?.find(r=>r._id===id);
    if (existing) {
      const updated = { ...existing, status: data.status as TestRun["status"], browserUseStatus: data.browserUseStatus } as TestRun;
      updateTestRunInList(updated);
      if ((updated as { test?: string }).test) {
        const tId = (updated as { test?: string }).test as string;
        const testsStore = useTestsStore.getState();
        const prevRuns = testsStore.getTestRunsForTest(tId) || [];
        testsStore.setTestRunsForTest(tId, prevRuns.map(r=> r._id===updated._id? updated: r));
      }
    }
    return data;
  };
  const resumeTestRun = async (id: string) => {
    if (!token) throw new Error("Not authenticated");
    const res = await fetch(`${API_BASE}/testruns/${id}/resume`, {
      method: "PATCH",
      credentials: "include",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to resume test run");
    const data = (await res.json()) as { status: string; browserUseStatus: string };
    const existing = getState().testRuns?.find(r=>r._id===id);
    if (existing) {
      const updated = { ...existing, status: data.status as TestRun["status"], browserUseStatus: data.browserUseStatus } as TestRun;
      updateTestRunInList(updated);
      if ((updated as { test?: string }).test) {
        const tId = (updated as { test?: string }).test as string;
        const testsStore = useTestsStore.getState();
        const prevRuns = testsStore.getTestRunsForTest(tId) || [];
        testsStore.setTestRunsForTest(tId, prevRuns.map(r=> r._id===updated._id? updated: r));
      }
    }
    return data;
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
    const run = (await res.json()) as TestRunStatus;

    // Always attempt to fetch latest media when a Browser-Use task ID is present.
    if (run.browserUseTaskId) {
      try {
        const mediaRes = await getTestRunMedia(id);
        const mediaArr = mediaRes as unknown as unknown[];
        if (mediaArr && mediaArr.length) {
          const normalised: Artifact[] = typeof mediaArr[0] === 'string'
            ? (mediaArr as string[]).map((u, idx) => ({
                _id: `${id}-media-${idx}`,
                testRun: id,
                type: 'recording',
                url: u,
              }))
            : (mediaArr as Artifact[]);
          run.recordings = normalised;
        }
      } catch {
        /* media might not be ready yet; ignore */
      }
    }

    return run;
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
    const raw = (await res.json()) as Record<string, unknown>[];
    // Backend stores chat messages under `text` but UI expects `message`.
    const normalised: ChatMessage[] = raw.map(m => {
      const rec = m as Record<string, unknown>;
      return {
        testId: rec.testId as string | undefined,
        testRunId: rec.testRunId as string | undefined,
        personaId: rec.personaId as string | undefined,
        message: (rec.message ?? rec.text ?? "") as string,
        role: (rec.role as "user" | "agent") ?? "agent",
        createdAt: (rec.timestamp as string | undefined) ?? undefined,
      };
    });
    return normalised;
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
    addRunToStores(testRun);
    return testRun;
  };

  // Update a pending scheduled test run (date/time/persona)
  const updateScheduledTestRun = async (
    id: string,
    update: Partial<{ personaId: string; scheduledFor: string }>,
    personaName?: string,
  ): Promise<TestRun> => {
    if (!token) throw new Error("Not authenticated");
    const res = await fetch(`${API_BASE}/testschedules/schedule/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(update),
    });
    if (!res.ok) throw new Error("Failed to update scheduled test run");
    const runRaw = (await res.json()) as TestRun & { test?: string };
    const run = personaName ? ({ ...runRaw, personaName } as TestRun & { test?: string }) : runRaw;
    // Optimistically update global list
    updateTestRunInList(run);

    // Also update per-test cache in TestsStore if we have the test id
    if (run.test) {
      const testsStore = useTestsStore.getState();
      const prevRuns = testsStore.getTestRunsForTest(run.test) || [];
      const existsIdx = prevRuns.findIndex(r=>r._id === run._id);
      let updatedArr;
      if (existsIdx !== -1) {
        updatedArr = prevRuns.map(r=> r._id === run._id ? (run as unknown as TestRun) : r);
      } else {
        updatedArr = [run as unknown as TestRun, ...prevRuns];
      }
      testsStore.setTestRunsForTest(run.test, updatedArr);
    }
    return run;
  };

  // Fetch all accessible test runs once per session after authentication
  useEffect(() => {
    if (!token || runsFetchedOnce) return;
    runsFetchedOnce = true;

    (async () => {
      if (!getState().testRunsLoading) setTestRunsLoading(true);
      setTestRunsError(null);
      try {
        const data = (await fetcher("/testruns", token)) as TestRunStatus[];
        setTestRuns(data as unknown as TestRun[]);
      } catch (err: unknown) {
        setTestRunsError(
          err instanceof Error ? err.message : "Failed to fetch test runs",
        );
        setTestRuns(null);
      } finally {
        setTestRunsLoading(false);
      }
    })();
  }, [token]);

  // Force reload of all runs
  const refetchAllTestRuns = useCallback(async () => {
    if (!token) return;
    setTestRunsLoading(true);
    setTestRunsError(null);
    try {
      const data = (await fetcher('/testruns', token)) as TestRun[];
      setTestRuns(data);
    } catch (err) {
      setTestRunsError(err instanceof Error ? err.message : 'Failed to fetch test runs');
    } finally {
      setTestRunsLoading(false);
    }
  }, [token, setTestRuns, setTestRunsLoading, setTestRunsError]);

  return {
    testRuns: store.testRuns,
    testRunsLoading: store.testRunsLoading,
    testRunsError: store.testRunsError,
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
    updateScheduledTestRun,
    refetchAllTestRuns,
  };
} 