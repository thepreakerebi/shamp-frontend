import { useAuth } from "@/lib/auth";
import { useEffect, useCallback, useRef } from "react";
import io from "socket.io-client";
import { useProjectsStore } from "@/lib/store/projects";
import { useTestRunsStore } from "@/lib/store/testruns";
import type { TestRun } from "@/hooks/use-testruns";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;
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
  // Add other fields as needed
}

export interface ProjectPayload {
  name: string;
  description?: string;
  url?: string;
  authCredentials?: Record<string, string>;
  paymentCredentials?: Record<string, string>;
}

const fetcher = (url: string, token: string, workspaceId?: string | null) =>
  fetch(`${API_BASE}${url}`, {
    credentials: "include",
    headers: { 
      Authorization: `Bearer ${token}`,
      ...(workspaceId ? { 'X-Workspace-ID': workspaceId } : {})
    },
  }).then(res => {
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
  });

export function useProjects() {
  const { token, currentWorkspaceId } = useAuth();
  const store = useProjectsStore();
  const previousWorkspaceId = useRef<string | null>(null);

  // Fetch projects
  const fetchProjects = useCallback(async () => {
    if (!token || !currentWorkspaceId) return;
    store.setProjectsLoading(true);
    store.setProjectsError(null);
    try {
      const data = await fetcher("/projects", token, currentWorkspaceId);
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
    if (!token || !currentWorkspaceId) return;
    store.setCountLoading(true);
    store.setCountError(null);
    try {
      const data = await fetcher("/projects/count", token, currentWorkspaceId);
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
    if (!token || !currentWorkspaceId) return;
    store.setTrashedProjectsLoading(true);
    store.setTrashedProjectsError(null);
    try {
      const data = await fetcher("/projects/trashed", token, currentWorkspaceId);
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
    if (!token || !currentWorkspaceId) return;
    
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
  }, [token, currentWorkspaceId]);

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
        // Update count when a project is created
        const currentCount = useProjectsStore.getState().count;
        store.setCount(currentCount + 1);
      }
    });
    socket.on("project:deleted", (data: { _id: string; workspace?: string }) => {
      // Only process events for the current workspace
      if (data.workspace === currentWorkspaceId) {
        store.removeProjectFromList(data._id);
        store.removeTrashedProject(data._id);
        // Update count when a project is permanently deleted
        const currentCount = useProjectsStore.getState().count;
        store.setCount(Math.max(0, currentCount - 1));
      }
    });
    socket.on("project:trashed", (data: Project & { workspace?: string }) => {
      // Only process events for the current workspace
      if (data.workspace === currentWorkspaceId) {
        store.removeProjectFromList(data._id);
        store.addTrashedProject({ ...data, trashed: true });
        // Update count when a project is moved to trash
        const currentCount = useProjectsStore.getState().count;
        store.setCount(Math.max(0, currentCount - 1));
      }
    });
    socket.on("project:updated", (data: Project & { workspace?: string }) => {
      // Only process events for the current workspace
      if (data.workspace === currentWorkspaceId) {
        if (data.trashed) {
          store.removeProjectFromList(data._id);
          store.addTrashedProject({ ...data, trashed: true });
          // Update count when a project is moved to trash
          const currentCount = useProjectsStore.getState().count;
          store.setCount(Math.max(0, currentCount - 1));
        } else {
          store.removeTrashedProject(data._id);
          store.updateProjectInList(data);
          // Update count when a project is restored from trash
          const currentCount = useProjectsStore.getState().count;
          store.setCount(currentCount + 1);
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
    if (!token || !currentWorkspaceId) throw new Error("Not authenticated or no workspace context");
    const res = await fetch(`${API_BASE}/projects/${id}`, {
      credentials: "include",
      headers: { 
        Authorization: `Bearer ${token}`,
        'X-Workspace-ID': currentWorkspaceId
      },
    });
    if (!res.ok) throw new Error("Failed to fetch project");
    const project = await res.json();
    store.updateProjectInList(project);
    return project;
  };

  // Create a project
  const createProject = async (payload: ProjectPayload) => {
    if (!token || !currentWorkspaceId) throw new Error("Not authenticated or no workspace context");
    const res = await fetch(`${API_BASE}/projects`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        'X-Workspace-ID': currentWorkspaceId
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to create project");
    const project = await res.json();
    store.addProjectToList(project);
    return project;
  };

  // Update a project
  const updateProject = async (id: string, payload: Partial<ProjectPayload>) => {
    if (!token || !currentWorkspaceId) throw new Error("Not authenticated or no workspace context");
    const res = await fetch(`${API_BASE}/projects/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        'X-Workspace-ID': currentWorkspaceId
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to update project");
    const project = await res.json();
    store.updateProjectInList(project);
    return project;
  };

  // Delete a project
  const deleteProject = async (id: string, deleteTests = false) => {
    if (!token || !currentWorkspaceId) throw new Error("Not authenticated or no workspace context");
    const url = `${API_BASE}/projects/${id}${deleteTests ? `?deleteTests=true` : ''}`;
    const res = await fetch(url, {
      method: "DELETE",
      credentials: "include",
      headers: { 
        Authorization: `Bearer ${token}`,
        'X-Workspace-ID': currentWorkspaceId
      },
    });
    if (!res.ok) throw new Error("Failed to delete project");
    store.removeProjectFromList(id);
    store.removeTrashedProject(id);
    return res.json();
  };

  // Move project to trash
  const moveProjectToTrash = async (id: string) => {
    if (!token || !currentWorkspaceId) throw new Error("Not authenticated or no workspace context");
    const res = await fetch(`${API_BASE}/projects/${id}/trash`, {
      method: "PATCH",
      credentials: "include",
      headers: { 
        Authorization: `Bearer ${token}`,
        'X-Workspace-ID': currentWorkspaceId
      },
    });
    if (!res.ok) throw new Error("Failed to move project to trash");
    const project = await res.json();
    store.removeProjectFromList(id);
    store.addTrashedProject({ ...project, trashed: true });
    return project;
  };

  // Restore project from trash
  const restoreProjectFromTrash = async (id: string) => {
    if (!token || !currentWorkspaceId) throw new Error("Not authenticated or no workspace context");
    const res = await fetch(`${API_BASE}/projects/${id}/restore`, {
      method: "PATCH",
      credentials: "include",
      headers: { 
        Authorization: `Bearer ${token}`,
        'X-Workspace-ID': currentWorkspaceId
      },
    });
    if (!res.ok) throw new Error("Failed to restore project from trash");
    const project = await res.json();
    store.removeTrashedProject(id);
    store.addProjectToList({ ...project, trashed: false });
    return project;
  };

  // Get all tests for a project
  const getProjectTests = async (projectId: string) => {
    if (!token || !currentWorkspaceId) throw new Error("Not authenticated or no workspace context");
    const res = await fetch(`${API_BASE}/projects/${projectId}/tests`, {
      credentials: "include",
      headers: { 
        Authorization: `Bearer ${token}`,
        'X-Workspace-ID': currentWorkspaceId
      },
    });
    if (!res.ok) throw new Error("Failed to fetch project tests");
    return res.json();
  };

  // Get all testruns for a project (with caching)
  const getProjectTestruns = async (
    projectId: string,
    forceRefresh = false
  ): Promise<TestRun[]> => {
    if (!token || !currentWorkspaceId) throw new Error("Not authenticated or no workspace context");

    const { getTestRunsForProject, setTestRunsForProject } = useProjectsStore.getState();
    const cached = getTestRunsForProject(projectId);
    if (cached && !forceRefresh) {
      return cached as unknown as TestRun[];
    }

    const res = await fetch(`${API_BASE}/projects/${projectId}/testruns`, {
      credentials: "include",
      headers: { 
        Authorization: `Bearer ${token}`,
        'X-Workspace-ID': currentWorkspaceId
      },
    });
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
    if (!token || !currentWorkspaceId) throw new Error("Not authenticated or no workspace context");
    const url = new URL(`${API_BASE}/projects/trash/empty`);
    if (deleteTests) {
      url.searchParams.set('deleteTests', 'true');
    }
    const res = await fetch(url.toString(), {
      method: "DELETE",
      credentials: "include",
      headers: { 
        Authorization: `Bearer ${token}`,
        'X-Workspace-ID': currentWorkspaceId
      },
    });
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