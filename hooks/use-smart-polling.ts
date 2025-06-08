import { useEffect, useRef, useCallback, useState } from "react";

/**
 * useSmartPolling hook
 * @param fetcher - async function to fetch data. If you need authentication, use the token from useAuth and include it in the Authorization header.
 * @param interval - polling interval in ms (default: 2000)
 *
 * Example fetcher for authenticated endpoints:
 *   const { token } = useAuth();
 *   const fetcher = async () => {
 *     const res = await fetch("/api/endpoint", {
 *       credentials: "include",
 *       headers: token ? { Authorization: `Bearer ${token}` } : {},
 *     });
 *     if (!res.ok) throw new Error("Failed to fetch");
 *     return res.json();
 *   };
 */
export function useSmartPolling<T>(fetcher: () => Promise<T>, interval = 2000) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<NodeJS.Timeout | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetcher();
      setData(result);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Error fetching data");
      }
    } finally {
      setLoading(false);
    }
  }, [fetcher]);

  useEffect(() => {
    function startPolling() {
      fetchData();
      timer.current = setInterval(fetchData, interval);
    }
    function stopPolling() {
      if (timer.current) clearInterval(timer.current);
    }
    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        fetchData(); // Fetch immediately on return
        startPolling();
      } else {
        stopPolling();
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);
    if (document.visibilityState === "visible") {
      startPolling();
    }
    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchData, interval]);

  return { data, loading, error };
} 