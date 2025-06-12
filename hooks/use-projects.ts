import { useAuth } from "@/lib/auth";
import { useEffect, useCallback } from "react";
import io from "socket.io-client";
import { useProjectsStore } from "@/lib/store/projects";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000";

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

type ProjectPayload = {
  name: string;
  description?: string;
  url?: string;
  authCredentials?: Record<string, string>;
  paymentCredentials?: Record<string, string>;
};

const fetcher = (url: string, token: string) =>
  fetch(`${API_BASE}${url}`, {
    credentials: "include",
    headers: { Authorization: `Bearer ${token}` },
  }).then(res => {
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
  });

export function useProjects() {
  const { token } = useAuth();
  const store = useProjectsStore();

  // Fetch all projects
  const fetchProjects = useCallback(async () => {
    if (!token) return;
    store.setProjectsLoading(true);
    store.setProjectsError(null);
    try {
      const data = await fetcher("/projects", token);
      store.setProjects(Array.isArray(data) ? data.filter((p: Project) => p.trashed !== true) : data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        store.setProjectsError(err.message);
      } else {
        store.setProjectsError("Failed to fetch projects");
      }
    } finally {
      store.setProjectsLoading(false);
    }
  }, [token, store]);

  // Fetch trashed projects
  const fetchTrashedProjects = useCallback(async () => {
    if (!token) return;
    store.setTrashedProjectsLoading(true);
    store.setTrashedProjectsError(null);
    try {
      const data = await fetcher("/projects/trashed", token);
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
  }, [token, store]);

  // Fetch project count
  const fetchCount = useCallback(async () => {
    if (!token) return;
    store.setCountLoading(true);
    store.setCountError(null);
    try {
      const data = await fetcher("/projects/count", token);
      store.setCount(data.count ?? 0);
    } catch (err: unknown) {
      if (err instanceof Error) {
        store.setCountError(err.message);
      } else {
        store.setCountError("Failed to fetch project count");
      }
    } finally {
      store.setCountLoading(false);
    }
  }, [token, store]);

  // Refetch all
  const refetch = useCallback(() => {
    fetchProjects();
    fetchCount();
    fetchTrashedProjects();
  }, [fetchProjects, fetchCount, fetchTrashedProjects]);

  const refetchTrashed = fetchTrashedProjects;

  useEffect(() => {
    if (!token) return;
    fetchProjects();
    fetchCount();
    fetchTrashedProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (!token) return;
    const socket = io(SOCKET_URL, {
      transports: ["websocket"],
      auth: { token },
    });
    const handleUpdate = () => {
      refetch();
    };
    socket.on("project:created", handleUpdate);
    socket.on("project:deleted", handleUpdate);
    socket.on("project:updated", handleUpdate);
    socket.on("project:trashed", handleUpdate);
    return () => {
      socket.off("project:created", handleUpdate);
      socket.off("project:deleted", handleUpdate);
      socket.off("project:updated", handleUpdate);
      socket.off("project:trashed", handleUpdate);
      socket.disconnect();
    };
  }, [refetch, token]);

  // Get a single project by ID
  const getProjectById = async (id: string): Promise<Project> => {
    if (!token) throw new Error("Not authenticated");
    const res = await fetch(`${API_BASE}/projects/${id}`, {
      credentials: "include",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to fetch project");
    const project = await res.json();
    store.updateProjectInList(project);
    return project;
  };

  // Create a project
  const createProject = async (payload: ProjectPayload) => {
    if (!token) throw new Error("Not authenticated");
    const res = await fetch(`${API_BASE}/projects`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to create project");
    const project = await res.json();
    store.addProjectToList(project);
    return project;
  };

  // Update a project
  const updateProject = async (id: string, payload: ProjectPayload) => {
    if (!token) throw new Error("Not authenticated");
    const res = await fetch(`${API_BASE}/projects/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to update project");
    const project = await res.json();
    store.updateProjectInList(project);
    return project;
  };

  // Delete a project
  const deleteProject = async (id: string) => {
    if (!token) throw new Error("Not authenticated");
    const res = await fetch(`${API_BASE}/projects/${id}`, {
      method: "DELETE",
      credentials: "include",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to delete project");
    store.removeProjectFromList(id);
    return res.json();
  };

  // Move a project to trash
  const moveProjectToTrash = async (id: string) => {
    if (!token) throw new Error("Not authenticated");
    const res = await fetch(`${API_BASE}/projects/${id}/trash`, {
      method: "PATCH",
      credentials: "include",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to move project to trash");
    const project = await res.json();
    store.updateProjectInList(project);
    refetch();
    return project;
  };

  // Restore a project from trash
  const restoreProjectFromTrash = async (id: string) => {
    if (!token) throw new Error("Not authenticated");
    const res = await fetch(`${API_BASE}/projects/${id}/restore`, {
      method: "PATCH",
      credentials: "include",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to restore project from trash");
    const project = await res.json();
    store.updateProjectInList(project);
    refetch();
    return project;
  };

  // Get all tests for a project
  const getProjectTests = async (projectId: string) => {
    if (!token) throw new Error("Not authenticated");
    const res = await fetch(`${API_BASE}/projects/${projectId}/tests`, {
      credentials: "include",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to fetch project tests");
    return res.json();
  };

  // Get all testruns for a project
  const getProjectTestruns = async (projectId: string) => {
    if (!token) throw new Error("Not authenticated");
    const res = await fetch(`${API_BASE}/projects/${projectId}/testruns`, {
      credentials: "include",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to fetch project testruns");
    return res.json();
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
  };
} 