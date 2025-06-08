import { useAuth, type User } from "@/lib/auth";
import { useEffect, useState, useCallback } from "react";
import io from "socket.io-client";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000";

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
  const [personas, setPersonas] = useState<Persona[] | null>(null);
  const [personasLoading, setPersonasLoading] = useState(true);
  const [personasError, setPersonasError] = useState<string | null>(null);
  const [count, setCount] = useState(0);
  const [countLoading, setCountLoading] = useState(true);
  const [countError, setCountError] = useState<string | null>(null);

  const fetchPersonas = useCallback(async () => {
    if (!token) return;
    setPersonasLoading(true);
    setPersonasError(null);
    try {
      const data = await fetcher("/personas", token);
      setPersonas(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setPersonasError(err.message);
      } else {
        setPersonasError("Failed to fetch personas");
      }
    } finally {
      setPersonasLoading(false);
    }
  }, [token]);

  const fetchCount = useCallback(async () => {
    if (!token) return;
    setCountLoading(true);
    setCountError(null);
    try {
      const data = await fetcher("/personas/count", token);
      setCount(data.count ?? 0);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setCountError(err.message);
      } else {
        setCountError("Failed to fetch persona count");
      }
    } finally {
      setCountLoading(false);
    }
  }, [token]);

  // Refetch both personas and count
  const refetch = useCallback(() => {
    fetchPersonas();
    fetchCount();
  }, [fetchPersonas, fetchCount]);

  useEffect(() => {
    if (!token) return;
    fetchPersonas();
    fetchCount();
  }, [token, fetchPersonas, fetchCount]);

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
    if (!res.ok) throw new Error("Failed to fetch persona");
    return res.json();
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
    return res.json();
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
    return res.json();
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
    return res.json();
  };

  return {
    personas,
    personasError,
    personasLoading,
    count,
    countError,
    countLoading,
    createPersona,
    updatePersona,
    deletePersona,
    getPersonaById,
    refetch,
  };
} 