import { useAuth } from "@/lib/auth";
import { useEffect, useState, useCallback } from "react";
import io from "socket.io-client";

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
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [projectsError, setProjectsError] = useState<string | null>(null);
  const [count, setCount] = useState(0);
  const [countLoading, setCountLoading] = useState(true);
  const [countError, setCountError] = useState<string | null>(null);
  const [trashedProjects, setTrashedProjects] = useState<Project[] | null>(null);
  const [trashedProjectsLoading, setTrashedProjectsLoading] = useState(true);
  const [trashedProjectsError, setTrashedProjectsError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    if (!token) return;
    setProjectsLoading(true);
    setProjectsError(null);
    try {
      const data = await fetcher("/projects", token);
      setProjects(Array.isArray(data) ? data.filter((p: Project) => p.trashed !== true) : data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setProjectsError(err.message);
      } else {
        setProjectsError("Failed to fetch projects");
      }
    } finally {
      setProjectsLoading(false);
    }
  }, [token]);

  const fetchTrashedProjects = useCallback(async () => {
    if (!token) return;
    setTrashedProjectsLoading(true);
    setTrashedProjectsError(null);
    try {
      const data = await fetcher("/projects/trashed", token);
      setTrashedProjects(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setTrashedProjectsError(err.message);
      } else {
        setTrashedProjectsError("Failed to fetch trashed projects");
      }
    } finally {
      setTrashedProjectsLoading(false);
    }
  }, [token]);

  const fetchCount = useCallback(async () => {
    if (!token) return;
    setCountLoading(true);
    setCountError(null);
    try {
      const data = await fetcher("/projects/count", token);
      setCount(data.count ?? 0);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setCountError(err.message);
      } else {
        setCountError("Failed to fetch project count");
      }
    } finally {
      setCountLoading(false);
    }
  }, [token]);

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
  }, [token, fetchProjects, fetchCount, fetchTrashedProjects]);

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
    return res.json();
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
    return res.json();
  };

  // Update a project
  const updateProject = async (id: string, payload: ProjectPayload) => {
    if (!token) throw new Error("Not authenticated");
    const res = await fetch(`${API_BASE}/projects/${id}`, {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to update project");
    return res.json();
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
    return res.json();
  };

  return {
    projects,
    projectsError,
    projectsLoading,
    count,
    countError,
    countLoading,
    createProject,
    updateProject,
    deleteProject,
    getProjectById,
    refetch,
    trashedProjects,
    trashedProjectsLoading,
    trashedProjectsError,
    refetchTrashed,
  };
} 