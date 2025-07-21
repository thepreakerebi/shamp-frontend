import { useEffect, useCallback, useRef } from "react";
import io from "socket.io-client";
import { useNotificationsStore, Notification } from "@/lib/store/notifications";
import { useAuth } from "@/lib/auth";
import { apiFetch } from '@/lib/api-client';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL as string;

const fetcher = (url: string, token: string | null, workspaceId?: string | null) =>
  apiFetch(url, { token, workspaceId }).then(res => {
    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();
  });

export function useNotifications({ enabled = true, scope = 'current' }: { enabled?: boolean; scope?: 'current' | 'all' } = {}) {
  const { token, currentWorkspaceId } = useAuth();
  const store = useNotificationsStore();
  const key = scope === 'all' ? 'all' : currentWorkspaceId ?? '';
  // Track last workspace key across hook instances to avoid clearing store on initial mount
  const prevKey = useRef<string>(key);
  const effectiveWorkspaceId = scope === 'all' ? null : currentWorkspaceId;

  // Queue notifications received before workspace ID is known
  const pendingNotifsRef = useRef<Notification[]>([]);

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
    if (!enabled || !token) return; // connect as soon as we have token
    const socketAuth: { token: string; workspaceId?: string } = { token };
    if (effectiveWorkspaceId) socketAuth.workspaceId = effectiveWorkspaceId;
    const socket = io(SOCKET_URL, { transports: ["websocket"], auth: socketAuth });

    const createdHandler = (notif: Notification & { workspace?: string }) => {
      const currentWs = workspaceIdRef.current;
      if (scope === 'all') {
        store.addNotification(notif);
      } else {
        // Normalise workspace (could be ObjectId, string, or undefined)
        let ws: string | null = null;
        if (notif.workspace) {
          if (typeof notif.workspace === 'string') {
            ws = notif.workspace;
          } else if (typeof (notif.workspace as unknown as { toString: () => string }).toString === 'function') {
            ws = (notif.workspace as unknown as { toString: () => string }).toString();
          }
        }
        // If current workspace not yet known, queue for later
        if (!currentWs) {
          pendingNotifsRef.current.push(notif as Notification);
        return;
        }

        // Accept if workspace absent or matches current
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

    socket.on("notification:read", ({ id, workspace }: { id: string; workspace?: string }) => {
      if (scope === 'all' || !workspace || workspace === currentWorkspaceId) {
        store.markReadLocally(id);
      }
    });

    socket.on("notifications:cleared", ({ workspace }: { workspace?: string }) => {
      if (scope === 'all' || !workspace || workspace === currentWorkspaceId) {
        store.clearAllLocally();
      }
    });

    return () => {
      socket.off("notification:created", createdHandler);
      socket.off("notification:read");
      socket.off("notifications:markAllRead");
      socket.off("notifications:cleared");
      socket.disconnect();
    };
  }, [token, currentWorkspaceId, enabled, scope, effectiveWorkspaceId]);

  // Flush pending notifications once workspace ID becomes available
  useEffect(() => {
    if (scope !== 'current') return;
    const currentWs = workspaceIdRef.current;
    if (!currentWs) return;

    if (pendingNotifsRef.current.length) {
      const remaining: Notification[] = [];
      pendingNotifsRef.current.forEach((notif) => {
        let ws: string | null = null;
        if (notif.workspace) {
          if (typeof notif.workspace === 'string') ws = notif.workspace;
          else if (typeof (notif.workspace as unknown as { toString: () => string }).toString === 'function') ws = (notif.workspace as unknown as { toString: () => string }).toString();
        }
        if (!ws || ws === currentWs) {
          store.addNotification(notif);
        } else {
          remaining.push(notif);
        }
      });
      pendingNotifsRef.current = remaining;
    }
  }, [currentWorkspaceId, scope]);

  // API mutation – mark a single notification as read
  const markNotificationAsRead = useCallback(async (id: string) => {
    if (!id) return;

    // Optimistically update locally
    store.markReadLocally(id);

    if (!token || (scope === 'current' && !currentWorkspaceId)) return;
    const endpoint = `/notifications/${id}/read`;
    try {
      await fetch(`${API_BASE}${endpoint}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          Authorization: `Bearer ${token}`,
          ...(effectiveWorkspaceId ? { 'X-Workspace-ID': effectiveWorkspaceId } : {}),
        },
      });
    } catch {
      // ignore, backend will sync later
    }
  }, [token, currentWorkspaceId, scope, effectiveWorkspaceId]);

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
    markNotificationAsRead,
    hasWorkspaceContext: !!currentWorkspaceId,
  };
} 