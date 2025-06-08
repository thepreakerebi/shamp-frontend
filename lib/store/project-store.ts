import { create } from 'zustand';

export type Project = {
  _id: string;
  name: string;
  url?: string;
  description?: string;
  testRunsCount?: number;
  testsCount?: number;
  lastTestRunAt?: string | null;
  // ...other fields as needed
};

type ProjectStore = {
  projects: Project[];
  setProjects: (projects: Project[]) => void;
  addProject: (project: Project) => void;
  updateProject: (project: Project) => void;
  removeProject: (id: string) => void;
};

export const useProjectStore = create<ProjectStore>((set) => ({
  projects: [],
  setProjects: (projects) => set({ projects }),
  addProject: (project) => set((state) => ({ projects: [project, ...state.projects] })),
  updateProject: (project) =>
    set((state) => ({
      projects: state.projects.map((p) => (p._id === project._id ? project : p)),
    })),
  removeProject: (id) =>
    set((state) => ({
      projects: state.projects.filter((p) => p._id !== id),
    })),
})); 