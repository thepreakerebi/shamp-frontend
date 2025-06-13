import { create } from "zustand";
import type { Test } from "@/hooks/use-tests";

interface TestsState {
  tests: Test[] | null;
  testsLoading: boolean;
  testsError: string | null;
  filtered: boolean;
  count: number;
  countLoading: boolean;
  countError: string | null;
  setTests: (tests: Test[] | null) => void;
  setTestsLoading: (loading: boolean) => void;
  setTestsError: (error: string | null) => void;
  setCount: (count: number) => void;
  setCountLoading: (loading: boolean) => void;
  setCountError: (error: string | null) => void;
  setFiltered: (f: boolean) => void;
  updateTestInList: (test: Test) => void;
  removeTestFromList: (id: string) => void;
  addTestToList: (test: Test) => void;
  reset: () => void;
}

export const useTestsStore = create<TestsState>((set) => ({
  tests: null,
  testsLoading: true,
  testsError: null,
  filtered: false,
  count: 0,
  countLoading: true,
  countError: null,
  setTests: (tests) => set({ tests }),
  setTestsLoading: (testsLoading) => set({ testsLoading }),
  setTestsError: (testsError) => set({ testsError }),
  setCount: (count) => set({ count }),
  setCountLoading: (countLoading) => set({ countLoading }),
  setCountError: (countError) => set({ countError }),
  setFiltered: (filtered) => set({ filtered }),
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
  reset: () =>
    set({
      tests: null,
      testsLoading: true,
      testsError: null,
      filtered: false,
      count: 0,
      countLoading: true,
      countError: null,
    }),
})); 