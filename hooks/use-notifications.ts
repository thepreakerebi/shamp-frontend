import { useEffect, useCallback, useRef } from "react";
import io from "socket.io-client";
import { useNotificationsStore, Notification } from "@/lib/store/notifications";
import { useAuth } from "@/lib/auth";

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

export function useNotifications({ enabled = true, scope = 'current' }: { enabled?: boolean; scope?: 'current' | 'all' } = {}) {
  const { token, currentWorkspaceId } = useAuth();
  const store = useNotificationsStore();
  const prevKey = useRef<string>('');
  const effectiveWorkspaceId = scope === 'all' ? null : currentWorkspaceId;

  // Initial fetch
  useEffect(() => {
    if (!enabled || !token || (scope === 'current' && !currentWorkspaceId)) return;
    (async () => {
      store.setNotificationsLoading(true);
      store.setNotificationsError(null);
      try {
        const endpoint = scope === 'all' ? "/notifications?workspace=all" : "/notifications";
        const data = await fetcher(endpoint, token, effectiveWorkspaceId);
        store.setNotifications(Array.isArray(data) ? data : []);
      } catch (err: unknown) {
        if (err instanceof Error) store.setNotificationsError(err.message);
        else store.setNotificationsError("Failed to fetch notifications");
      } finally {
        store.setNotificationsLoading(false);
      }
    })();
  }, [token, currentWorkspaceId, enabled, scope]);

  // Reset store when workspace scope changes to avoid showing stale notifications
  const key = scope === 'all' ? 'all' : currentWorkspaceId ?? '';
  useEffect(() => {
    if (prevKey.current !== key) {
      store.setNotifications(null);
      prevKey.current = key;
    }
  }, [key]);

  // Track latest workspace for runtime comparison
  const workspaceIdRef = useRef<string | null>(currentWorkspaceId ?? null);
  useEffect(() => {
    workspaceIdRef.current = currentWorkspaceId ?? null;
  }, [currentWorkspaceId]);

  // Socket real-time updates
  useEffect(() => {
    if (!enabled || !token || (scope === 'current' && !currentWorkspaceId)) return;
    const socketAuth: { token: string; workspaceId?: string } = { token };
    if (effectiveWorkspaceId) socketAuth.workspaceId = effectiveWorkspaceId;
    const socket = io(SOCKET_URL, { transports: ["websocket"], auth: socketAuth });

    const createdHandler = (notif: Notification & { workspace?: string }) => {
      const currentWs = workspaceIdRef.current;
      if (scope === 'all') {
        store.addNotification(notif);
      } else {
        const ws = notif.workspace ? String(notif.workspace) : null;
        // If backend omits workspace, or matches current, accept
        if (!ws || ws === currentWs) {
          store.addNotification(notif);
        }
      }
    };

    socket.on("notification:created", createdHandler);

    socket.on("notifications:markAllRead", ({ workspace }: { workspace?: string }) => {
      if (scope === 'all' || !workspace || workspace === currentWorkspaceId) {
        store.markAllReadLocally();
      }
    });

    socket.on("notifications:cleared", ({ workspace }: { workspace?: string }) => {
      if (scope === 'all' || !workspace || workspace === currentWorkspaceId) {
        store.clearAllLocally();
      }
    });

    return () => {
      socket.off("notification:created", createdHandler);
      socket.off("notifications:markAllRead");
      socket.off("notifications:cleared");
      socket.disconnect();
    };
  }, [token, currentWorkspaceId, enabled, scope]);

  // API mutations
  const markAllAsRead = useCallback(async () => {
    if (!token || (scope === 'current' && !currentWorkspaceId)) return;
    const endpoint = scope === 'all' ? `/notifications/mark-all-read?workspace=all` : `/notifications/mark-all-read`;
    await fetch(`${API_BASE}${endpoint}`, {
      method: "PUT",
      credentials: "include",
      headers: { 
        Authorization: `Bearer ${token}`,
        ...(effectiveWorkspaceId ? { 'X-Workspace-ID': effectiveWorkspaceId } : {})
      },
    });
    store.markAllReadLocally();
  }, [token, currentWorkspaceId, scope]);

  const clearAll = useCallback(async () => {
    if (!token || (scope === 'current' && !currentWorkspaceId)) return;
    const endpoint = scope === 'all' ? `/notifications/clear-all?workspace=all` : `/notifications/clear-all`;
    await fetch(`${API_BASE}${endpoint}`, {
      method: "DELETE",
      credentials: "include",
      headers: { 
        Authorization: `Bearer ${token}`,
        ...(effectiveWorkspaceId ? { 'X-Workspace-ID': effectiveWorkspaceId } : {})
      },
    });
    store.clearAllLocally();
  }, [token, currentWorkspaceId, scope]);

  return {
    notifications: store.notifications,
    notificationsError: store.notificationsError,
    notificationsLoading: store.notificationsLoading,
    markAllAsRead,
    clearAll,
    hasWorkspaceContext: !!currentWorkspaceId,
  };
} 