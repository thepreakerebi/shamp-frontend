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
    set((state) => ({ notifications: [notification, ...(state.notifications ?? [])] })),
  markAllReadLocally: () =>
    set((state) => ({
      notifications: state.notifications
        ? state.notifications.map((n) => ({ ...n, read: true }))
        : null,
    })),
  clearAllLocally: () => set({ notifications: null }),
})); 