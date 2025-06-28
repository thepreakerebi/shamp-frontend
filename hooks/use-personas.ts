import { useAuth, type User } from "@/lib/auth";
import { useEffect, useCallback } from "react";
import io from "socket.io-client";
import { usePersonasStore } from "@/lib/store/personas";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "https://shamp.onrender.com";

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

const fetcher = (url: string, token: string) =>
  fetch(`${API_BASE}${url}`, {
    credentials: "include",
    headers: { Authorization: `Bearer ${token}` },
  }).then(res => {
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
  });

export function usePersonas() {
  const { token } = useAuth();
  const store = usePersonasStore();

  const fetchPersonas = useCallback(async () => {
    if (!token) {
      store.setPersonasLoading(false);
      store.setPersonas([]);
      return;
    }
    store.setPersonasLoading(true);
    store.setPersonasError(null);
    try {
      const data = await fetcher("/personas", token);
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
  }, [token, store]);

  const fetchCount = useCallback(async () => {
    if (!token) {
      store.setCountLoading(false);
      store.setCount(0);
      return;
    }
    store.setCountLoading(true);
    store.setCountError(null);
    try {
      const data = await fetcher("/personas/count", token);
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
  }, [token, store]);

  // Refetch both personas and count
  const refetch = useCallback(() => {
    fetchPersonas();
    fetchCount();
  }, [fetchPersonas, fetchCount]);

  useEffect(() => {
    if (!token) return;
    fetchPersonas();
    fetchCount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (!token) return;
    const socket = io(SOCKET_URL, {
      transports: ["websocket"],
      auth: { token },
    });
    const handleUpdate = () => {
      refetch();
    };
    socket.on("persona:created", handleUpdate);
    socket.on("persona:deleted", handleUpdate);
    socket.on("persona:updated", handleUpdate);
    return () => {
      socket.off("persona:created", handleUpdate);
      socket.off("persona:deleted", handleUpdate);
      socket.off("persona:updated", handleUpdate);
      socket.disconnect();
    };
  }, [refetch, token]);

  // Get a single persona by ID
  const getPersonaById = async (id: string): Promise<Persona> => {
    if (!token) throw new Error("Not authenticated");
    const res = await fetch(`${API_BASE}/personas/${id}`, {
      credentials: "include",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 404) throw new Error("Not found");
    if (!res.ok) throw new Error("Failed to fetch persona");
    const persona = await res.json();
    store.updatePersonaInList(persona);
    return persona;
  };

  // Create a persona
  const createPersona = async (payload: PersonaPayload) => {
    if (!token) throw new Error("Not authenticated");
    const res = await fetch(`${API_BASE}/personas`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to create persona");
    const persona = await res.json();
    store.addPersonaToList(persona);
    return persona;
  };

  // Update a persona
  const updatePersona = async (id: string, payload: PersonaPayload) => {
    if (!token) throw new Error("Not authenticated");
    const res = await fetch(`${API_BASE}/personas/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to update persona");
    const persona = await res.json();
    store.updatePersonaInList(persona);
    return persona;
  };

  // Delete a persona
  const deletePersona = async (id: string) => {
    if (!token) throw new Error("Not authenticated");
    const res = await fetch(`${API_BASE}/personas/${id}`, {
      method: "DELETE",
      credentials: "include",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to delete persona");
    store.removePersonaFromList(id);
    return res.json();
  };

  // Upload a document (PDF, DOCX, CSV) to extract personas in bulk
  const uploadPersonaDocument = async (file: File) => {
    if (!token) throw new Error("Not authenticated");

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${API_BASE}/personas/upload-doc`, {
      method: "POST",
      credentials: "include",
      headers: {
        Authorization: `Bearer ${token}`,
        // NOTE: Do NOT set Content-Type when sending FormData, the browser will set the correct boundary
      } as Record<string, string>,
      body: formData,
    });

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
    getPersonaById,
    refetch,
    uploadPersonaDocument,
  };
} 