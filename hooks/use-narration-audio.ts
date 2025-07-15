import { useState, useRef, useCallback, useEffect } from 'react';
import { useAuth } from '@/lib/auth';

export function useNarrationAudio(runId: string) {
  const { token, currentWorkspaceId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const blobUrlRef = useRef<string | null>(null);

  // Clean up object URL on unmount
  useEffect(() => {
    return () => {
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
      audioRef.current?.pause();
    };
  }, []);

  const fetchAudio = useCallback(async () => {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (currentWorkspaceId) headers['X-Workspace-Id'] = currentWorkspaceId;

    const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '';
    const res = await fetch(`${API_BASE}/tts/testrun/${runId}`, {
      method: 'POST',
      headers,
      credentials: 'include',
    });
    if (!res.ok) {
      throw new Error(await res.text());
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    blobUrlRef.current = url;
    audioRef.current = new Audio(url);
    // Reset state when playback ends
    audioRef.current.addEventListener('ended', () => setPlaying(false));
  }, [runId, token, currentWorkspaceId]);

  const toggle = useCallback(async () => {
    if (playing) {
      audioRef.current?.pause();
      setPlaying(false);
      return;
    }
    setLoading(true);
    try {
      if (!audioRef.current) {
        await fetchAudio();
      }
      if (!audioRef.current) throw new Error('Audio element not ready');
      await audioRef.current.play();
      setPlaying(true);
    } catch (err) {
      console.error('Narration playback error:', err);
      // Bubble up or toast in caller if desired
    } finally {
      setLoading(false);
    }
  }, [playing, fetchAudio]);

  return { playing, loading, toggle };
} 