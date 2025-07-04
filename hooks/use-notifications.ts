import { useEffect, useCallback } from "react";
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

export function useNotifications(enabled: boolean = true) {
  const { token, currentWorkspaceId } = useAuth();
  const store = useNotificationsStore();

  // Initial fetch
  useEffect(() => {
    if (!enabled || !token || !currentWorkspaceId) return;
    (async () => {
      store.setNotificationsLoading(true);
      store.setNotificationsError(null);
      try {
        const data = await fetcher("/notifications", token, currentWorkspaceId);
        store.setNotifications(Array.isArray(data) ? data : []);
      } catch (err: unknown) {
        if (err instanceof Error) store.setNotificationsError(err.message);
        else store.setNotificationsError("Failed to fetch notifications");
      } finally {
        store.setNotificationsLoading(false);
      }
    })();
  }, [token, currentWorkspaceId, enabled]);

  // Socket real‐time updates
  useEffect(() => {
    if (!enabled || !token || !currentWorkspaceId) return;
    const socket = io(SOCKET_URL, {
      transports: ["websocket"],
      auth: { token, workspaceId: currentWorkspaceId },
    });

    socket.on("notification:created", (notif: Notification) => {
      store.addNotification(notif);
    });

    socket.on("notifications:markAllRead", () => {
      store.markAllReadLocally();
    });

    socket.on("notifications:cleared", () => {
      store.clearAllLocally();
    });

    return () => {
      socket.off("notification:created", () => {});
      socket.off("notifications:markAllRead", () => {});
      socket.off("notifications:cleared", () => {});
      socket.disconnect();
    };
  }, [token, currentWorkspaceId, enabled]);

  // API mutations
  const markAllAsRead = useCallback(async () => {
    if (!token || !currentWorkspaceId) return;
    await fetch(`${API_BASE}/notifications/mark-all-read`, {
      method: "PUT",
      credentials: "include",
      headers: { 
        Authorization: `Bearer ${token}`,
        'X-Workspace-ID': currentWorkspaceId
      },
    });
    store.markAllReadLocally();
  }, [token, currentWorkspaceId]);

  const clearAll = useCallback(async () => {
    if (!token || !currentWorkspaceId) return;
    await fetch(`${API_BASE}/notifications/clear-all`, {
      method: "DELETE",
      credentials: "include",
      headers: { 
        Authorization: `Bearer ${token}`,
        'X-Workspace-ID': currentWorkspaceId
      },
    });
    store.clearAllLocally();
  }, [token, currentWorkspaceId]);

  return {
    notifications: store.notifications,
    notificationsError: store.notificationsError,
    notificationsLoading: store.notificationsLoading,
    markAllAsRead,
    clearAll,
    hasWorkspaceContext: !!currentWorkspaceId,
  };
} 