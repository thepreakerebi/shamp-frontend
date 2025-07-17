import { useAuth } from "@/lib/auth";
import { useEffect } from "react";
import io from "socket.io-client";
import { useBatchPersonasStore } from "@/lib/store/batchPersonas";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL as string;

export interface Persona {
  _id: string;
  name: string;
  description: string;
  // Add other persona fields as needed
  workspace?: string;
}

export interface BatchPersona {
  _id: string;
  name: string;
  description: string;
  targetAudience?: string;
  diversity?: string[] | Record<string, unknown>;
  requiredFields?: string[];
  additionalContext?: string;
  personas: string[] | Persona[];
  createdBy?: string;
  workspace?: string; // Which workspace this batch persona belongs to
  // Add other fields as needed
}

type BatchPersonaPayload = {
  count: number;
  name: string;
  description: string;
  targetAudience?: string;
  diversity?: string;
  requiredFields?: string[];
  additionalContext?: string;
};

const fetcher = (url: string, token: string, workspaceId?: string | null) =>
  fetch(`${API_BASE}${url}`, {
    credentials: "include",
    headers: { 
      Authorization: `Bearer ${token}`,
      ...(workspaceId ? { 'X-Workspace-ID': workspaceId } : {})
    },
  }).then(res => {
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
  });

export function useBatchPersonas(enabled: boolean = true) {
  const { token, currentWorkspaceId } = useAuth();
  const store = useBatchPersonasStore();

  useEffect(() => {
    if (!enabled) return;
    if (!token || !currentWorkspaceId) return;
    // Inline the fetch logic to avoid dependency on fetchBatchPersonas
    (async () => {
    store.setBatchPersonasLoading(true);
    store.setBatchPersonasError(null);
    try {
      const data = await fetcher("/batchpersonas", token, currentWorkspaceId);
      store.setBatchPersonas(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      if (err instanceof Error) {
        store.setBatchPersonasError(err.message);
      } else {
        store.setBatchPersonasError("Failed to fetch batch personas");
      }
    } finally {
      store.setBatchPersonasLoading(false);
    }
    })();
  }, [token, currentWorkspaceId, enabled]);

  useEffect(() => {
    if (!enabled) return;
    if (!token || !currentWorkspaceId) return;
    const socket = io(SOCKET_URL, {
      transports: ["websocket"],
      auth: { token, workspaceId: currentWorkspaceId },
    });

    const handleCreated = (data: BatchPersona & { workspace?: string }) => {
      if (data.workspace && data.workspace === currentWorkspaceId) {
        store.addBatchPersonaToList(data);
      }
    };

    const handleDeleted = (data: { _id?: string; workspace?: string }) => {
      if (data.workspace && data.workspace === currentWorkspaceId && data._id) {
        store.removeBatchPersonaFromList(data._id);
      }
    };

    const handleUpdated = (data: BatchPersona & { workspace?: string }) => {
      if (data.workspace && data.workspace === currentWorkspaceId) {
        store.updateBatchPersonaInList(data);
      }
    };

    socket.on("batchPersona:created", handleCreated);
    socket.on("batchPersona:deleted", handleDeleted);
    socket.on("batchPersona:updated", handleUpdated);

    return () => {
      socket.off("batchPersona:created", handleCreated);
      socket.off("batchPersona:deleted", handleDeleted);
      socket.off("batchPersona:updated", handleUpdated);
      socket.disconnect();
    };
  }, [token, currentWorkspaceId, enabled, store]);

  const getBatchPersonaById = async (id: string): Promise<BatchPersona> => {
    if (!token || !currentWorkspaceId) throw new Error("Not authenticated or no workspace context");
    const res = await fetch(`${API_BASE}/batchpersonas/${id}`, {
      credentials: "include",
      headers: { 
        Authorization: `Bearer ${token}`,
        'X-Workspace-ID': currentWorkspaceId
      },
    });
    if (!res.ok) throw new Error("Failed to fetch batch persona");
    return res.json();
  };

  const createBatchPersona = async (payload: BatchPersonaPayload) => {
    if (!token || !currentWorkspaceId) throw new Error("Not authenticated or no workspace context");
    const res = await fetch(`${API_BASE}/batchpersonas`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        'X-Workspace-ID': currentWorkspaceId
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to create batch persona");
    return res.json();
  };

  const deleteBatchPersona = async (id: string) => {
    if (!token || !currentWorkspaceId) throw new Error("Not authenticated or no workspace context");
    const res = await fetch(`${API_BASE}/batchpersonas/${id}`, {
      method: "DELETE",
      credentials: "include",
      headers: { 
        Authorization: `Bearer ${token}`,
        'X-Workspace-ID': currentWorkspaceId
      },
    });
    if (!res.ok) throw new Error("Failed to delete batch persona");
    return res.json();
  };

  const stopBatchPersonaCreation = async (id: string) => {
    if (!token || !currentWorkspaceId) throw new Error("Not authenticated or no workspace context");
    const res = await fetch(`${API_BASE}/batchpersonas/${id}/stop`, {
      method: "POST",
      credentials: "include",
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Workspace-ID': currentWorkspaceId,
      },
    });
    if (!res.ok) throw new Error("Failed to stop batch persona creation");
    return res.json();
  };

  const updateBatchPersonaName = async (id: string, name: string): Promise<BatchPersona> => {
    if (!token || !currentWorkspaceId) throw new Error("Not authenticated or no workspace context");
    const res = await fetch(`${API_BASE}/batchpersonas/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        'X-Workspace-ID': currentWorkspaceId
      },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) throw new Error("Failed to update batch persona");
    const updated = await res.json();
    store.updateBatchPersonaInList(updated);
    return updated;
  };

  return {
    batchPersonas: store.batchPersonas,
    batchPersonasError: store.batchPersonasError,
    batchPersonasLoading: store.batchPersonasLoading,
    getBatchPersonaById,
    createBatchPersona,
    deleteBatchPersona,
    stopBatchPersonaCreation,
    updateBatchPersonaName,
    hasWorkspaceContext: !!currentWorkspaceId,
  };
} 