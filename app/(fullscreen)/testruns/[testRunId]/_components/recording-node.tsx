"use client";
import { NodeProps } from "reactflow";
import { useState, useRef, useEffect } from "react";
import { PlayIcon, PauseIcon, MaximizeIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { useTestRuns } from "@/hooks/use-testruns";

interface RecordingData {
  url?: string | null;
  testRunId?: string;
}

export default function RecordingNode({ data }: NodeProps<RecordingData>) {
  const START_OFFSET = 11;
  const [loaded, setLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(data.url?.trim() || null);
  const hasVideo = !!videoUrl;
  const { token, currentWorkspaceId } = useAuth();
  const { testRuns } = useTestRuns();

  const browserStopped = (() => {
    if (!data.testRunId) return false;
    const run = (testRuns ?? []).find(r => r._id === data.testRunId);
    return run?.browserUseStatus === 'stopped';
  })();

  const statusCancelled = (() => {
    if (!data.testRunId) return false;
    const run = (testRuns ?? []).find(r => r._id === data.testRunId);
    return run?.status === 'cancelled';
  })();

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

  // On mount or when URL missing, attempt to fetch media once
  useEffect(() => {
    const maybeFetchMedia = async () => {
      if (hasVideo || !data.testRunId) return;
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE;
      const headers: Record<string,string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      if (currentWorkspaceId) headers["X-Workspace-ID"] = currentWorkspaceId;
      try {
        const res = await fetch(`${API_BASE}/testruns/${data.testRunId}/media`, {
          credentials: "include",
          headers,
        });
        if (res.ok) {
          const arr = (await res.json()) as (string | { url: string })[];
          const first = arr[0];
          const newUrl = typeof first === 'string' ? first : first?.url;
          if (newUrl) setVideoUrl(newUrl.trim());
        }
      } catch {}
    };

    maybeFetchMedia();
  }, [hasVideo, data.testRunId, token, currentWorkspaceId]);

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
        const headers: Record<string,string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;
        if (currentWorkspaceId) headers["X-Workspace-ID"] = currentWorkspaceId;

        const res = await fetch(`${API_BASE}/testruns/${data.testRunId}/media`, {
          credentials: "include",
          headers,
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
  }, [hasVideo, data.testRunId, videoUrl, token, currentWorkspaceId]);

  // Seek to 10-second mark once metadata is available so playback starts at 00:10
  useEffect(() => {
    if (!hasVideo) return;
    const vid = videoRef.current;
    if (!vid) return;

    const seek = () => {
      try {
        if (vid.duration && vid.duration > START_OFFSET) {
          vid.currentTime = START_OFFSET;
        }
      } catch {/* ignore seek failures */}
    };

    if (vid.readyState >= 1) seek();
    vid.addEventListener('loadedmetadata', seek);
    return () => vid.removeEventListener('loadedmetadata', seek);
  }, [hasVideo, videoUrl]);

  // Prevent viewing final 9 seconds: pause and clamp playback position
  const [cutOff, setCutOff] = useState<number | null>(null);

  // Determine cutoff once metadata is available
  useEffect(() => {
    if (!hasVideo) return;
    const vid = videoRef.current;
    if (!vid) return;

    const computeCutOff = () => {
      if (vid.duration && vid.duration > 11) {
        setCutOff(Math.max(0, vid.duration - 11));
      }
    };

    if (vid.readyState >= 1) computeCutOff();
    vid.addEventListener('loadedmetadata', computeCutOff);
    return () => vid.removeEventListener('loadedmetadata', computeCutOff);
  }, [hasVideo, videoUrl]);

  // Enforce cutoff during playback and seeking
  useEffect(() => {
    if (cutOff === null) return;
    const vid = videoRef.current;
    if (!vid) return;

    const clampTime = () => {
      if (vid.currentTime < START_OFFSET) {
        vid.currentTime = START_OFFSET;
      } else if (vid.currentTime >= cutOff) {
        vid.currentTime = cutOff;
        vid.pause();
      }
    };

    const handleSeeking = () => {
      if (vid.currentTime < START_OFFSET) {
        vid.currentTime = START_OFFSET;
      } else if (vid.currentTime > cutOff - 0.1) {
        vid.currentTime = Math.max(START_OFFSET, cutOff - 0.1);
      }
    };

    vid.addEventListener('timeupdate', clampTime);
    vid.addEventListener('seeking', handleSeeking);
    return () => {
      vid.removeEventListener('timeupdate', clampTime);
      vid.removeEventListener('seeking', handleSeeking);
    };
  }, [cutOff]);

  return (
    <section className="flex flex-col items-center justify-center max-w-[420px] border rounded-lg bg-card shadow relative">
      { browserStopped && !hasVideo && !statusCancelled && (
        <div className="w-full h-48 flex items-center justify-center text-muted-foreground text-sm bg-muted rounded-lg text-center px-2">
          Refresh to see recording
        </div>
      )}
      {hasVideo && (
        <div className="relative w-full">
        <video
          ref={videoRef}
          src={videoUrl!}
          onLoadedData={handleLoaded}
          onLoadedMetadata={handleLoaded}
          onCanPlay={handleLoaded}
          className="w-full rounded-lg bg-black"
            playsInline
        />
          {/* Custom controls overlay */}
          <VideoControls videoRef={videoRef} startOffset={START_OFFSET} cutOff={cutOff} />
        </div>
      )}
      {!loaded && hasVideo && (
        <div className="w-full h-48 animate-pulse bg-muted absolute inset-0 rounded-lg" />
      )}
    </section>
  );
}

interface ControlsProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  startOffset: number;
  cutOff: number | null;
}

function VideoControls({ videoRef, startOffset, cutOff }: ControlsProps) {
  const [playing, setPlaying] = useState(false);
  const [currentRel, setCurrentRel] = useState(0); // seconds relative
  const [durationRel, setDurationRel] = useState(0);
  const rates = [1, 1.25, 1.5, 2];
  const [rateIndex, setRateIndex] = useState(0); // index into rates

  // Sync state from video events
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;

    const updateTime = () => {
      const rel = Math.max(0, vid.currentTime - startOffset);
      setCurrentRel(rel);
    };

    const updatePlay = () => setPlaying(!vid.paused);

    const updateDuration = () => {
      if (cutOff !== null) {
        setDurationRel(Math.max(0, cutOff - startOffset));
      }
    };

    updateDuration();
    vid.addEventListener("timeupdate", updateTime);
    vid.addEventListener("play", updatePlay);
    vid.addEventListener("pause", updatePlay);
    vid.addEventListener("loadedmetadata", updateDuration);
    return () => {
      vid.removeEventListener("timeupdate", updateTime);
      vid.removeEventListener("play", updatePlay);
      vid.removeEventListener("pause", updatePlay);
      vid.removeEventListener("loadedmetadata", updateDuration);
    };
  }, [videoRef, cutOff, startOffset]);

  const togglePlay = () => {
    const vid = videoRef.current;
    if (!vid) return;
    if (vid.paused) vid.play(); else vid.pause();
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vid = videoRef.current;
    if (!vid || cutOff === null) return;
    const rel = Number(e.target.value);
    vid.currentTime = startOffset + rel;
  };

  const changeRate = () => {
    const nextIndex = (rateIndex + 1) % rates.length;
    setRateIndex(nextIndex);
    const vid = videoRef.current;
    if (vid) vid.playbackRate = rates[nextIndex];
  };

  const enterFullscreen = () => {
    const vid = videoRef.current;
    if (!vid) return;
    if (vid.requestFullscreen) vid.requestFullscreen();
  };

  const fmt = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(1, "0");
    const sec = Math.floor(s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  return (
    <div className="absolute inset-x-0 bottom-0 bg-black/60 text-white flex items-center gap-2 px-2 py-1 text-xs">
      <Button variant="ghost" size="icon" onClick={togglePlay} className="text-white">
        {playing ? <PauseIcon className="w-4 h-4" /> : <PlayIcon className="w-4 h-4" />}
      </Button>
      <span>{fmt(currentRel)} / {fmt(durationRel)}</span>
      <input type="range" min={0} max={durationRel} step={0.1} value={currentRel} onChange={handleSeek} className="flex-1 mx-2" />
      <Button variant="ghost" size="icon" onClick={changeRate} className="text-white text-xs w-8">
        {rates[rateIndex]}x
      </Button>
      <Button variant="ghost" size="icon" onClick={enterFullscreen} className="text-white">
        <MaximizeIcon className="w-4 h-4" />
      </Button>
    </div>
  );
} 