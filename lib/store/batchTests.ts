import { create } from "zustand";
import type { BatchTest } from "@/hooks/use-batch-tests";

interface BatchTestsState {
  batchTests: BatchTest[] | null;
  batchTestsLoading: boolean;
  batchTestsError: string | null;
  setBatchTests: (tests: BatchTest[] | null) => void;
  setBatchTestsLoading: (loading: boolean) => void;
  setBatchTestsError: (error: string | null) => void;
  updateBatchTestInList: (test: BatchTest) => void;
  removeBatchTestFromList: (id: string) => void;
  addBatchTestToList: (test: BatchTest) => void;
  reset: () => void;
}

export const useBatchTestsStore = create<BatchTestsState>((set) => ({
  batchTests: null,
  batchTestsLoading: true,
  batchTestsError: null,
  setBatchTests: (batchTests) => set({ batchTests }),
  setBatchTestsLoading: (batchTestsLoading) => set({ batchTestsLoading }),
  setBatchTestsError: (batchTestsError) => set({ batchTestsError }),
  updateBatchTestInList: (test) =>
    set((state) => ({
      batchTests: state.batchTests ? state.batchTests.map((t) => (t._id === test._id ? test : t)) : [test],
    })),
  removeBatchTestFromList: (id) =>
    set((state) => ({
      batchTests: state.batchTests ? state.batchTests.filter((t) => t._id !== id) : null,
    })),
  addBatchTestToList: (test) =>
    set((state) => ({
      batchTests: state.batchTests ? [test, ...state.batchTests] : [test],
    })),
  reset: () =>
    set({
      batchTests: null,
      batchTestsLoading: true,
      batchTestsError: null,
    }),
})); 