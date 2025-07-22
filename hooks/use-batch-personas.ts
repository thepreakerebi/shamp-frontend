import { useAuth } from "@/lib/auth";
import { useEffect } from "react";
import io from "socket.io-client";
import { useBatchPersonasStore } from "@/lib/store/batchPersonas";
import { apiFetch } from '@/lib/api-client';

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

const fetcher = (url: string, workspaceId?: string | null) =>
  apiFetch(url, { workspaceId }).then(res => {
    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();
  });

export function useBatchPersonas(enabled: boolean = true) {
  const { currentWorkspaceId } = useAuth();
  const store = useBatchPersonasStore();

  useEffect(() => {
    if (!enabled) return;
    if (!currentWorkspaceId) return;
    // Inline the fetch logic to avoid dependency on fetchBatchPersonas
    (async () => {
    store.setBatchPersonasLoading(true);
    store.setBatchPersonasError(null);
    try {
      const data = await fetcher("/batchpersonas", currentWorkspaceId);
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
  }, [currentWorkspaceId, enabled]);

  useEffect(() => {
    if (!enabled) return;
    if (!currentWorkspaceId) return;
    const socket = io(SOCKET_URL, {
      transports: ["websocket"],
      auth: { workspaceId: currentWorkspaceId },
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
  }, [currentWorkspaceId, enabled, store]);

  const getBatchPersonaById = async (id: string): Promise<BatchPersona> => {
    if (!currentWorkspaceId) throw new Error("No workspace context");
    const res = await apiFetch(`/batchpersonas/${id}`, { workspaceId: currentWorkspaceId });
    if (!res.ok) throw new Error("Failed to fetch batch persona");
    return res.json();
  };

  const createBatchPersona = async (payload: BatchPersonaPayload) => {
    if (!currentWorkspaceId) throw new Error("No workspace context");
    const res = await apiFetch('/batchpersonas', { workspaceId: currentWorkspaceId, method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (!res.ok) throw new Error("Failed to create batch persona");
    return res.json();
  };

  const deleteBatchPersona = async (id: string) => {
    if (!currentWorkspaceId) throw new Error("No workspace context");
    const res = await apiFetch(`/batchpersonas/${id}`, { workspaceId: currentWorkspaceId, method: 'DELETE' });
    if (!res.ok) throw new Error("Failed to delete batch persona");
    return res.json();
  };

  const stopBatchPersonaCreation = async (id: string) => {
    if (!currentWorkspaceId) throw new Error("No workspace context");
    const res = await apiFetch(`/batchpersonas/${id}/stop`, { workspaceId: currentWorkspaceId, method: 'POST' });
    if (!res.ok) throw new Error("Failed to stop batch persona creation");
    return res.json();
  };

  const updateBatchPersonaName = async (id: string, name: string): Promise<BatchPersona> => {
    if (!currentWorkspaceId) throw new Error("No workspace context");
    const res = await apiFetch(`/batchpersonas/${id}`, { workspaceId: currentWorkspaceId, method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
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