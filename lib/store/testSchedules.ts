import { create } from "zustand";

export interface TestSchedule {
  _id: string;
  testId: string;
  testName: string;
  testDescription?: string;
  projectName?: string;
  personaName?: string;
  nextRun: string;
  recurrenceRule?: string;
  trashed?: boolean;
  workspace?: string;
  createdBy?: string;
}

interface TestSchedulesState {
  schedules: TestSchedule[] | null;
  schedulesLoading: boolean;
  schedulesError: string | null;
  trashedSchedules: TestSchedule[] | null;
  trashedSchedulesLoading: boolean;
  trashedSchedulesError: string | null;
  setSchedules: (s: TestSchedule[] | null) => void;
  setSchedulesLoading: (l: boolean) => void;
  setSchedulesError: (e: string | null) => void;
  setTrashedSchedules: (s: TestSchedule[] | null) => void;
  setTrashedSchedulesLoading: (l: boolean) => void;
  setTrashedSchedulesError: (e: string | null) => void;
  updateScheduleInList: (s: TestSchedule) => void;
  removeScheduleFromList: (id: string) => void;
  addTrashedSchedule: (s: TestSchedule) => void;
  removeTrashedSchedule: (id: string) => void;
  addScheduleToList: (s: TestSchedule) => void;
  emptyTrashedSchedules: () => void;
  reset: () => void;
}

export const useTestSchedulesStore = create<TestSchedulesState>((set) => ({
  schedules: null,
  schedulesLoading: true,
  schedulesError: null,
  trashedSchedules: null,
  trashedSchedulesLoading: true,
  trashedSchedulesError: null,
  setSchedules: (schedules) => set({ schedules }),
  setSchedulesLoading: (schedulesLoading) => set({ schedulesLoading }),
  setSchedulesError: (schedulesError) => set({ schedulesError }),
  setTrashedSchedules: (trashedSchedules) => set({ trashedSchedules }),
  setTrashedSchedulesLoading: (trashedSchedulesLoading) => set({ trashedSchedulesLoading }),
  setTrashedSchedulesError: (trashedSchedulesError) => set({ trashedSchedulesError }),
  updateScheduleInList: (schedule) =>
    set((state) => {
      if (!state.schedules) {
        return { schedules: [schedule] };
      }
      const exists = state.schedules.some((s) => s._id === schedule._id);
      return {
        schedules: exists
          ? state.schedules.map((s) => (s._id === schedule._id ? schedule : s))
          : [schedule, ...state.schedules],
      };
    }),
  removeScheduleFromList: (id) =>
    set((state) => ({
      schedules: state.schedules ? state.schedules.filter((s) => s._id !== id) : null,
    })),
  addTrashedSchedule: (schedule) =>
    set((state) => ({
      trashedSchedules: state.trashedSchedules ? [schedule, ...state.trashedSchedules] : [schedule],
    })),
  removeTrashedSchedule: (id) =>
    set((state) => ({
      trashedSchedules: state.trashedSchedules ? state.trashedSchedules.filter((s) => s._id !== id) : null,
    })),
  addScheduleToList: (schedule) =>
    set((state) => {
      if (!state.schedules) return { schedules: [schedule] };
      const exists = state.schedules.some(s=>s._id===schedule._id);
      return {
        schedules: exists ? state.schedules.map(s=> s._id===schedule._id ? schedule : s) : [schedule, ...state.schedules]
      };
    }),
  emptyTrashedSchedules: () => set({ trashedSchedules: null }),
  reset: () => set({
    schedules: null,
    schedulesLoading: true,
    schedulesError: null,
    trashedSchedules: null,
    trashedSchedulesLoading: true,
    trashedSchedulesError: null,
  }),
})); 