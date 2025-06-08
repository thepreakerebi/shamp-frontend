import { useAuth } from "@/lib/auth";
import { useEffect, useState, useCallback } from "react";
import io from "socket.io-client";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000";

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
  diversity?: string;
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

export function useBatchPersonas() {
  const { token } = useAuth();
  const [batchPersonas, setBatchPersonas] = useState<BatchPersona[] | null>(null);
  const [batchPersonasLoading, setBatchPersonasLoading] = useState(true);
  const [batchPersonasError, setBatchPersonasError] = useState<string | null>(null);

  const fetchBatchPersonas = useCallback(async () => {
    if (!token) return;
    setBatchPersonasLoading(true);
    setBatchPersonasError(null);
    try {
      const data = await fetcher("/batchpersonas", token);
      setBatchPersonas(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setBatchPersonasError(err.message);
      } else {
        setBatchPersonasError("Failed to fetch batch personas");
      }
    } finally {
      setBatchPersonasLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    fetchBatchPersonas();
  }, [token, fetchBatchPersonas]);

  useEffect(() => {
    if (!token) return;
    const socket = io(SOCKET_URL, {
      transports: ["websocket"],
      auth: { token },
    });
    const handleUpdate = () => {
      fetchBatchPersonas();
    };
    socket.on("batchPersona:created", handleUpdate);
    socket.on("batchPersona:deleted", handleUpdate);
    return () => {
      socket.off("batchPersona:created", handleUpdate);
      socket.off("batchPersona:deleted", handleUpdate);
      socket.disconnect();
    };
  }, [fetchBatchPersonas, token]);

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

  return {
    batchPersonas,
    batchPersonasError,
    batchPersonasLoading,
    getBatchPersonaById,
    createBatchPersona,
    deleteBatchPersona,
    refetch: fetchBatchPersonas,
  };
} 