import { useEffect, useCallback, useRef } from "react";
import io from "socket.io-client";
import { useAuth } from "@/lib/auth";
import { useTestSchedulesStore, TestSchedule } from "@/lib/store/testSchedules";
import { toast } from "sonner";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL as string;

const fetcher = (url: string, token: string, workspaceId?: string) =>
  fetch(`${API_BASE}${url}`, {
    credentials: "include",
    headers: {
      Authorization: `Bearer ${token}`,
      ...(workspaceId ? { 'X-Workspace-ID': workspaceId } : {}),
    },
  }).then(res => {
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
  });

export function useTestSchedules() {
  const { token, currentWorkspaceId } = useAuth();
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
    addScheduleToList,
    emptyTrashedSchedules,
  } = store;
  const prevWorkspaceId = useRef<string | null>(null);

  // Initial fetch & reset on workspace change
  useEffect(() => {
    // Reset store when switching workspace
    if (prevWorkspaceId.current && prevWorkspaceId.current !== currentWorkspaceId) {
      store.reset();
    }
    prevWorkspaceId.current = currentWorkspaceId;

    if (!token || !currentWorkspaceId) return;
    fetchSchedules();
    fetchTrashedSchedules();
  }, [token, currentWorkspaceId]);

  // Fetch trashed schedules (defined early so it can be referenced below)
  const fetchTrashedSchedules = useCallback(async () => {
    if (!token || !currentWorkspaceId) return;
    setTrashedSchedulesLoading(true);
    setTrashedSchedulesError(null);
    try {
      const data = await fetcher("/testschedules/trashed", token, currentWorkspaceId);
      setTrashedSchedules(Array.isArray(data) ? (data as TestSchedule[]) : []);
    } catch (err: unknown) {
      setTrashedSchedulesError(err instanceof Error ? err.message : "Failed to load trashed schedules");
    } finally {
      setTrashedSchedulesLoading(false);
    }
  }, [token, currentWorkspaceId, setTrashedSchedulesLoading, setTrashedSchedulesError, setTrashedSchedules]);

  // Real-time updates with Socket.IO scoped to workspace
  useEffect(() => {
    if (!token || !currentWorkspaceId) return;
    const socket = io(SOCKET_URL, {
      transports: ["websocket"],
      auth: { token, workspaceId: currentWorkspaceId },
    });

    socket.on("schedule:created", (schedule: TestSchedule & { workspace?: string }) => {
      if (!schedule.workspace || schedule.workspace === currentWorkspaceId) {
        addScheduleToList(schedule);
      }
    });
    socket.on("schedule:updated", (schedule: TestSchedule & { workspace?: string }) => {
      if (!schedule.workspace || schedule.workspace === currentWorkspaceId) {
        updateScheduleInList(schedule);
      }
    });
    socket.on("schedule:trashed", (payload: { schedule?: TestSchedule; _id?: string; workspace?: string }) => {
      if (payload.schedule) {
        if (!payload.schedule.workspace || payload.schedule.workspace === currentWorkspaceId) {
          removeScheduleFromList(payload.schedule._id);
          addTrashedSchedule({ ...payload.schedule, trashed: true });
        }
      } else if (payload._id) {
        if (!payload.workspace || payload.workspace === currentWorkspaceId) {
          removeScheduleFromList(payload._id);
        }
      }
      fetchTrashedSchedules();
    });
    socket.on("schedule:deleted", ({ _id, workspace }: { _id: string; workspace?: string }) => {
      if (!workspace || workspace === currentWorkspaceId) {
        removeScheduleFromList(_id);
        removeTrashedSchedule(_id);
      }
    });
    socket.on("schedule:restored", ({ schedule }: { schedule: TestSchedule & { workspace?: string } }) => {
      if (!schedule.workspace || schedule.workspace === currentWorkspaceId) {
        removeTrashedSchedule(schedule._id);
        updateScheduleInList(schedule);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [token, currentWorkspaceId, updateScheduleInList, removeScheduleFromList, addTrashedSchedule, removeTrashedSchedule, addScheduleToList, fetchTrashedSchedules]);

  // Fetch all schedules for the admin group
  const fetchSchedules = useCallback(async () => {
    if (!token || !currentWorkspaceId) return;
    setSchedulesLoading(true);
    setSchedulesError(null);
    try {
      const data = await fetcher("/testschedules", token, currentWorkspaceId);
      setSchedules(Array.isArray(data) ? (data as TestSchedule[]) : []);
    } catch (err: unknown) {
      setSchedulesError(err instanceof Error ? err.message : "Failed to load schedules");
    } finally {
      setSchedulesLoading(false);
    }
  }, [token, currentWorkspaceId, setSchedulesLoading, setSchedulesError, setSchedules]);

  // Move schedule to trash
  const moveScheduleToTrash = useCallback(
    async (id: string) => {
      if (!token || !currentWorkspaceId) throw new Error("Not authenticated or no workspace context");
      try {
        const res = await fetch(`${API_BASE}/testschedules/${id}/trash`, {
          method: "PATCH",
          credentials: "include",
          headers: { 
            Authorization: `Bearer ${token}`,
            'X-Workspace-ID': currentWorkspaceId,
          },
        });
        const data = await res.json().catch(()=>null);
        if (data && data.schedule) {
          removeScheduleFromList(data.schedule._id);
          addTrashedSchedule({ ...data.schedule, trashed: true });
        } else {
          removeScheduleFromList(id);
        }
        // Refresh to get populated fields
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        fetchTrashedSchedules();
        toast.success("Schedule moved to trash");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to trash schedule");
      }
    },
    [token, currentWorkspaceId, removeScheduleFromList, addTrashedSchedule, fetchTrashedSchedules]
  );

  // Restore schedule from trash
  const restoreScheduleFromTrash = useCallback(
    async (id: string) => {
      if (!token || !currentWorkspaceId) throw new Error("Not authenticated or no workspace context");
      try {
        const res = await fetch(`${API_BASE}/testschedules/${id}/restore`, {
          method: "PATCH",
          credentials: "include",
          headers: { 
            Authorization: `Bearer ${token}`,
            'X-Workspace-ID': currentWorkspaceId,
          },
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
    [token, currentWorkspaceId, updateScheduleInList, removeTrashedSchedule]
  );

  // Delete schedule (recurring)
  const deleteSchedule = useCallback(
    async (id: string) => {
      if (!token || !currentWorkspaceId) throw new Error("Not authenticated or no workspace context");
      try {
        const res = await fetch(`${API_BASE}/testschedules/recurring/${id}`, {
          method: "DELETE",
          credentials: "include",
          headers: { 
            Authorization: `Bearer ${token}`,
            'X-Workspace-ID': currentWorkspaceId,
          },
        });
        if (!res.ok) throw new Error("Failed to delete schedule");
        removeScheduleFromList(id);
        removeTrashedSchedule(id);
        toast.success("Schedule deleted");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to delete schedule");
        throw err;
      }
    },
    [token, currentWorkspaceId, removeScheduleFromList, removeTrashedSchedule]
  );

  // Update recurring schedule
  const updateRecurringSchedule = useCallback(
    async (id: string, recurrenceRule: string) => {
      if (!token || !currentWorkspaceId) throw new Error("Not authenticated or no workspace context");
      try {
        const res = await fetch(`${API_BASE}/testschedules/recurring/${id}`, {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            'X-Workspace-ID': currentWorkspaceId,
          },
          body: JSON.stringify({ recurrenceRule }),
        });
        if (!res.ok) {
          const errTxt = await res.text().catch(()=>"Failed");
          throw new Error(errTxt || "Failed to update schedule");
        }
        const sched = (await res.json()) as TestSchedule;
        updateScheduleInList(sched);
        toast.success("Schedule updated");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to update schedule");
        throw err;
      }
    },
    [token, currentWorkspaceId, updateScheduleInList]
  );

  // Remote search/filter for schedules
  const searchSchedules = useCallback(
    async (params: Record<string, string | number | undefined>) => {
      if (!token || !currentWorkspaceId) return;
      setSchedulesLoading(true);
      setSchedulesError(null);
      try {
        const filtered: Record<string, string> = {};
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== "") {
            filtered[key] = String(value);
          }
        });

        // If no filters, fetch the full list instead of paginated search
        if (Object.keys(filtered).length === 0) {
          await fetchSchedules();
          return;
        }

        const qs = new URLSearchParams(filtered).toString();
        const resp = await fetcher(`/tests/search?${qs}`, token, currentWorkspaceId);

        type SearchResp = { data: Array<{ _id: string }> } | Array<{ _id: string }>;
        const testsResp = resp as unknown as SearchResp;
        const testsArr: Array<{ _id: string }> = Array.isArray(testsResp)
          ? testsResp
          : Array.isArray((testsResp as { data: unknown }).data)
          ? (testsResp as { data: Array<{ _id: string }> }).data
          : [];

        const idSet = new Set<string>(testsArr.map((t) => String(t._id)));

        const currentSchedules = useTestSchedulesStore.getState().schedules ?? [];
        const matched = currentSchedules.filter((s) => idSet.has(s.testId));

        setSchedules(matched);
      } catch {
        // Remote search failed – fallback to simple client-side filtering
        const current = useTestSchedulesStore.getState().schedules ?? [];
        const queryLower = (params.q as string | undefined)?.toLowerCase() ?? "";
        const projectsSel = (params.project as string | undefined)?.split(",") ?? [];
        const personasSel = (params.persona as string | undefined)?.split(",") ?? [];

        const filteredLocal = current.filter((s) => {
          const matchesQuery = !queryLower ||
            s.testName.toLowerCase().includes(queryLower) ||
            (s.testDescription && s.testDescription.toLowerCase().includes(queryLower));
          const matchesProject = !projectsSel.length || (s.projectName && projectsSel.includes(s.projectName));
          const matchesPersona = !personasSel.length || (s.personaName && personasSel.includes(s.personaName));
          return matchesQuery && matchesProject && matchesPersona;
        });
        setSchedules(filteredLocal);
      } finally {
        setSchedulesLoading(false);
      }
    },
    [token, currentWorkspaceId, setSchedules, setSchedulesLoading, setSchedulesError, fetchSchedules]
  );

  // Empty trash - permanently delete all trashed test schedules
  const emptyTestScheduleTrash = async () => {
    if (!token || !currentWorkspaceId) throw new Error("Not authenticated or no workspace context");
    const res = await fetch(`${API_BASE}/testschedules/trash/empty`, {
      method: "DELETE",
      credentials: "include",
      headers: { 
        Authorization: `Bearer ${token}`,
        'X-Workspace-ID': currentWorkspaceId,
      },
    });
    if (!res.ok) throw new Error("Failed to empty test schedule trash");
    const result = await res.json();
    emptyTrashedSchedules();
    return result;
  };

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
    deleteSchedule,
    updateRecurringSchedule,
    addScheduleToList,
    searchSchedules,
    emptyTrashedSchedules,
    emptyTestScheduleTrash,
  };
} 