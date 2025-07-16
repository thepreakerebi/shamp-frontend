import { create } from "zustand";

export interface Notification {
  _id: string;
  user: string;
  type: string;
  data: Record<string, unknown>;
  read: boolean;
  createdAt: string;
  updatedAt: string;
  workspace?: string;
}

interface NotificationsState {
  notifications: Notification[] | null;
  notificationsLoading: boolean;
  notificationsError: string | null;
  setNotifications: (notifications: Notification[] | null) => void;
  setNotificationsLoading: (loading: boolean) => void;
  setNotificationsError: (error: string | null) => void;
  addNotification: (notification: Notification) => void;
  markAllReadLocally: () => void;
  clearAllLocally: () => void;
}

export const useNotificationsStore = create<NotificationsState>((set) => ({
  notifications: null,
  notificationsLoading: true,
  notificationsError: null,
  setNotifications: (notifications) => set({ notifications }),
  setNotificationsLoading: (notificationsLoading) => set({ notificationsLoading }),
  setNotificationsError: (notificationsError) => set({ notificationsError }),
  addNotification: (notification) =>
    set((state) => {
      const exists = state.notifications?.some((n) => n._id === notification._id);
      if (exists) {
        // If duplicate, replace the existing one (preserving order)
        return {
          notificationsLoading: false,
          notifications: (state.notifications ?? []).map((n) =>
            n._id === notification._id ? { ...n, ...notification } : n,
          ),
        };
      }
      return {
        notificationsLoading: false,
        notifications: [notification, ...(state.notifications ?? [])],
      };
    }),
  markAllReadLocally: () =>
    set((state) => ({
      notifications: state.notifications
        ? state.notifications.map((n) => ({ ...n, read: true }))
        : null,
    })),
  clearAllLocally: () => set({ notifications: null }),
})); 