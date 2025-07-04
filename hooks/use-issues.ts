import { useAuth } from "@/lib/auth";
import { useEffect } from "react";
import io from "socket.io-client";
import { useIssuesStore, Issue } from "@/lib/store/issues";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL as string;

const fetcher = (url: string, token: string, workspaceId?: string | null) =>
  fetch(`${API_BASE}${url}`, {
    credentials: "include",
    headers: { 
      Authorization: `Bearer ${token}`,
      ...(workspaceId ? { 'X-Workspace-ID': workspaceId } : {})
    },
  }).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
  });

export function useIssues(enabled: boolean = true) {
  const { token, currentWorkspaceId } = useAuth();
  const store = useIssuesStore();

  // Initial fetch
  useEffect(() => {
    if (!enabled) return;
    if (!token || !currentWorkspaceId) return;
    (async () => {
      store.setIssuesLoading(true);
      store.setIssuesError(null);
      try {
        const data: Issue[] = await fetcher("/issues", token, currentWorkspaceId);
        store.setIssues(Array.isArray(data) ? data : []);
      } catch (err: unknown) {
        store.setIssuesError(err instanceof Error ? err.message : "Failed to fetch issues");
      } finally {
        store.setIssuesLoading(false);
      }
    })();
  }, [token, currentWorkspaceId, enabled]);

  // Socket listeners
  useEffect(() => {
    if (!enabled) return;
    if (!token || !currentWorkspaceId) return;
    const socket = io(SOCKET_URL, {
      transports: ["websocket"],
      auth: { token, workspaceId: currentWorkspaceId },
    });

    const handleRefresh = async () => {
      try {
        const data: Issue[] = await fetcher("/issues", token, currentWorkspaceId);
        store.setIssues(Array.isArray(data) ? data : []);
      } catch {}
    };

    socket.on("issue:created", (issue: Issue) => {
      store.addIssue(issue);
    });
    socket.on("issue:updated", (issue: Issue) => {
      store.updateIssue(issue);
    });
    socket.on("issue:deleted", ({ _id }: { _id: string }) => {
      store.deleteIssue(_id);
    });
    socket.on("issues:updated", handleRefresh);

    return () => {
      socket.off("issue:created");
      socket.off("issue:updated");
      socket.off("issue:deleted");
      socket.off("issues:updated", handleRefresh);
      socket.disconnect();
    };
  }, [token, currentWorkspaceId, enabled]);

  // Actions
  const resolveIssue = async (id: string, resolved: boolean) => {
    if (!token || !currentWorkspaceId) throw new Error("Not authenticated or no workspace context");
    const method = "PUT";
    const endpoint = `/issues/${id}/${resolved ? "resolve" : "unresolve"}`;
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method,
      credentials: "include",
      headers: { 
        Authorization: `Bearer ${token}`,
        'X-Workspace-ID': currentWorkspaceId
      },
    });
    if (!res.ok) throw new Error("Failed to update issue");
  };

  const deleteIssue = async (id: string) => {
    if (!token || !currentWorkspaceId) throw new Error("Not authenticated or no workspace context");
    const res = await fetch(`${API_BASE}/issues/${id}`, {
      method: "DELETE",
      credentials: "include",
      headers: { 
        Authorization: `Bearer ${token}`,
        'X-Workspace-ID': currentWorkspaceId
      },
    });
    if (!res.ok) throw new Error("Failed to delete issue");
  };

  return {
    issues: store.issues,
    issuesLoading: store.issuesLoading,
    issuesError: store.issuesError,
    resolveIssue,
    deleteIssue,
    hasWorkspaceContext: !!currentWorkspaceId,
  };
} 