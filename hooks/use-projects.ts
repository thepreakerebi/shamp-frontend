import { useAuth } from "@/lib/auth";
import { useEffect, useCallback, useRef } from "react";
import io from "socket.io-client";
import { useProjectsStore } from "@/lib/store/projects";
import { useTestRunsStore } from "@/lib/store/testruns";
import { apiFetch } from '@/lib/api-client';
import type { TestRun } from "@/hooks/use-testruns";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL as string;

export interface Project {
  _id: string;
  name: string;
  description?: string;
  url?: string;
  authCredentials?: Record<string, string>;
  paymentCredentials?: Record<string, string>;
  testRunsCount?: number;
  testsCount?: number;
  lastTestRunAt?: string | null;
  previewImageUrl?: string;
  trashed?: boolean;
  createdBy?: {
    _id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  // Add other fields as needed
}

export interface ProjectPayload {
  name: string;
  description?: string;
  url?: string;
  authCredentials?: Record<string, string>;
  paymentCredentials?: Record<string, string>;
}

export function useProjects() {
  const { token, currentWorkspaceId } = useAuth();
  const store = useProjectsStore();
  const previousWorkspaceId = useRef<string | null>(null);

  // Fetch projects
  const fetchProjects = useCallback(async () => {
    if (!currentWorkspaceId) return;
    store.setProjectsLoading(true);
    store.setProjectsError(null);
    try {
      const res = await apiFetch('/projects', { token, workspaceId: currentWorkspaceId });
      const data = await res.json();
      store.setProjects(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      if (err instanceof Error) {
        store.setProjectsError(err.message);
      } else {
        store.setProjectsError("Failed to fetch projects");
      }
    } finally {
      store.setProjectsLoading(false);
    }
  }, [token, currentWorkspaceId, store]);

  // Fetch count
  const fetchCount = useCallback(async () => {
    if (!currentWorkspaceId) return;
    store.setCountLoading(true);
    store.setCountError(null);
    try {
      const res = await apiFetch('/projects/count', { token, workspaceId: currentWorkspaceId });
      const data = await res.json();
      store.setCount(typeof data.count === "number" ? data.count : 0);
    } catch (err: unknown) {
      if (err instanceof Error) {
        store.setCountError(err.message);
      } else {
        store.setCountError("Failed to fetch count");
      }
    } finally {
      store.setCountLoading(false);
    }
  }, [token, currentWorkspaceId, store]);

  // Fetch trashed projects
  const fetchTrashedProjects = useCallback(async () => {
    if (!currentWorkspaceId) return;
    store.setTrashedProjectsLoading(true);
    store.setTrashedProjectsError(null);
    try {
      const res = await apiFetch('/projects/trashed', { token, workspaceId: currentWorkspaceId });
      const data = await res.json();
      store.setTrashedProjects(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      if (err instanceof Error) {
        store.setTrashedProjectsError(err.message);
      } else {
        store.setTrashedProjectsError("Failed to fetch trashed projects");
      }
    } finally {
      store.setTrashedProjectsLoading(false);
    }
  }, [token, currentWorkspaceId, store]);

  // Refetch all
  const refetch = useCallback(() => {
    fetchProjects();
    fetchCount();
    fetchTrashedProjects();
  }, [fetchProjects, fetchCount, fetchTrashedProjects]);

  const refetchTrashed = fetchTrashedProjects;

  useEffect(() => {
    if (!currentWorkspaceId) return;
    
    // Check if workspace has changed
    if (previousWorkspaceId.current && previousWorkspaceId.current !== currentWorkspaceId) {
      // Clear store data when workspace changes
      store.setProjects(null);
      store.setTrashedProjects(null);
      store.setCount(0);
      store.setCountLoading(true);
      store.setProjectsLoading(true);
      store.setTrashedProjectsLoading(true);
    }
    
    // Update the ref to current workspace
    previousWorkspaceId.current = currentWorkspaceId;
    
    fetchProjects();
    fetchCount();
    fetchTrashedProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWorkspaceId]);

  useEffect(() => {
    if (!token || !currentWorkspaceId) return;
    const socket = io(SOCKET_URL, {
      transports: ["websocket"],
      auth: { token, workspaceId: currentWorkspaceId },
    });
    socket.on("project:created", (data: Project & { workspace?: string }) => {
      // Only process events for the current workspace
      if (data.workspace === currentWorkspaceId) {
        store.addProjectToList(data);
        // Calculate count based on actual projects in store
        const { projects } = useProjectsStore.getState();
        const newCount = Array.isArray(projects) ? projects.length : 0;
        store.setCount(newCount);
      }
    });
    socket.on("project:deleted", (data: { _id: string; workspace?: string }) => {
      // Only process events for the current workspace
      if (data.workspace === currentWorkspaceId) {
        store.removeProjectFromList(data._id);
        store.removeTrashedProject(data._id);
        // Calculate count based on actual projects in store
        const { projects } = useProjectsStore.getState();
        const newCount = Array.isArray(projects) ? projects.length : 0;
        store.setCount(newCount);
      }
    });
    socket.on("project:trashed", (data: Project & { workspace?: string }) => {
      // Only process events for the current workspace
      if (data.workspace === currentWorkspaceId) {
        store.removeProjectFromList(data._id);
        store.addTrashedProject({ ...data, trashed: true });
        // Calculate count based on actual projects in store after removal
        const { projects } = useProjectsStore.getState();
        const newCount = Array.isArray(projects) ? projects.length : 0;
        store.setCount(newCount);
      }
    });
    socket.on("project:updated", (data: Project & { workspace?: string }) => {
      // Only process events for the current workspace
      if (data.workspace === currentWorkspaceId) {
        if (data.trashed) {
          store.removeProjectFromList(data._id);
          store.addTrashedProject({ ...data, trashed: true });
          // Calculate count based on actual projects in store after removal
          const { projects } = useProjectsStore.getState();
          const newCount = Array.isArray(projects) ? projects.length : 0;
          store.setCount(newCount);
        } else {
          store.removeTrashedProject(data._id);
          store.updateProjectInList(data);
          // Calculate count based on actual projects in store after addition
          const { projects } = useProjectsStore.getState();
          const newCount = Array.isArray(projects) ? projects.length : 0;
          store.setCount(newCount);
        }
      }
    });
    socket.on("project:trashEmptied", (data: { deletedCount: number; workspace?: string }) => {
      // Only process events for the current workspace
      if (data.workspace === currentWorkspaceId) {
        // Clear all trashed projects since they were permanently deleted
        store.setTrashedProjects([]);
        // Count should not be affected since trashed projects don't count towards active count
      }
    });
    return () => {
      socket.disconnect();
    };
  }, [token, currentWorkspaceId]);

  // Get a single project by ID
  const getProjectById = async (id: string): Promise<Project> => {
    if (!currentWorkspaceId) throw new Error("No workspace context");
    const res = await apiFetch(`/projects/${id}`, { token, workspaceId: currentWorkspaceId });
    if (!res.ok) throw new Error("Failed to fetch project");
    const project = await res.json();
    store.updateProjectInList(project);
    return project;
  };

  // Create a project
  const createProject = async (payload: ProjectPayload) => {
    if (!currentWorkspaceId) throw new Error("No workspace context");
    const res = await apiFetch('/projects', { token, workspaceId: currentWorkspaceId, init: { method: 'POST', body: JSON.stringify(payload) } });
    if (!res.ok) throw new Error("Failed to create project");
    const project = await res.json();
    // Don't manually update store - let Socket.IO events handle it
    return project;
  };

  // Update a project
  const updateProject = async (id: string, payload: Partial<ProjectPayload>) => {
    if (!currentWorkspaceId) throw new Error("No workspace context");
    const res = await apiFetch(`/projects/${id}`, { token, workspaceId: currentWorkspaceId, init: { method: 'PATCH', body: JSON.stringify(payload) } });
    if (!res.ok) throw new Error("Failed to update project");
    const project = await res.json();
    // Optimistically update store for immediate UI feedback; socket will reconcile if needed
    store.updateProjectInList(project);
    return project;
  };

  // Delete a project
  const deleteProject = async (id: string, deleteTests = false) => {
    if (!currentWorkspaceId) throw new Error("No workspace context");
    const path = `/projects/${id}${deleteTests ? `?deleteTests=true` : ''}`;
    const res = await apiFetch(path, { token, workspaceId: currentWorkspaceId, init: { method: 'DELETE' } });
    if (!res.ok) throw new Error("Failed to delete project");
    return res.json();
  };

  // Move project to trash
  const moveProjectToTrash = async (id: string) => {
    if (!currentWorkspaceId) throw new Error("No workspace context");
    const res = await apiFetch(`/projects/${id}/trash`, { token, workspaceId: currentWorkspaceId, init: { method: 'PATCH' } });
    if (!res.ok) throw new Error("Failed to move project to trash");
    const project = await res.json();
    // Don't manually update store - let Socket.IO events handle it
    return project;
  };

  // Restore project from trash
  const restoreProjectFromTrash = async (id: string) => {
    if (!currentWorkspaceId) throw new Error("No workspace context");
    const res = await apiFetch(`/projects/${id}/restore`, { token, workspaceId: currentWorkspaceId, init: { method: 'PATCH' } });
    if (!res.ok) throw new Error("Failed to restore project from trash");
    const project = await res.json();
    // Don't manually update store - let Socket.IO events handle it
    return project;
  };

  // Get all tests for a project
  const getProjectTests = async (projectId: string) => {
    if (!currentWorkspaceId) throw new Error("No workspace context");
    const res = await apiFetch(`/projects/${projectId}/tests`, { token, workspaceId: currentWorkspaceId });
    if (!res.ok) throw new Error("Failed to fetch project tests");
    return res.json();
  };

  // Get all testruns for a project (with caching)
  const getProjectTestruns = async (
    projectId: string,
    forceRefresh = false
  ): Promise<TestRun[]> => {
    if (!currentWorkspaceId) throw new Error("No workspace context");

    const { getTestRunsForProject, setTestRunsForProject } = useProjectsStore.getState();
    const cached = getTestRunsForProject(projectId);
    if (cached && !forceRefresh) {
      return cached as unknown as TestRun[];
    }

    const res = await apiFetch(`/projects/${projectId}/testruns`, { token, workspaceId: currentWorkspaceId });
    if (!res.ok) throw new Error("Failed to fetch project testruns");
    const runs = (await res.json()) as TestRun[];

    // Sort newest-first using ObjectId timestamp
    const getTs = (id: string) => parseInt(id.substring(0, 8), 16) * 1000;
    const sorted = [...runs].sort((a, b) => getTs(b._id) - getTs(a._id));

    setTestRunsForProject(projectId, sorted);

    // Merge into global TestRuns store so other views benefit, without wiping existing list
    const { addTestRunToList } = useTestRunsStore.getState();
    sorted.forEach(run => addTestRunToList(run));

    return sorted;
  };

  // Empty trash - permanently delete all trashed projects
  const emptyProjectTrash = async (deleteTests?: boolean) => {
    if (!currentWorkspaceId) throw new Error("No workspace context");
    const qs = deleteTests ? '?deleteTests=true' : '';
    const res = await apiFetch(`/projects/trash/empty${qs}`, { token, workspaceId: currentWorkspaceId, init: { method: 'DELETE' } });
    if (!res.ok) throw new Error("Failed to empty project trash");
    const result = await res.json();
    store.emptyTrashedProjects();
    return result;
  };

  return {
    projects: store.projects,
    projectsError: store.projectsError,
    projectsLoading: store.projectsLoading,
    count: store.count,
    countError: store.countError,
    countLoading: store.countLoading,
    createProject,
    updateProject,
    deleteProject,
    getProjectById,
    refetch,
    trashedProjects: store.trashedProjects,
    trashedProjectsLoading: store.trashedProjectsLoading,
    trashedProjectsError: store.trashedProjectsError,
    refetchTrashed,
    moveProjectToTrash,
    restoreProjectFromTrash,
    getProjectTests,
    getProjectTestruns,
    emptyProjectTrash,
    hasWorkspaceContext: !!currentWorkspaceId,
  };
} 