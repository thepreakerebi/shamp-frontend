import { create } from "zustand";
import type { Test } from "@/hooks/use-tests";
import type { TestRun } from "@/hooks/use-testruns";

interface TestsState {
  tests: Test[] | null;
  testsLoading: boolean;
  testsError: string | null;
  count: number;
  countLoading: boolean;
  countError: string | null;
  testRunsByTestId: Record<string, TestRun[]>;
  setTestRunsForTest: (testId: string, runs: TestRun[]) => void;
  getTestRunsForTest: (testId: string) => TestRun[] | undefined;
  setTests: (tests: Test[] | null) => void;
  setTestsLoading: (loading: boolean) => void;
  setTestsError: (error: string | null) => void;
  setCount: (count: number) => void;
  setCountLoading: (loading: boolean) => void;
  setCountError: (error: string | null) => void;
  updateTestInList: (test: Test) => void;
  removeTestFromList: (id: string) => void;
  addTestToList: (test: Test) => void;
  trashedTests: Test[] | null;
  addTrashedTest: (test: Test) => void;
  removeTrashedTest: (id: string) => void;
  reset: () => void;
  removeTestRunFromList: (id: string, testId?: string) => void;
}

export const useTestsStore = create<TestsState>((set, get) => ({
  tests: null,
  trashedTests: null,
  testsLoading: true,
  testsError: null,
  count: 0,
  countLoading: true,
  countError: null,
  testRunsByTestId: {},
  setTestRunsForTest: (testId, runs) =>
    set((state) => ({
      testRunsByTestId: { ...state.testRunsByTestId, [testId]: runs },
    })),
  getTestRunsForTest: (testId) => {
    const state = get();
    return state.testRunsByTestId[testId];
  },
  setTests: (tests) => set({ tests }),
  setTestsLoading: (testsLoading) => set({ testsLoading }),
  setTestsError: (testsError) => set({ testsError }),
  setCount: (count) => set({ count }),
  setCountLoading: (countLoading) => set({ countLoading }),
  setCountError: (countError) => set({ countError }),
  updateTestInList: (test) =>
    set((state) => ({
      tests: state.tests ? state.tests.map((t) => (t._id === test._id ? test : t)) : [test],
    })),
  removeTestFromList: (id) =>
    set((state) => ({
      tests: state.tests ? state.tests.filter((t) => t._id !== id) : null,
    })),
  addTestToList: (test) =>
    set((state) => ({
      tests: state.tests ? [test, ...state.tests] : [test],
    })),
  addTrashedTest: (test) =>
    set((state) => ({
      trashedTests: state.trashedTests ? [test, ...state.trashedTests] : [test],
    })),
  removeTrashedTest: (id) =>
    set((state) => ({
      trashedTests: state.trashedTests ? state.trashedTests.filter((t) => t._id !== id) : null,
    })),
  reset: () =>
    set({
      tests: null,
      trashedTests: null,
      testsLoading: true,
      testsError: null,
      count: 0,
      countLoading: true,
      countError: null,
      testRunsByTestId: {},
    }),
  removeTestRunFromList: (id: string, testId?: string) => set((state) => {
    const tr = state.testRunsByTestId;
    if (testId && tr[testId]) {
      tr[testId] = tr[testId].filter(r => r._id !== id);
    } else {
      Object.keys(tr).forEach(key => {
        tr[key] = tr[key].filter(r => r._id !== id);
      });
    }
    return { testRunsByTestId: { ...tr } };
  }),
})); 