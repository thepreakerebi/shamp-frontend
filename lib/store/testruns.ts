import { create } from "zustand";
import type { TestRun } from "@/hooks/use-testruns";

interface TestRunsState {
  testRuns: TestRun[] | null;
  trashedTestRuns: TestRun[] | null;
  testRunsLoading: boolean;
  testRunsError: string | null;
  successfulCount: number | null;
  failedCount: number | null;
  countsLoading: boolean;
  countsError: string | null;
  setTestRuns: (runs: TestRun[] | null) => void;
  setTestRunsLoading: (loading: boolean) => void;
  setTestRunsError: (error: string | null) => void;
  setSuccessfulCount: (count: number | null) => void;
  setFailedCount: (count: number | null) => void;
  setCountsLoading: (loading: boolean) => void;
  setCountsError: (error: string | null) => void;
  updateTestRunInList: (run: TestRun) => void;
  removeTestRunFromList: (id: string) => void;
  addTestRunToList: (run: TestRun) => void;
  addTrashedTestRun: (run: TestRun) => void;
  removeTrashedTestRun: (id: string) => void;
  setTrashedTestRuns: (runs: TestRun[] | null) => void;
  emptyTrashedTestRuns: () => void;
  reset: () => void;
  moveRunToTrash: (run: TestRun) => void;
}

export const useTestRunsStore = create<TestRunsState>((set) => ({
  testRuns: null,
  trashedTestRuns: null,
  testRunsLoading: true,
  testRunsError: null,
  successfulCount: null,
  failedCount: null,
  countsLoading: false,
  countsError: null,
  setTestRuns: (incoming) =>
    set((state) => {
      if (!incoming) return { testRuns: null };

      // Combine incoming with existing, but drop items that no longer exist on the server
      // unless they are still in a transient state (running / pending / paused).
      const incomingIds = new Set(incoming.map(r => r._id));
      const combined: typeof incoming = [...incoming];
      (state.testRuns || []).forEach((r) => {
        if (!incomingIds.has(r._id)) {
          if (['running', 'pending', 'paused'].includes(r.status)) {
            combined.push(r);
          }
        }
      });

      // Deduplicate by _id (incoming takes precedence)
      const map = new Map<string, typeof combined[number]>();
      combined.forEach(run => map.set(run._id, run));

      // Sort by creation time inferred from Mongo ObjectId (newest first)
      const getTs = (id: string) => {
        // Each ObjectId's first 8 chars are a hex timestamp
        const ts = parseInt(id.substring(0, 8), 16);
        return isNaN(ts) ? 0 : ts;
      };

      const merged = Array.from(map.values()).sort(
        (a, b) => getTs(b._id) - getTs(a._id)
      );

      return { testRuns: merged };
    }),
  setTestRunsLoading: (testRunsLoading) => set({ testRunsLoading }),
  setTestRunsError: (testRunsError) => set({ testRunsError }),
  setSuccessfulCount: (successfulCount) => set({ successfulCount }),
  setFailedCount: (failedCount) => set({ failedCount }),
  setCountsLoading: (countsLoading) => set({ countsLoading }),
  setCountsError: (countsError) => set({ countsError }),
  updateTestRunInList: (run) =>
    set((state) => ({
      testRuns: state.testRuns
        ? state.testRuns.map((r) => (r._id === run._id ? run : r))
        : [run],
    })),
  removeTestRunFromList: (id) =>
    set((state) => ({
      testRuns: state.testRuns ? state.testRuns.filter((r) => r._id !== id) : null,
    })),
  addTestRunToList: (run) =>
    set((state) => {
      const exists = state.testRuns?.some(r => r._id === run._id);
      if (exists) {
        return {
          testRuns: state.testRuns?.map(r => (r._id === run._id ? run : r)) || [run],
        };
      }
      return {
        testRuns: state.testRuns ? [run, ...state.testRuns] : [run],
      };
    }),
  addTrashedTestRun: (run) =>
    set((state) => ({
      trashedTestRuns: state.trashedTestRuns ? [run, ...state.trashedTestRuns] : [run],
    })),
  moveRunToTrash: (run) =>
    set((state) => {
      const filteredActive = state.testRuns ? state.testRuns.filter(r => r._id !== run._id) : null;
      const newTrash = state.trashedTestRuns ? [run, ...state.trashedTestRuns] : [run];
      return { testRuns: filteredActive, trashedTestRuns: newTrash };
    }),
  removeTrashedTestRun: (id) =>
    set((state) => ({
      trashedTestRuns: state.trashedTestRuns ? state.trashedTestRuns.filter((r) => r._id !== id) : null,
    })),
  setTrashedTestRuns: (trashedTestRuns) => set({ trashedTestRuns }),
  emptyTrashedTestRuns: () => set({ trashedTestRuns: null }),
  reset: () =>
    set({
      testRuns: null,
      trashedTestRuns: null,
      testRunsLoading: true,
      testRunsError: null,
      successfulCount: null,
      failedCount: null,
      countsLoading: false,
      countsError: null,
    }),
})); 