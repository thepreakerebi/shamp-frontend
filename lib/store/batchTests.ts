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
}

export const useBatchTestsStore = create<BatchTestsState>((set) => ({
  batchTests: null,
  trashedBatchTests: null,
  batchTestsLoading: true,
  batchTestsError: null,
  setBatchTests: (batchTests) => set({ batchTests }),
  setTrashedBatchTests: (trashedBatchTests) => set({ trashedBatchTests }),
  setBatchTestsLoading: (batchTestsLoading) => set({ batchTestsLoading }),
  setBatchTestsError: (batchTestsError) => set({ batchTestsError }),
  updateBatchTestInList: (test) =>
    set((state) => {
      const isTrashed = !!test.trashed;
      const inActive = state.batchTests?.some(t => t._id === test._id);
      const inTrash = state.trashedBatchTests?.some(t => t._id === test._id);

      let batchTests = state.batchTests ?? [];
      let trashedBatchTests = state.trashedBatchTests ?? [];

      if (isTrashed) {
        // Remove from active
        batchTests = batchTests.filter(t => t._id !== test._id);
        // Add/replace in trash
        trashedBatchTests = inTrash ? trashedBatchTests.map(t=> t._id===test._id?test:t) : [test, ...trashedBatchTests];
      } else {
        trashedBatchTests = trashedBatchTests.filter(t => t._id !== test._id);
        batchTests = inActive ? batchTests.map(t=> t._id===test._id?test:t) : [test, ...batchTests];
      }

      return { batchTests, trashedBatchTests };
    }),
  removeBatchTestFromList: (id) =>
    set((state) => ({
      batchTests: state.batchTests ? state.batchTests.filter((t) => t._id !== id) : null,
      trashedBatchTests: state.trashedBatchTests ? state.trashedBatchTests.filter((t) => t._id !== id) : null,
    })),
  addBatchTestToList: (test) =>
    set((state) => ({
      batchTests: test.trashed ? state.batchTests : (state.batchTests ? [test, ...state.batchTests] : [test]),
      trashedBatchTests: test.trashed ? (state.trashedBatchTests ? [test, ...state.trashedBatchTests] : [test]) : state.trashedBatchTests,
    })),
  reset: () =>
    set({
      batchTests: null,
      trashedBatchTests: null,
      batchTestsLoading: true,
      batchTestsError: null,
    }),
})); 