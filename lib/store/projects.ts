import { create } from "zustand";
import { Project } from "@/hooks/use-projects";

interface ProjectsState {
  projects: Project[] | null;
  projectsLoading: boolean;
  projectsError: string | null;
  editingProject: Project | null;
  trashedProjects: Project[] | null;
  trashedProjectsLoading: boolean;
  trashedProjectsError: string | null;
  count: number;
  countLoading: boolean;
  countError: string | null;
  setProjects: (projects: Project[] | null) => void;
  setProjectsLoading: (loading: boolean) => void;
  setProjectsError: (error: string | null) => void;
  setEditingProject: (project: Project | null) => void;
  setTrashedProjects: (projects: Project[] | null) => void;
  setTrashedProjectsLoading: (loading: boolean) => void;
  setTrashedProjectsError: (error: string | null) => void;
  setCount: (count: number) => void;
  setCountLoading: (loading: boolean) => void;
  setCountError: (error: string | null) => void;
  updateProjectInList: (project: Project) => void;
  removeProjectFromList: (id: string) => void;
  addProjectToList: (project: Project) => void;
  reset: () => void;
}

export const useProjectsStore = create<ProjectsState>((set) => ({
  projects: null,
  projectsLoading: true,
  projectsError: null,
  editingProject: null,
  trashedProjects: null,
  trashedProjectsLoading: true,
  trashedProjectsError: null,
  count: 0,
  countLoading: true,
  countError: null,
  setProjects: (projects) =>
    set((state) => ({
      projects: projects
        ? projects.map((incoming) => {
            const existing = state.projects?.find((p) => p._id === incoming._id);
            if (!existing) return incoming;
            // Prefer decrypted credentials
            const isDecrypted = (obj?: Record<string, string>) =>
              obj && Object.values(obj).some(
                (v) => v && !/^ENC\[.*\]$/.test(v)
              );
            const incomingHasDecrypted =
              isDecrypted(incoming.authCredentials) || isDecrypted(incoming.paymentCredentials);
            const existingHasDecrypted =
              isDecrypted(existing.authCredentials) || isDecrypted(existing.paymentCredentials);
            if (existingHasDecrypted && !incomingHasDecrypted) {
              return existing; // keep decrypted
            }
            return incoming;
          })
        : null,
    })),
  setProjectsLoading: (projectsLoading) => set({ projectsLoading }),
  setProjectsError: (projectsError) => set({ projectsError }),
  setEditingProject: (editingProject) => set({ editingProject }),
  setTrashedProjects: (trashedProjects) => set({ trashedProjects }),
  setTrashedProjectsLoading: (trashedProjectsLoading) => set({ trashedProjectsLoading }),
  setTrashedProjectsError: (trashedProjectsError) => set({ trashedProjectsError }),
  setCount: (count) => set({ count }),
  setCountLoading: (countLoading) => set({ countLoading }),
  setCountError: (countError) => set({ countError }),
  updateProjectInList: (project) =>
    set((state) => ({
      projects: state.projects
        ? state.projects.map((p) => {
            if (p._id !== project._id) return p;
            // Prefer decrypted credentials
            const isDecrypted = (obj?: Record<string, string>) =>
              obj && Object.values(obj).some(
                (v) => v && !/^ENC\[.*\]$/.test(v)
              );
            const newHasDecrypted =
              isDecrypted(project.authCredentials) || isDecrypted(project.paymentCredentials);
            const oldHasDecrypted =
              isDecrypted(p.authCredentials) || isDecrypted(p.paymentCredentials);
            if (oldHasDecrypted && !newHasDecrypted) {
              return p; // keep decrypted
            }
            return project; // otherwise, update
          })
        : [project],
    })),
  removeProjectFromList: (id) =>
    set((state) => ({
      projects: state.projects ? state.projects.filter((p) => p._id !== id) : null,
    })),
  addProjectToList: (project) =>
    set((state) => ({
      projects: state.projects ? [project, ...state.projects] : [project],
    })),
  reset: () =>
    set({
      projects: null,
      projectsLoading: true,
      projectsError: null,
      editingProject: null,
      trashedProjects: null,
      trashedProjectsLoading: true,
      trashedProjectsError: null,
      count: 0,
      countLoading: true,
      countError: null,
    }),
})); 