import { useAuth } from "@/lib/auth";
import { useEffect, useRef } from "react";
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
  const prevWorkspaceId = useRef<string | null>(null);

  // Initial fetch
  useEffect(() => {
    // Reset store when switching workspace
    if (prevWorkspaceId.current && prevWorkspaceId.current !== currentWorkspaceId) {
      store.reset();
    }
    prevWorkspaceId.current = currentWorkspaceId;

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

    const createdHandler = (issue: Issue & { workspace?: string }) => {
      if (!issue.workspace || issue.workspace === currentWorkspaceId) {
        store.addIssue(issue);
      }
    };
    const updatedHandler = (issue: Issue & { workspace?: string }) => {
      if (!issue.workspace || issue.workspace === currentWorkspaceId) {
        store.updateIssue(issue);
      }
    };
    const deletedHandler = ({ _id, workspace }: { _id?: string; workspace?: string }) => {
      if (!_id) return;
      if (!workspace || workspace === currentWorkspaceId) {
        store.deleteIssue(_id);
      }
    };

    socket.on("issue:created", createdHandler);
    socket.on("issue:updated", updatedHandler);
    socket.on("issue:deleted", deletedHandler);
    socket.on("issues:updated", handleRefresh);

    return () => {
      socket.off("issue:created", createdHandler);
      socket.off("issue:updated", updatedHandler);
      socket.off("issue:deleted", deletedHandler);
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