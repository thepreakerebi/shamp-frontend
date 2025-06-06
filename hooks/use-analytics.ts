import { useAuth } from '@/lib/auth';
import { useState, useEffect } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

export function useAnalytics<T = unknown>(endpoint: string) {
  const { token } = useAuth();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    setError(null);
    fetch(`${API_BASE}${endpoint}`, {
      credentials: 'include',
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to fetch analytics');
        setData(await res.json());
      })
      .catch(() => setError('Could not load analytics'))
      .finally(() => setLoading(false));
  }, [token, endpoint]);

  return { data, loading, error };
} 