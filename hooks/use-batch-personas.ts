import { useAuth } from "@/lib/auth";
import { useEffect } from "react";
import io from "socket.io-client";
import { useBatchPersonasStore } from "@/lib/store/batchPersonas";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "https://backend.shamp.io";

export interface Persona {
  _id: string;
  name: string;
  description: string;
  // Add other persona fields as needed
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

const fetcher = (url: string, token: string) =>
  fetch(`${API_BASE}${url}`, {
    credentials: "include",
    headers: { Authorization: `Bearer ${token}` },
  }).then(res => {
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
  });

export function useBatchPersonas(enabled: boolean = true) {
  const { token } = useAuth();
  const store = useBatchPersonasStore();

  useEffect(() => {
    if (!enabled) return;
    if (!token) return;
    // Inline the fetch logic to avoid dependency on fetchBatchPersonas
    (async () => {
    store.setBatchPersonasLoading(true);
    store.setBatchPersonasError(null);
    try {
      const data = await fetcher("/batchpersonas", token);
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
  }, [token, enabled]);

  useEffect(() => {
    if (!enabled) return;
    if (!token) return;
    const socket = io(SOCKET_URL, {
      transports: ["websocket"],
      auth: { token },
    });
    // Inline the fetch logic for socket events
    const handleUpdate = async () => {
      store.setBatchPersonasLoading(true);
      store.setBatchPersonasError(null);
      try {
        const data = await fetcher("/batchpersonas", token);
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
    };
    socket.on("batchPersona:created", handleUpdate);
    socket.on("batchPersona:deleted", handleUpdate);
    socket.on("batchPersona:updated", (updated: BatchPersona) => {
      store.updateBatchPersonaInList(updated);
    });
    return () => {
      socket.off("batchPersona:created", handleUpdate);
      socket.off("batchPersona:deleted", handleUpdate);
      socket.off("batchPersona:updated", () => {});
      socket.disconnect();
    };
  }, [token, enabled]);

  const getBatchPersonaById = async (id: string): Promise<BatchPersona> => {
    if (!token) throw new Error("Not authenticated");
    const res = await fetch(`${API_BASE}/batchpersonas/${id}`, {
      credentials: "include",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to fetch batch persona");
    return res.json();
  };

  const createBatchPersona = async (payload: BatchPersonaPayload) => {
    if (!token) throw new Error("Not authenticated");
    const res = await fetch(`${API_BASE}/batchpersonas`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to create batch persona");
    return res.json();
  };

  const deleteBatchPersona = async (id: string) => {
    if (!token) throw new Error("Not authenticated");
    const res = await fetch(`${API_BASE}/batchpersonas/${id}`, {
      method: "DELETE",
      credentials: "include",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to delete batch persona");
    return res.json();
  };

  const updateBatchPersonaName = async (id: string, name: string): Promise<BatchPersona> => {
    if (!token) throw new Error("Not authenticated");
    const res = await fetch(`${API_BASE}/batchpersonas/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
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
    updateBatchPersonaName,
  };
} 