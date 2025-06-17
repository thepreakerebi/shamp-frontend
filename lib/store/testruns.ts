import { create } from "zustand";
import type { TestRun } from "@/hooks/use-testruns";

interface TestRunsState {
  testRuns: TestRun[] | null;
  trashedTestRuns: TestRun[] | null;
  testRunsLoading: boolean;
  testRunsError: string | null;
  successfulCount: number | null;
  failedCount: number | null;
  setTestRuns: (runs: TestRun[] | null) => void;
  setTestRunsLoading: (loading: boolean) => void;
  setTestRunsError: (error: string | null) => void;
  setSuccessfulCount: (count: number | null) => void;
  setFailedCount: (count: number | null) => void;
  updateTestRunInList: (run: TestRun) => void;
  removeTestRunFromList: (id: string) => void;
  addTestRunToList: (run: TestRun) => void;
  addTrashedTestRun: (run: TestRun) => void;
  removeTrashedTestRun: (id: string) => void;
  reset: () => void;
}

export const useTestRunsStore = create<TestRunsState>((set) => ({
  testRuns: null,
  trashedTestRuns: null,
  testRunsLoading: true,
  testRunsError: null,
  successfulCount: null,
  failedCount: null,
  setTestRuns: (testRuns) => set({ testRuns }),
  setTestRunsLoading: (testRunsLoading) => set({ testRunsLoading }),
  setTestRunsError: (testRunsError) => set({ testRunsError }),
  setSuccessfulCount: (successfulCount) => set({ successfulCount }),
  setFailedCount: (failedCount) => set({ failedCount }),
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
  removeTrashedTestRun: (id) =>
    set((state) => ({
      trashedTestRuns: state.trashedTestRuns ? state.trashedTestRuns.filter((r) => r._id !== id) : null,
    })),
  reset: () =>
    set({
      testRuns: null,
      trashedTestRuns: null,
      testRunsLoading: true,
      testRunsError: null,
      successfulCount: null,
      failedCount: null,
    }),
})); 