import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/lib/auth";

let API_BASE = process.env.NEXT_PUBLIC_API_BASE || "";
if (API_BASE.endsWith("/")) API_BASE = API_BASE.slice(0, -1);

export function useBackendPolling<T>(path: string, interval = 5000) {
  const { token } = useAuth();
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const timer = useRef<NodeJS.Timeout | null>(null);

  const fetchData = async () => {
    if (!token) return;
    setIsLoading(data === null); // Only show loading on first load
    try {
      // Ensure no double slashes
      const url = `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
      const res = await fetch(url, {
        credentials: "include",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Error: ${res.status}`);
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchData();
    timer.current = setInterval(fetchData, interval);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, path, interval]);

  return { data, error, isLoading };
} 