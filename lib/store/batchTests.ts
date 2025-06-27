import { create } from "zustand";
import type { BatchTest } from "@/hooks/use-batch-tests";

interface BatchTestsState {
  batchTests: BatchTest[] | null;
  trashedBatchTests: BatchTest[] | null;
  batchTestsLoading: boolean;
  batchTestsError: string | null;
  setBatchTests: (tests: BatchTest[] | null) => void;
  setTrashedBatchTests: (tests: BatchTest[] | null) => void;
  setBatchTestsLoading: (loading: boolean) => void;
  setBatchTestsError: (error: string | null) => void;
  updateBatchTestInList: (test: BatchTest) => void;
  removeBatchTestFromList: (id: string) => void;
  addBatchTestToList: (test: BatchTest) => void;
  reset: () => void;
  batchTestRuns: Record<string, import("@/hooks/use-testruns").TestRun[]>;
  getTestRunsForBatchTest: (batchId: string) => import("@/hooks/use-testruns").TestRun[] | undefined;
  setTestRunsForBatchTest: (batchId: string, runs: import("@/hooks/use-testruns").TestRun[]) => void;
}

export const useBatchTestsStore = create<BatchTestsState>((set, get) => ({
  batchTests: null,
  trashedBatchTests: null,
  batchTestsLoading: true,
  batchTestsError: null,
  batchTestRuns: {},
  setBatchTests: (batchTests) => set({ batchTests }),
  setTrashedBatchTests: (trashedBatchTests) => set({ trashedBatchTests }),
  setBatchTestsLoading: (batchTestsLoading) => set({ batchTestsLoading }),
  setBatchTestsError: (batchTestsError) => set({ batchTestsError }),
  updateBatchTestInList: (incoming) =>
    set((state) => {
      const isTrashed = !!incoming.trashed;

      // Helper to merge with existing version (preserve stats that might be omitted by backend)
      const merge = (prev: BatchTest | undefined, next: BatchTest): BatchTest => {
        if (!prev) return next;
        const merged: BatchTest = { ...prev, ...next }; // start with existing, then apply newer fields

        // Prefer richer "test" object if incoming only has id string
        if (typeof next.test === "string" && typeof prev.test === "object") {
          merged.test = prev.test;
        }

        // Preserve run statistics when backend omits them (undefined)
        if (next.testrunsCount === undefined && prev.testrunsCount !== undefined) {
          merged.testrunsCount = prev.testrunsCount;
        }
        if (next.successfulRuns === undefined && prev.successfulRuns !== undefined) {
          merged.successfulRuns = prev.successfulRuns;
        }
        if (next.failedRuns === undefined && prev.failedRuns !== undefined) {
          merged.failedRuns = prev.failedRuns;
        }

        // Same for testruns array
        if ((next.testruns === undefined || (Array.isArray(next.testruns) && next.testruns.length === 0)) && prev.testruns?.length) {
          merged.testruns = prev.testruns;
        }

        return merged;
      };

      let batchTests = state.batchTests ?? [];
      let trashedBatchTests = state.trashedBatchTests ?? [];

      if (isTrashed) {
        // Remove from active list, but keep reference for merging purposes
        const prevActive = batchTests.find(t => t._id === incoming._id);
        batchTests = batchTests.filter(t => t._id !== incoming._id);

        const merged = merge(prevActive, incoming);

        // If already in trash, replace, else prepend
        const inTrash = trashedBatchTests.some(t => t._id === merged._id);
        trashedBatchTests = inTrash ? trashedBatchTests.map(t => t._id === merged._id ? merged : t) : [merged, ...trashedBatchTests];
      } else {
        // Remove from trash list similarly
        const prevTrash = trashedBatchTests.find(t => t._id === incoming._id);
        trashedBatchTests = trashedBatchTests.filter(t => t._id !== incoming._id);

        const merged = merge(prevTrash, incoming);

        const inActive = batchTests.some(t => t._id === merged._id);
        batchTests = inActive ? batchTests.map(t => t._id === merged._id ? merged : t) : [merged, ...batchTests];
      }

      return { batchTests, trashedBatchTests };
    }),
  removeBatchTestFromList: (id) =>
    set((state) => ({
      batchTests: state.batchTests ? state.batchTests.filter((t) => t._id !== id) : null,
      trashedBatchTests: state.trashedBatchTests ? state.trashedBatchTests.filter((t) => t._id !== id) : null,
    })),
  addBatchTestToList: (test) =>
    set((state) => {
      const removeDup = (arr: BatchTest[] | null) => arr ? arr.filter(t=>t._id !== test._id) : [];
      const activeList = removeDup(state.batchTests);
      const trashList = removeDup(state.trashedBatchTests);

      return {
        batchTests: test.trashed
          ? activeList
          : [test, ...(activeList ?? [])],
        trashedBatchTests: test.trashed
          ? [test, ...(trashList ?? [])]
          : trashList,
      };
    }),
  reset: () =>
    set({
      batchTests: null,
      trashedBatchTests: null,
      batchTestsLoading: true,
      batchTestsError: null,
      batchTestRuns: {},
    }),
  getTestRunsForBatchTest: (batchId: string) => get().batchTestRuns[batchId],
  setTestRunsForBatchTest: (batchId: string, runs: import("@/hooks/use-testruns").TestRun[]) =>
    set((state) => ({ batchTestRuns: { ...state.batchTestRuns, [batchId]: runs } })),
})); 