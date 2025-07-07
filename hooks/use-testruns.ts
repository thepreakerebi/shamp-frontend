import { useAuth } from "@/lib/auth";
import { useEffect, useCallback, useRef } from "react";
import io from "socket.io-client";
import { useTestRunsStore } from "@/lib/store/testruns";
import { useTestsStore } from "@/lib/store/tests";
import { useBatchTestsStore } from "@/lib/store/batchTests";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL as string;

// --- Workspace-specific guards to prevent duplicate fetches ---
const workspaceFetchState: Record<string, { runsFetched: boolean; trashedRunsFetched: boolean }> = {};

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
  stepsWithScreenshots?: { step: Record<string, unknown>; screenshot: string | null }[];
  recordings?: Artifact[];
  personaName?: string;
  personaAvatarUrl?: string;
  workspace: string;
  createdBy?: {
    _id: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    email: string;
  };
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

const fetcher = (url: string, token: string, workspaceId?: string | null): Promise<unknown> =>
  fetch(`${API_BASE}${url}`, {
    credentials: "include",
    headers: { 
      Authorization: `Bearer ${token}`,
      ...(workspaceId ? { 'X-Workspace-ID': workspaceId } : {})
    },
  }).then(res => {
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json() as Promise<unknown>;
  });

export function useTestRuns() {
  const { token, currentWorkspaceId } = useAuth();
  const store = useTestRunsStore();
  const {
    setSuccessfulCount,
    setFailedCount,
    addTestRunToList,
    removeTestRunFromList,
    updateTestRunInList,
    addTrashedTestRun,
    removeTrashedTestRun,
    emptyTrashedTestRuns,
    setTestRuns,
    setTestRunsLoading,
    setTestRunsError,
    setTrashedTestRuns,
    moveRunToTrash,
  } = store;

  // Helper to always get the latest store snapshot inside socket listeners
  const getState = useTestRunsStore.getState;

  // Add/update a run in per-test cache held in useTestsStore
  const syncRunToTestCache = (run: TestRun) => {
    const testId = (run as { test?: string }).test;
    if (!testId) return;
    const testsStore = useTestsStore.getState();
    const prev = testsStore.getTestRunsForTest(testId) || [];
    const idx = prev.findIndex(r => r._id === run._id);
    const updatedArr = idx === -1 ? [run, ...prev] : prev.map(r => r._id === run._id ? run : r);
    testsStore.setTestRunsForTest(testId, updatedArr);
  };

  const removeRunFromTestCache = (id: string) => {
    useTestsStore.getState().removeTestRunFromList(id);
  };

  // Helper: add or update a run in global list AND per-test cache
  const addRunToStores = (run: TestRun) => {
    addTestRunToList(run);
    syncRunToTestCache(run);
    // Also sync into any cached batch-test run lists where this run already exists
    const batchStore = useBatchTestsStore.getState();
    const { batchTestRuns, setTestRunsForBatchTest } = batchStore;
    Object.entries(batchTestRuns).forEach(([batchId, runs]) => {
      const idx = runs.findIndex(r => r._id === run._id);
      if (idx !== -1) {
        const updated = [...runs];
        updated[idx] = run;
        setTestRunsForBatchTest(batchId, updated);
      }
    });
  };

  // Real-time updates (initialize socket only once)
  const socketRef = useRef<ReturnType<typeof io> | null>(null);
  useEffect(() => {
    if (!token || !currentWorkspaceId) return;
    if (socketRef.current) return; // already connected in this tab

    socketRef.current = io(SOCKET_URL, {
      transports: ["websocket"],
      auth: { token, workspaceId: currentWorkspaceId },
    });
    const socket = socketRef.current;
    // Listen for test run events
    socket.on("testRun:started", ({ testRun, workspace }: { testRun: TestRun; workspace?: string }) => {
      if (workspace && workspace !== currentWorkspaceId) return;
      addRunToStores(testRun);
    });
    socket.on("testRun:scheduled", ({ testRun, workspace }: { testRun: TestRun; workspace?: string }) => {
      if (workspace && workspace !== currentWorkspaceId) return;
      addRunToStores(testRun);
    });
    socket.on(
      "testRun:trashed",
      ({ _id, workspace }: { _id?: string; workspace?: string }) => {
        if (workspace && workspace !== currentWorkspaceId) return;
        if (!_id) return; // safeguard for TypeScript – nothing to do without an ID

        const existing = getState().testRuns?.find((r) => r._id === _id);
        if (existing) {
          moveRunToTrash({ ...existing, trashed: true } as TestRun);
          removeRunFromTestCache(_id);

          // Remove trashed run from any batch-test run lists
          {
            const batchStore = useBatchTestsStore.getState();
            const { batchTestRuns, setTestRunsForBatchTest } = batchStore;
            Object.entries(batchTestRuns).forEach(([batchId, runs]) => {
              if (runs.some(r => r._id === _id)) {
                const filtered = runs.filter(r => r._id !== _id);
                setTestRunsForBatchTest(batchId, filtered);
              }
            });
          }

          fetchCounts();
        }
      }
    );
    socket.on("testRun:deleted", (payload: { _id?: string; testRunId?: string; workspace?: string }) => {
      if (payload.workspace && payload.workspace !== currentWorkspaceId) return;
      const idToRemove = payload.testRunId ?? payload._id;
      if (idToRemove) {
        removeTestRunFromList(idToRemove);
        removeTrashedTestRun(idToRemove);
        removeRunFromTestCache(idToRemove);
        // Remove from any cached batch-test run lists so counts stay accurate
        {
          const batchStore = useBatchTestsStore.getState();
          const { batchTestRuns, setTestRunsForBatchTest } = batchStore;
          Object.entries(batchTestRuns).forEach(([batchId, runs]) => {
            if (runs.some(r => r._id === idToRemove)) {
              const filtered = runs.filter(r => r._id !== idToRemove);
              setTestRunsForBatchTest(batchId, filtered);
            }
          });
        }
        // Refresh counts when a test run is deleted
        fetchCounts();
      }
    });
    socket.on("testRun:stopped", async ({ testRunId, workspace }: { testRunId: string; workspace?: string }) => {
      if (workspace && workspace !== currentWorkspaceId) return;
      const current = getState().testRuns?.find(r => r._id === testRunId);
      if (!current) return;

      // 1) Optimistic update so UI (summary panel & toolbar) reacts immediately.
      //    We only mark browserUseStatus as "stopped" and leave the test-run
      //    status untouched. This mirrors the behaviour on the main branch and
      //    avoids the brief placeholder "cancelled" state in the UI.
      {
        const optimistic: TestRun = {
          ...current,
          browserUseStatus: "stopped",
        } as TestRun;
        updateTestRunInList(optimistic);
        syncRunToTestCache(optimistic);
        // Propagate optimistic update into batch-test caches if present
        {
          const batchStore = useBatchTestsStore.getState();
          const { batchTestRuns, setTestRunsForBatchTest } = batchStore;
          Object.entries(batchTestRuns).forEach(([batchId, runs]) => {
            const idx = runs.findIndex(r => r._id === testRunId);
            if (idx !== -1) {
              const updated = [...runs];
              updated[idx] = optimistic;
              setTestRunsForBatchTest(batchId, updated);
            }
          });
        }
      }

      // 2) Fetch definitive status/analysis in the background and merge it in
      //    once available. This may update status to "succeeded"/"failed" and
      //    attach extra data, but the critical UI flip has already happened.
      try {
        const res = await fetch(`${API_BASE}/testruns/${testRunId}`, {
          credentials: "include",
          headers: { 
            Authorization: `Bearer ${token}`,
            'X-Workspace-ID': currentWorkspaceId
          },
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
          syncRunToTestCache(updated);
          // Batch-test run caches will pick up this run on the next explicit fetch.
          return;
        }
      } catch {/* ignore */}
      // No fetch? We already optimistically set finished flag; counts refresh
      fetchCounts();
    });
    socket.on("testRun:paused", async ({ testRunId, workspace }: { testRunId: string; workspace?: string }) => {
      if (workspace && workspace !== currentWorkspaceId) return;
      {
        const existing = getState().testRuns?.find(r => r._id === testRunId);
        if (existing) {
          const updated = { ...existing, status: 'paused', browserUseStatus: 'paused' } as TestRun;
          updateTestRunInList(updated);
          syncRunToTestCache(updated);
          {
            const batchStore = useBatchTestsStore.getState();
            const { batchTestRuns, setTestRunsForBatchTest } = batchStore;
            Object.entries(batchTestRuns).forEach(([batchId, runs]) => {
              const idx = runs.findIndex(r => r._id === testRunId);
              if (idx !== -1) {
                const updatedArr = [...runs];
                updatedArr[idx] = updated;
                setTestRunsForBatchTest(batchId, updatedArr);
              }
            });
          }
        } else {
          // not in list yet – fetch lightweight status and add
          try {
            const res = await fetch(`${API_BASE}/testruns/${testRunId}`, {
              credentials: 'include',
              headers: { 
                Authorization: `Bearer ${token}`,
                'X-Workspace-ID': currentWorkspaceId
              },
            });
            if (res.ok) {
              const run = (await res.json()) as TestRunStatus;
              addRunToStores(run as unknown as TestRun);
            }
          } catch {}
        }
      }
    });
    socket.on("testRun:resumed", async ({ testRunId, workspace }: { testRunId: string; workspace?: string }) => {
      if (workspace && workspace !== currentWorkspaceId) return;
      {
        const existing = getState().testRuns?.find(r => r._id === testRunId);
        if (existing) {
          const updated = { ...existing, status: 'running', browserUseStatus: 'running' } as TestRun;
          updateTestRunInList(updated);
          syncRunToTestCache(updated);
          {
            const batchStore = useBatchTestsStore.getState();
            const { batchTestRuns, setTestRunsForBatchTest } = batchStore;
            Object.entries(batchTestRuns).forEach(([batchId, runs]) => {
              const idx = runs.findIndex(r => r._id === testRunId);
              if (idx !== -1) {
                const updatedArr = [...runs];
                updatedArr[idx] = updated;
                setTestRunsForBatchTest(batchId, updatedArr);
              }
            });
          }
        } else {
          // not in list yet – fetch lightweight status and add
          try {
            const res = await fetch(`${API_BASE}/testruns/${testRunId}`, {
              credentials: 'include',
              headers: { 
                Authorization: `Bearer ${token}`,
                'X-Workspace-ID': currentWorkspaceId
              },
            });
            if (res.ok) {
              const run = (await res.json()) as TestRunStatus;
              addRunToStores(run as unknown as TestRun);
            }
          } catch {}
        }
      }
    });
    socket.on("testRun:finished", async ({ testRunId, workspace }: { testRunId: string; workspace?: string }) => {
      if (workspace && workspace !== currentWorkspaceId) return;
      const existing = getState().testRuns?.find(r => r._id === testRunId);

      if (existing) {
        // 1) Optimistic update so UI flips out of "running" state immediately.
        const optimistic: TestRun = {
          ...existing,
          browserUseStatus: "finished",
          // Keep current status (likely "running") – will be replaced by fetch.
          finishedAt: existing.finishedAt ?? new Date().toISOString(),
        } as TestRun;
        updateTestRunInList(optimistic);
        syncRunToTestCache(optimistic);
        // Propagate optimistic update into batch-test caches if present
        {
          const batchStore = useBatchTestsStore.getState();
          const { batchTestRuns, setTestRunsForBatchTest } = batchStore;
          Object.entries(batchTestRuns).forEach(([batchId, runs]) => {
            const idx = runs.findIndex(r => r._id === testRunId);
            if (idx !== -1) {
              const updated = [...runs];
              updated[idx] = optimistic;
              setTestRunsForBatchTest(batchId, updated);
            }
          });
        }
      }

      // 2) Fetch definitive data
      try {
        const res = await fetch(`${API_BASE}/testruns/${testRunId}`, {
          credentials: "include",
          headers: {
            Authorization: `Bearer ${token}`,
            "X-Workspace-ID": currentWorkspaceId,
          },
        });
        if (res.ok) {
          const run = (await res.json()) as TestRunStatus;
          const existingAfterOpt = getState().testRuns?.find((r) => r._id === testRunId);
          if (existingAfterOpt) {
            const updated = { ...existingAfterOpt, ...run } as TestRun;
            updateTestRunInList(updated);
            syncRunToTestCache(updated);
            // Batch-test run caches will refresh later; skip direct insertion.
            return;
          }
        }
      } catch {/* ignore */}
      // No fetch? We already optimistically set finished flag; counts refresh
      fetchCounts();
    });
    socket.on(
      "testRun:artifact",
      ({ testRunId, artifact, workspace }: { testRunId: string; artifact: Artifact; workspace?: string }) => {
        if (workspace && workspace !== currentWorkspaceId) return;
        const existing = getState().testRuns?.find(r => r._id === testRunId);
        if (existing && !(existing.artifacts || []).some(a => a._id === artifact._id)) {
          const updated: TestRun = {
            ...existing,
            artifacts: [...(existing.artifacts ?? []), artifact],
          } as TestRun;

          // Maintain stepsWithScreenshots array so UI canvases can update
          const sws = [...(existing.stepsWithScreenshots ?? [])];
          if (artifact.type === "step") {
            sws.push({ step: artifact.metadata as Record<string, unknown>, screenshot: artifact.url ?? null });
          } else if (artifact.type === "screenshot") {
            // attach to most recent step without screenshot
            for (let i = sws.length - 1; i >= 0; i--) {
              if (!sws[i].screenshot) { sws[i] = { ...sws[i], screenshot: artifact.url ?? null }; break; }
            }
          } else if (artifact.type === "recording") {
            const recArr: Artifact[] = [...(updated.recordings ?? [])];
            recArr.push(artifact);
            updated.recordings = recArr;
          }
          if (sws.length) (updated as TestRun).stepsWithScreenshots = sws;

          updateTestRunInList(updated);
          syncRunToTestCache(updated);
        }
      }
    );
    socket.on("testRun:chatMessage", () => {});
    socket.on("testRun:restored", ({ testRun, workspace }: { testRun: TestRun; workspace?: string }) => {
      if (workspace && workspace !== currentWorkspaceId) return;
      // remove from trash and add to active list
      removeTrashedTestRun(testRun._id);
      addRunToStores(testRun);
      // Refresh counts when a test run is restored
      fetchCounts();
    });
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, currentWorkspaceId]);

  // Fetch all test runs
  const fetchTestRuns = useCallback(async () => {
    if (!token || !currentWorkspaceId) return;
    setTestRunsLoading(true);
    setTestRunsError(null);
    try {
      const data = await fetcher("/testruns", token, currentWorkspaceId) as TestRun[];
      setTestRuns(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setTestRunsError(err.message);
      } else {
        setTestRunsError("Failed to fetch test runs");
      }
    } finally {
      setTestRunsLoading(false);
    }
  }, [token, currentWorkspaceId]);

  // Count successful/failed runs
  const fetchCounts = useCallback(async () => {
    if (!token || !currentWorkspaceId) {
      store.setCountsLoading(false);
      store.setSuccessfulCount(0);
      store.setFailedCount(0);
      return;
    }
    
    store.setCountsLoading(true);
    store.setCountsError(null);
    
    try {
      // Use the optimized combined endpoint
      const data = await fetcher("/testruns/counts", token, currentWorkspaceId) as { successful: number; failed: number };
      setSuccessfulCount(data.successful ?? 0);
      setFailedCount(data.failed ?? 0);
    } catch (err: unknown) {
      if (err instanceof Error) {
        store.setCountsError(err.message);
      } else {
        store.setCountsError("Failed to fetch test run counts");
      }
    } finally {
      store.setCountsLoading(false);
    }
  }, [token, currentWorkspaceId]);

  // Fetch trashed test runs
  const fetchTrashedTestRuns = useCallback(async () => {
    if (!token || !currentWorkspaceId) return;
    try {
      const data = await fetcher("/testruns/trashed", token, currentWorkspaceId) as TestRun[];
      setTrashedTestRuns(Array.isArray(data) ? data : []);
    } catch {
      // silent fail for trashed runs
    }
  }, [token, currentWorkspaceId]);

  // One-time startup fetch per workspace
  useEffect(() => {
    if (!token || !currentWorkspaceId) {
      // Clear data when no workspace context
      setTestRuns([]);
      setTrashedTestRuns([]);
      return;
    }
    
    // Get or create workspace state
    if (!workspaceFetchState[currentWorkspaceId]) {
      workspaceFetchState[currentWorkspaceId] = { runsFetched: false, trashedRunsFetched: false };
    }
    
    const wsState = workspaceFetchState[currentWorkspaceId];
    if (!wsState.runsFetched) {
      wsState.runsFetched = true;
      fetchTestRuns();
      fetchCounts();
    }
  }, [token, currentWorkspaceId, fetchTestRuns, fetchCounts]);

  useEffect(() => {
    if (!token || !currentWorkspaceId) return;
    
    // Get or create workspace state
    if (!workspaceFetchState[currentWorkspaceId]) {
      workspaceFetchState[currentWorkspaceId] = { runsFetched: false, trashedRunsFetched: false };
    }
    
    const wsState = workspaceFetchState[currentWorkspaceId];
    if (!wsState.trashedRunsFetched) {
      wsState.trashedRunsFetched = true;
      fetchTrashedTestRuns();
    }
  }, [token, currentWorkspaceId, fetchTrashedTestRuns]);

  // Start a test run
  const startTestRun = async (testId: string) => {
    if (!token || !currentWorkspaceId) throw new Error("Not authenticated or no workspace context");
    const res = await fetch(`${API_BASE}/testruns/start`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        'X-Workspace-ID': currentWorkspaceId
      },
      body: JSON.stringify({ testId }),
    });
    if (!res.ok) throw new Error("Failed to start test run");
    const data = await res.json();
    const run = data.testRun;
    if (run) {
      addRunToStores(run);
    }
    return data;
  };

  // Stop a test run
  const stopTestRun = async (id: string) => {
    if (!token || !currentWorkspaceId) throw new Error("Not authenticated or no workspace context");
    const res = await fetch(`${API_BASE}/testruns/${id}/stop`, {
      method: "PATCH",
      credentials: "include",
      headers: { 
        Authorization: `Bearer ${token}`,
        'X-Workspace-ID': currentWorkspaceId
      },
    });
    if (!res.ok) throw new Error("Failed to stop test run");
    return res.json();
  };

  // Pause a test run
  const pauseTestRun = async (id: string) => {
    if (!token || !currentWorkspaceId) throw new Error("Not authenticated or no workspace context");
    const res = await fetch(`${API_BASE}/testruns/${id}/pause`, {
      method: "PATCH",
      credentials: "include",
      headers: { 
        Authorization: `Bearer ${token}`,
        'X-Workspace-ID': currentWorkspaceId
      },
    });
    if (!res.ok) throw new Error("Failed to pause test run");
    return res.json();
  };

  // Resume a test run
  const resumeTestRun = async (id: string) => {
    if (!token || !currentWorkspaceId) throw new Error("Not authenticated or no workspace context");
    const res = await fetch(`${API_BASE}/testruns/${id}/resume`, {
      method: "PATCH",
      credentials: "include",
      headers: { 
        Authorization: `Bearer ${token}`,
        'X-Workspace-ID': currentWorkspaceId
      },
    });
    if (!res.ok) throw new Error("Failed to resume test run");
    return res.json();
  };

  // Delete a test run
  const deleteTestRun = async (id: string) => {
    if (!token || !currentWorkspaceId) throw new Error("Not authenticated or no workspace context");
    const res = await fetch(`${API_BASE}/testruns/${id}`, {
      method: "DELETE",
      credentials: "include",
      headers: { 
        Authorization: `Bearer ${token}`,
        'X-Workspace-ID': currentWorkspaceId
      },
    });
    if (!res.ok) throw new Error("Failed to delete test run");
    removeTestRunFromList(id);
    removeTrashedTestRun(id);
    removeRunFromTestCache(id);
    return res.json();
  };

  // Move test run to trash
  const moveTestRunToTrash = async (id: string) => {
    if (!token || !currentWorkspaceId) throw new Error("Not authenticated or no workspace context");
    const res = await fetch(`${API_BASE}/testruns/${id}/trash`, {
      method: "PATCH",
      credentials: "include",
      headers: { 
        Authorization: `Bearer ${token}`,
        'X-Workspace-ID': currentWorkspaceId
      },
    });
    if (!res.ok) throw new Error("Failed to move test run to trash");
    const testRun = await res.json();
    removeTestRunFromList(id);
    addTrashedTestRun({ ...testRun, trashed: true });
    removeRunFromTestCache(id);
    return testRun;
  };

  // Get test run status (full details)
  const getTestRunStatus = async (id: string): Promise<TestRunStatus> => {
    if (!token || !currentWorkspaceId) throw new Error("Not authenticated or no workspace context");
    const res = await fetch(`${API_BASE}/testruns/${id}`, {
      credentials: "include",
      headers: { 
        Authorization: `Bearer ${token}`,
        'X-Workspace-ID': currentWorkspaceId
      },
    });
    if (res.status === 404) {
      throw new Error("Not found");
    }
    if (!res.ok) {
      throw new Error("Failed to fetch test run status");
    }
    const status = await res.json();
    
    // Merge fetched data into the global store so later socket updates start
    // from the rich version (with analysis). If the run isn't in the list yet
    // we add it; otherwise we merge but keep any existing analysis if the
    // payload doesn't include it.
    const existing = getState().testRuns?.find(r => r._id === id);
    if (existing) {
      const updated = {
        ...existing,
        ...status,
        analysis: (status as TestRunStatus).analysis ?? (existing as TestRunStatus).analysis,
      } as TestRun;
      updateTestRunInList(updated);
      syncRunToTestCache(updated);
    } else {
      addRunToStores(status as unknown as TestRun);
    }
    
    return status;
  };

  // Get test run media/artifacts
  const getTestRunMedia = async (id: string): Promise<Artifact[]> => {
    if (!token || !currentWorkspaceId) throw new Error("Not authenticated or no workspace context");
    const res = await fetch(`${API_BASE}/testruns/${id}/media`, {
      credentials: "include",
      headers: { 
        Authorization: `Bearer ${token}`,
        'X-Workspace-ID': currentWorkspaceId
      },
    });
    if (!res.ok) throw new Error("Failed to fetch test run media");
    return res.json();
  };

  // Chat with agent
  const chatWithAgent = async (payload: { testId?: string; testRunId?: string; message: string }) => {
    if (!token || !currentWorkspaceId) throw new Error("Not authenticated or no workspace context");
    const res = await fetch(`${API_BASE}/testruns/chat`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        'X-Workspace-ID': currentWorkspaceId
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to send message");
    return res.json();
  };

  // Get chat history
  const getChatHistory = async (params: { testId: string; testRunId?: string; personaId?: string }) => {
    if (!token || !currentWorkspaceId) throw new Error("Not authenticated or no workspace context");
    const searchParams = new URLSearchParams();
    if (params.testId) searchParams.set('testId', params.testId);
    if (params.testRunId) searchParams.set('testRunId', params.testRunId);
    if (params.personaId) searchParams.set('personaId', params.personaId);
    
    const res = await fetch(`${API_BASE}/testruns/chat/history?${searchParams.toString()}`, {
      credentials: "include",
      headers: { 
        Authorization: `Bearer ${token}`,
        'X-Workspace-ID': currentWorkspaceId
      },
    });
    if (!res.ok) throw new Error("Failed to fetch chat history");
    return res.json();
  };

  // Restore test run from trash
  const restoreTestRunFromTrash = async (id: string) => {
    if (!token || !currentWorkspaceId) throw new Error("Not authenticated or no workspace context");
    const res = await fetch(`${API_BASE}/testruns/${id}/restore`, {
      method: "PATCH",
      credentials: "include",
      headers: { 
        Authorization: `Bearer ${token}`,
        'X-Workspace-ID': currentWorkspaceId
      },
    });
    if (!res.ok) throw new Error("Failed to restore test run from trash");
    const testRun = await res.json();
    removeTrashedTestRun(id);
    addRunToStores({ ...testRun, trashed: false });
    return testRun;
  };

  // Update scheduled test run
  const updateScheduledTestRun = async (
    id: string,
    update: Partial<{ personaId: string; scheduledFor: string }>,
    personaName?: string,
  ): Promise<TestRun> => {
    if (!token || !currentWorkspaceId) throw new Error("Not authenticated or no workspace context");
    const res = await fetch(`${API_BASE}/testruns/${id}/schedule`, {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        'X-Workspace-ID': currentWorkspaceId
      },
      body: JSON.stringify(update),
    });
    if (!res.ok) throw new Error("Failed to update scheduled test run");
    const testRun = await res.json();
    
    // Update the run in the store with persona name if provided
    const updatedRun = personaName 
      ? { ...testRun, personaName } 
      : testRun;
    
    updateTestRunInList(updatedRun);
    syncRunToTestCache(updatedRun);
    return updatedRun;
  };

  // Empty test run trash
  const emptyTestRunTrash = async () => {
    if (!token || !currentWorkspaceId) throw new Error("Not authenticated or no workspace context");
    const res = await fetch(`${API_BASE}/testruns/trash/empty`, {
      method: "DELETE",
      credentials: "include",
      headers: { 
        Authorization: `Bearer ${token}`,
        'X-Workspace-ID': currentWorkspaceId
      },
    });
    if (!res.ok) throw new Error("Failed to empty test run trash");
    const result = await res.json();
    emptyTrashedTestRuns();
    return result;
  };

  return {
    testRuns: store.testRuns,
    testRunsLoading: store.testRunsLoading,
    testRunsError: store.testRunsError,
    trashedTestRuns: store.trashedTestRuns,
    successfulCount: store.successfulCount,
    failedCount: store.failedCount,
    countsLoading: store.countsLoading,
    countsError: store.countsError,
    startTestRun,
    stopTestRun,
    pauseTestRun,
    resumeTestRun,
    deleteTestRun,
    moveTestRunToTrash,
    restoreTestRunFromTrash,
    getTestRunStatus,
    getTestRunMedia,
    chatWithAgent,
    getChatHistory,
    updateScheduledTestRun,
    emptyTestRunTrash,
    refetch: fetchTestRuns,
    refetchCounts: fetchCounts,
    refetchTrashed: fetchTrashedTestRuns,
    fetchFailedCount: fetchCounts,
    fetchSuccessfulCount: fetchCounts,
    refetchAllTestRuns: fetchTestRuns,
    fetchTrashedTestRuns,
    hasWorkspaceContext: !!currentWorkspaceId,
  };
}

// ----------------------------------------
// Permission helpers (module-level)
// ----------------------------------------

/**
 * Determine if the current user can trash (or delete) a test run.
 * Admins can trash any run in the workspace.
 * Members can only trash runs they created.
 */
export const canTrashTestRun = (
  run: TestRun,
  user: { _id: string; currentWorkspaceRole?: 'admin' | 'member' | null } | null,
): boolean => {
  if (!user) return false;
  if (user.currentWorkspaceRole === 'admin') return true;
  if (user.currentWorkspaceRole === 'member') {
    return run.createdBy?._id === user._id;
  }
  return false;
}; 