import { useEffect, useCallback } from "react";
import io from "socket.io-client";
import { useAuth } from "@/lib/auth";
import { useTestSchedulesStore, TestSchedule } from "@/lib/store/testSchedules";
import { toast } from "sonner";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000";

// --- Singleton guards to avoid duplicate effects per browser tab ---
let socketInitialized = false;
let schedulesFetchedOnce = false;

const fetcher = (url: string, token: string) =>
  fetch(`${API_BASE}${url}`, {
    credentials: "include",
    headers: { Authorization: `Bearer ${token}` },
  }).then(res => {
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
  });

export function useTestSchedules() {
  const { token } = useAuth();
  const store = useTestSchedulesStore();
  const {
    schedules,
    schedulesLoading,
    schedulesError,
    trashedSchedules,
    trashedSchedulesLoading,
    trashedSchedulesError,
    setSchedules,
    setSchedulesLoading,
    setSchedulesError,
    setTrashedSchedules,
    setTrashedSchedulesLoading,
    setTrashedSchedulesError,
    updateScheduleInList,
    removeScheduleFromList,
    addTrashedSchedule,
    removeTrashedSchedule,
  } = store;

  // Initial fetch (only once)
  useEffect(() => {
    if (!token || schedulesFetchedOnce) return;
    schedulesFetchedOnce = true;
    fetchSchedules();
    fetchTrashedSchedules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Real-time updates with Socket.IO (only once)
  useEffect(() => {
    if (!token || socketInitialized) return;
    socketInitialized = true;
    const socket = io(SOCKET_URL, {
      transports: ["websocket"],
      auth: { token },
    });

    socket.on("schedule:created", (schedule: TestSchedule) => {
      updateScheduleInList(schedule);
    });
    socket.on("schedule:updated", (schedule: TestSchedule) => {
      updateScheduleInList(schedule);
    });
    socket.on("schedule:trashed", (payload: { schedule?: TestSchedule; _id?: string }) => {
      if (payload.schedule) {
        removeScheduleFromList(payload.schedule._id);
        addTrashedSchedule({ ...payload.schedule, trashed: true });
      } else if (payload._id) {
        removeScheduleFromList(payload._id);
      }
    });
    socket.on("schedule:deleted", ({ _id }: { _id: string }) => {
      removeScheduleFromList(_id);
      removeTrashedSchedule(_id);
    });
    socket.on("schedule:restored", ({ schedule }: { schedule: TestSchedule }) => {
      removeTrashedSchedule(schedule._id);
      updateScheduleInList(schedule);
    });

    return () => {
      socket.disconnect();
    };
  }, [token, updateScheduleInList, removeScheduleFromList, addTrashedSchedule, removeTrashedSchedule]);

  // Fetch all schedules for the admin group
  const fetchSchedules = useCallback(async () => {
    if (!token) return;
    setSchedulesLoading(true);
    setSchedulesError(null);
    try {
      const data = await fetcher("/testschedules", token);
      setSchedules(Array.isArray(data) ? (data as TestSchedule[]) : []);
    } catch (err: unknown) {
      setSchedulesError(err instanceof Error ? err.message : "Failed to load schedules");
    } finally {
      setSchedulesLoading(false);
    }
  }, [token, setSchedulesLoading, setSchedulesError, setSchedules]);

  // Fetch trashed schedules
  const fetchTrashedSchedules = useCallback(async () => {
    if (!token) return;
    setTrashedSchedulesLoading(true);
    setTrashedSchedulesError(null);
    try {
      const data = await fetcher("/testschedules/trashed", token);
      setTrashedSchedules(Array.isArray(data) ? (data as TestSchedule[]) : []);
    } catch (err: unknown) {
      setTrashedSchedulesError(err instanceof Error ? err.message : "Failed to load trashed schedules");
    } finally {
      setTrashedSchedulesLoading(false);
    }
  }, [token, setTrashedSchedulesLoading, setTrashedSchedulesError, setTrashedSchedules]);

  // Move schedule to trash
  const moveScheduleToTrash = useCallback(
    async (id: string) => {
      if (!token) throw new Error("Not authenticated");
      try {
        const res = await fetch(`${API_BASE}/testschedules/${id}/trash`, {
          method: "PATCH",
          credentials: "include",
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json().catch(()=>null);
        if (data && data.schedule) {
          removeScheduleFromList(data.schedule._id);
          addTrashedSchedule({ ...data.schedule, trashed: true });
        } else {
          removeScheduleFromList(id);
        }
        toast.success("Schedule moved to trash");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to trash schedule");
      }
    },
    [token, removeScheduleFromList, addTrashedSchedule]
  );

  // Restore schedule from trash
  const restoreScheduleFromTrash = useCallback(
    async (id: string) => {
      if (!token) throw new Error("Not authenticated");
      try {
        const res = await fetch(`${API_BASE}/testschedules/${id}/restore`, {
          method: "PATCH",
          credentials: "include",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to restore schedule");
        const data = (await res.json()) as { schedule?: TestSchedule } | TestSchedule;
        const schedule: TestSchedule = (data as { schedule?: TestSchedule }).schedule ?? (data as TestSchedule);
        updateScheduleInList(schedule);
        removeTrashedSchedule(schedule._id);
        toast.success("Schedule restored");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to restore schedule");
      }
    },
    [token, updateScheduleInList, removeTrashedSchedule]
  );

  return {
    schedules,
    schedulesLoading,
    schedulesError,
    trashedSchedules,
    trashedSchedulesLoading,
    trashedSchedulesError,
    fetchSchedules,
    fetchTrashedSchedules,
    moveScheduleToTrash,
    restoreScheduleFromTrash,
  };
} 