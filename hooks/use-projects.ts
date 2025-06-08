import { useAuth } from "@/lib/auth";
import { useBackendPolling } from "./use-backend-polling";
import useSWR from "swr";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

export interface Project {
  _id: string;
  name: string;
  description?: string;
  url?: string;
  authCredentials?: Record<string, string>;
  paymentCredentials?: Record<string, string>;
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

  // Get all projects (SWR)
  const { data: projects, error: projectsError, isLoading: projectsLoading, mutate: mutateProjects } = useSWR<Project[]>(
    token ? ["/projects", token] as [string, string] : null,
    ([url, token]: [string, string]) => fetcher(url, token)
  );

  // Get project count (polling)
  const { data: countData, error: countError, isLoading: countLoading } = useBackendPolling<{ count: number }>("/projects/count", 5000);

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
    mutateProjects(); // Refresh project list
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
    mutateProjects();
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
    mutateProjects();
    return res.json();
  };

  return {
    projects,
    projectsError,
    projectsLoading,
    count: countData?.count ?? 0,
    countError,
    countLoading,
    createProject,
    updateProject,
    deleteProject,
    getProjectById,
    mutateProjects,
  };
} 