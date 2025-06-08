import { useEffect } from "react";
import { useSmartPolling } from "@/hooks/use-smart-polling";
import { useProjectStore, Project } from "@/lib/store/project-store";
import { useAuth } from "@/lib/auth";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "") || "";

export function useProjectsPolling() {
  const { token } = useAuth();
  const setProjects = useProjectStore((s) => s.setProjects);

  // Poll for projects list
  const { data: projects } = useSmartPolling<Project[]>(
    async () => {
      if (!token) throw new Error("Not authenticated");
      const url = `${API_BASE}/projects`;
      const res = await fetch(url, {
        credentials: "include",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch projects");
      return res.json();
    },
    2000
  );

  useEffect(() => {
    if (projects) setProjects(projects);
  }, [projects, setProjects]);
} 