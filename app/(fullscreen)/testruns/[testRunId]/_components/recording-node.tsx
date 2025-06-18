"use client";
import { NodeProps } from "reactflow";
import { useState, useRef, useEffect } from "react";

interface RecordingData {
  url?: string | null;
  testRunId?: string;
}

export default function RecordingNode({ data }: NodeProps<RecordingData>) {
  const [loaded, setLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(data.url?.trim() || null);
  const hasVideo = !!videoUrl;

  // Helper to set loaded from multiple events
  const handleLoaded = () => {
    setLoaded(true);
  };

  // Fallback: if onloaded events never fire (e.g. component remount with cached video),
  // mark as loaded once the browser reports readyState > 2 after a short delay.
  useEffect(() => {
    if (!hasVideo) return;
    const vid = videoRef.current;
    if (!vid) return;
    if (vid.readyState > 2) {
      setLoaded(true);
      return;
    }
    const id = setTimeout(() => {
      if (vid.readyState > 2) setLoaded(true);
    }, 1500);
    return () => clearTimeout(id);
  }, [videoUrl, hasVideo]);

  // Listen for stalled/error events and try to refresh media URL once
  useEffect(() => {
    if (!hasVideo || !data.testRunId) return;
    const vid = videoRef.current;
    if (!vid) return;

    let attemptedRefresh = false;

    const refreshSrc = async () => {
      if (attemptedRefresh) return;
      attemptedRefresh = true;
      try {
        const API_BASE = process.env.NEXT_PUBLIC_API_BASE;
        const res = await fetch(`${API_BASE}/testruns/${data.testRunId}/media`, {
          credentials: "include",
        });
        if (res.ok) {
          const arr = (await res.json()) as (string | { url: string })[];
          const first = arr[0];
          const newUrl = typeof first === 'string' ? first : first?.url;
          if (newUrl && newUrl !== videoUrl) {
            setVideoUrl(newUrl.trim());
          }
        }
      } catch {/* ignore */}
    };

    const onStalled = () => refreshSrc();
    const onError = () => refreshSrc();
    vid.addEventListener('stalled', onStalled);
    vid.addEventListener('error', onError);
    return () => {
      vid.removeEventListener('stalled', onStalled);
      vid.removeEventListener('error', onError);
    };
  }, [hasVideo, data.testRunId, videoUrl]);

  return (
    <section className="flex flex-col items-center justify-center max-w-[420px] border rounded-lg bg-card shadow relative">
      {!hasVideo && (
        <div className="w-full h-48 flex items-center justify-center text-muted-foreground text-sm bg-muted rounded-lg">
          No recording yet
        </div>
      )}
      {hasVideo && (
        <video
          ref={videoRef}
          src={videoUrl!}
          controls
          onLoadedData={handleLoaded}
          onLoadedMetadata={handleLoaded}
          onCanPlay={handleLoaded}
          className="w-full rounded-lg bg-black"
        />
      )}
      {!loaded && hasVideo && (
        <div className="w-full h-48 animate-pulse bg-muted absolute inset-0 rounded-lg" />
      )}
    </section>
  );
} 