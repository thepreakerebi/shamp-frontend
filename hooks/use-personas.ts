import { useAuth } from "@/lib/auth";
import { useEffect, useCallback, useRef } from "react";
import io from "socket.io-client";
import { apiFetch } from '@/lib/api-client';
import { usePersonasStore } from "@/lib/store/personas";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL as string;

export interface Persona {
  _id: string;
  name: string;
  description?: string;
  goals?: string[];
  frustrations?: string[];
  traits?: Record<string, string | number | boolean> | string[];
  background?: string;
  preferredDevices?: string[];
  gender?: string;
  createdBy?: User | string;
  avatarUrl?: string;
  workspace?: string;
  // Add other fields as needed
}

type PersonaPayload = {
  name: string;
  description: string;
  goals?: string[];
  frustrations?: string[];
  traits?: Record<string, string | number | boolean> | string[];
  background?: string;
  preferredDevices?: string[];
  gender?: string;
};

interface User {
  _id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

// Legacy fetcher removed – apiFetch is used everywhere

export function usePersonas() {
  const { token, currentWorkspaceId } = useAuth();
  const store = usePersonasStore();
  const previousWorkspaceId = useRef<string | null>(null);

  const fetchPersonas = useCallback(async () => {
    if (!currentWorkspaceId) {
      store.setPersonasLoading(false);
      store.setPersonas([]);
      return;
    }
    store.setPersonasLoading(true);
    store.setPersonasError(null);
    try {
      const res = await apiFetch('/personas', { token, workspaceId: currentWorkspaceId });
      const data = await res.json();
      store.setPersonas(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      if (err instanceof Error) {
        store.setPersonasError(err.message);
      } else {
        store.setPersonasError("Failed to fetch personas");
      }
    } finally {
      store.setPersonasLoading(false);
    }
  }, [token, currentWorkspaceId, store]);

  const fetchCount = useCallback(async () => {
    if (!currentWorkspaceId) {
      store.setCountLoading(false);
      store.setCount(0);
      return;
    }
    store.setCountLoading(true);
    store.setCountError(null);
    try {
      const res = await apiFetch('/personas/count', { token, workspaceId: currentWorkspaceId });
      const data = await res.json();
      store.setCount(data.count ?? 0);
    } catch (err: unknown) {
      if (err instanceof Error) {
        store.setCountError(err.message);
      } else {
        store.setCountError("Failed to fetch persona count");
      }
    } finally {
      store.setCountLoading(false);
    }
  }, [token, currentWorkspaceId, store]);

  // Refetch both personas and count
  const refetch = useCallback(() => {
    fetchPersonas();
    fetchCount();
  }, [fetchPersonas, fetchCount]);

  useEffect(() => {
    if (!currentWorkspaceId) {
      store.setPersonasLoading(false);
      store.setCountLoading(false);
      store.setPersonas([]);
      store.setCount(0);
      return;
    }

    // Clear store if switched workspace
    if (previousWorkspaceId.current && previousWorkspaceId.current !== currentWorkspaceId) {
      store.setPersonas(null);
      store.setCount(0);
      store.setPersonasLoading(true);
      store.setCountLoading(true);
    }

    previousWorkspaceId.current = currentWorkspaceId;

    fetchPersonas();
    fetchCount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWorkspaceId]);

  useEffect(() => {
    if (!currentWorkspaceId) return;
    const socket = io(SOCKET_URL, {
      transports: ["websocket"],
      auth: { token, workspaceId: currentWorkspaceId },
    });

    const handleCreated = (data: Persona & { workspace?: string }) => {
      if (data.workspace && data.workspace === currentWorkspaceId) {
        store.addPersonaToList(data);
        // Increment count optimistically
        store.setCount(store.count + 1);
      }
    };

    const handleUpdated = (data: Persona & { workspace?: string }) => {
      if (data.workspace && data.workspace === currentWorkspaceId) {
        store.updatePersonaInList(data);
      }
    };

    const handleDeleted = (data: { _id?: string; workspace?: string }) => {
      if (data.workspace && data.workspace === currentWorkspaceId && data._id) {
        store.removePersonaFromList(data._id);
        // Decrement count safely
        store.setCount(Math.max(0, store.count - 1));
      }
    };

    const handleBatchCreated = (data: { workspace?: string }) => {
      if (data.workspace && data.workspace === currentWorkspaceId) {
        // After a batch create, refresh full list to ensure we didn't miss any personas
        refetch();
      }
    };

    socket.on("persona:created", handleCreated);
    socket.on("persona:updated", handleUpdated);
    socket.on("persona:deleted", handleDeleted);
    socket.on("batchPersona:created", handleBatchCreated);

    return () => {
      socket.off("persona:created", handleCreated);
      socket.off("persona:updated", handleUpdated);
      socket.off("persona:deleted", handleDeleted);
      socket.off("batchPersona:created", handleBatchCreated);
      socket.disconnect();
    };
  }, [token, currentWorkspaceId, store]);

  // Get a single persona by ID
  const getPersonaById = async (id: string): Promise<Persona> => {
    if (!currentWorkspaceId) throw new Error("No workspace context");
    const res = await apiFetch(`/personas/${id}`, { token, workspaceId: currentWorkspaceId });
    if (res.status === 404) throw new Error("Not found");
    if (!res.ok) throw new Error("Failed to fetch persona");
    const persona = await res.json();
    store.updatePersonaInList(persona);
    return persona;
  };

  // Create a persona
  const createPersona = async (payload: PersonaPayload) => {
    if (!currentWorkspaceId) throw new Error("No workspace context");
    const res = await apiFetch('/personas', { token, workspaceId: currentWorkspaceId, init: { method: 'POST', body: JSON.stringify(payload) } });
    if (!res.ok) throw new Error("Failed to create persona");
    const persona = await res.json();
    store.addPersonaToList(persona);
    return persona;
  };

  // Update a persona
  const updatePersona = async (id: string, payload: PersonaPayload) => {
    if (!currentWorkspaceId) throw new Error("No workspace context");
    const res = await apiFetch(`/personas/${id}`, { token, workspaceId: currentWorkspaceId, init: { method: 'PATCH', body: JSON.stringify(payload) } });
    if (!res.ok) throw new Error("Failed to update persona");
    const persona = await res.json();
    store.updatePersonaInList(persona);
    return persona;
  };

  // Delete a persona
  const deletePersona = async (id: string) => {
    if (!currentWorkspaceId) throw new Error("No workspace context");
    const res = await apiFetch(`/personas/${id}`, { token, workspaceId: currentWorkspaceId, init: { method: 'DELETE' } });
    if (!res.ok) throw new Error("Failed to delete persona");
    store.removePersonaFromList(id);
    // Decrement count just like the socket handler would
    store.setCount(Math.max(0, store.count - 1));
    return res.json();
  };

  // Stop (cancel) a persona that is currently being created
  const stopPersonaCreation = async (id: string) => {
    if (!currentWorkspaceId) throw new Error("No workspace context");
    const res = await apiFetch(`/personas/${id}/stop`, { token, workspaceId: currentWorkspaceId, init: { method: 'POST' } });
    if (!res.ok) throw new Error("Failed to stop persona creation");
    // Treat as deletion locally
    store.removePersonaFromList(id);
    store.setCount(Math.max(0, store.count - 1));
    return res.json();
  };

  // Upload a document (PDF, DOCX, CSV) to extract personas in bulk
  const uploadPersonaDocument = async (file: File) => {
    if (!currentWorkspaceId) throw new Error("No workspace context");

    const formData = new FormData();
    formData.append("file", file);

    const res = await apiFetch('/personas/upload-doc', { token, workspaceId: currentWorkspaceId, init: { method: 'POST', body: formData } });
    // Browser sets correct content-type for FormData

    if (!res.ok) {
      // Surface server error text if available
      const errorText = await res.text();
      throw new Error(errorText || "Failed to upload document");
    }

    const data: { created: Persona[]; errors: unknown[] } = await res.json();

    if (Array.isArray(data.created) && data.created.length > 0) {
      // Optimistically add the newly created personas to the store
      store.addPersonasToList(data.created);
    }

    return data;
  };

  return {
    personas: store.personas,
    personasError: store.personasError,
    personasLoading: store.personasLoading,
    count: store.count,
    countError: store.countError,
    countLoading: store.countLoading,
    createPersona,
    updatePersona,
    deletePersona,
    stopPersonaCreation,
    getPersonaById,
    refetch,
    uploadPersonaDocument,
    hasWorkspaceContext: !!currentWorkspaceId,
  };
} 