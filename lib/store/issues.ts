import { create } from "zustand";

export interface Issue {
  _id: string;
  testRunId: string;
  testName: string;
  personaName: string;
  personaAvatarUrl?: string;
  uiIssues: string[];
  accessibilityIssues: string[];
  copyIssues: string[];
  interactionIssues: string[];
  contextConfusion: string[];
  resolved: boolean;
  createdAt: string;
  workspace?: string;
}

interface IssuesState {
  issues: Issue[] | null;
  issuesLoading: boolean;
  issuesError: string | null;
  setIssues: (issues: Issue[] | null) => void;
  setIssuesLoading: (loading: boolean) => void;
  setIssuesError: (error: string | null) => void;
  addIssue: (issue: Issue) => void;
  updateIssue: (issue: Issue) => void;
  deleteIssue: (id: string) => void;
  reset: () => void;
}

export const useIssuesStore = create<IssuesState>((set) => ({
  issues: null,
  issuesLoading: true,
  issuesError: null,
  setIssues: (issues) => set({ issues }),
  setIssuesLoading: (issuesLoading) => set({ issuesLoading }),
  setIssuesError: (issuesError) => set({ issuesError }),
  addIssue: (issue) =>
    set((state) => {
      const exists = state.issues?.some((i) => i._id === issue._id);
      if (exists) {
        return {
          issues: (state.issues ?? []).map((i) => (i._id === issue._id ? { ...i, ...issue } : i)),
        };
      }
      return { issues: [issue, ...(state.issues ?? [])] };
    }),
  updateIssue: (issue) =>
    set((state) => ({
      issues: state.issues ? state.issues.map((i) => (i._id === issue._id ? issue : i)) : null,
    })),
  deleteIssue: (id) =>
    set((state) => ({ issues: state.issues ? state.issues.filter((i) => i._id !== id) : null })),
  reset: () => set({ issues: null, issuesLoading: true, issuesError: null }),
})); 