import React, { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogOverlay, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PlayIcon, PauseIcon, RotateCcw, RotateCw } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  runId: string;
  avatarUrl?: string;
  personaName?: string;
}

const rates = [1, 1.25, 1.5, 2];

export default function NarrationModal({ open, onOpenChange, runId, avatarUrl, personaName }: Props) {
  const { token, currentWorkspaceId } = useAuth();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioReady, setAudioReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [rateIdx, setRateIdx] = useState(0);
  const [imgLoaded, setImgLoaded] = useState(false);

  // Load audio once modal opens
  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    const fetchAudio = async () => {
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      if (currentWorkspaceId) headers["X-Workspace-ID"] = currentWorkspaceId;
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "";
      const res = await fetch(`${API_BASE}/tts/testrun/${runId}`, {
        method: "POST",
        headers,
        credentials: "include",
      });
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.addEventListener("loadedmetadata", () => {
        if (cancelled) return;
        setDuration(audio.duration);
        setAudioReady(true);
      });
      audio.addEventListener("timeupdate", () => {
        if (cancelled) return;
        setCurrent(audio.currentTime);
      });
      audio.addEventListener("ended", () => {
        setPlaying(false);
      });
    };

    fetchAudio();
    return () => {
      cancelled = true;
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, [open, runId, token, currentWorkspaceId]);

  const togglePlay = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) {
      a.pause();
      setPlaying(false);
    } else {
      a.play();
      setPlaying(true);
    }
  };

  const skip = (seconds: number) => {
    const a = audioRef.current;
    if (!a) return;
    a.currentTime = Math.min(Math.max(0, a.currentTime + seconds), duration);
  };

  const changeRate = () => {
    const next = (rateIdx + 1) % rates.length;
    setRateIdx(next);
    if (audioRef.current) audioRef.current.playbackRate = rates[next];
  };

  const fmt = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(1, "0");
    const sec = Math.floor(s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogOverlay className="bg-black/50 fixed inset-0" />
      <DialogContent className="rounded-xl max-w-sm w-full bg-card p-6 flex flex-col items-center gap-4">
        {/* Visually hidden title for accessibility */}
        <DialogHeader>
          <DialogTitle className="sr-only">Narration</DialogTitle>
        </DialogHeader>
        <Avatar className="size-24 mx-auto relative">
          {!imgLoaded && avatarUrl && <Skeleton className="absolute inset-0 rounded-full size-24" />}
          {avatarUrl ? (
            <AvatarImage
              src={avatarUrl}
              alt={personaName || "avatar"}
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgLoaded(true)}
            />
          ) : (
            <AvatarFallback>{personaName?.charAt(0)}</AvatarFallback>
          )}
        </Avatar>
        {/* Controls */}
        {audioReady ? (
          <section className="flex flex-col gap-4 w-full items-center">
            <section className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => skip(-10)} aria-label="Back 10s">
                <RotateCcw className="w-6 h-6" /><span className="sr-only">Back</span>
              </Button>
              <Button variant="ghost" size="icon" onClick={togglePlay} aria-label="Play/Pause">
                {playing ? <PauseIcon className="w-8 h-8" /> : <PlayIcon className="w-8 h-8" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={() => skip(10)} aria-label="Forward 10s">
                <RotateCw className="w-6 h-6" /><span className="sr-only">Forward</span>
              </Button>
            </section>
            <input type="range" min={0} max={duration} step={0.1} value={current} onChange={(e)=>{
              const a=audioRef.current; if(a)a.currentTime=Number(e.target.value);
            }} className="w-full" />
            <section className="flex justify-between w-full text-xs text-muted-foreground">
              <span>{fmt(current)}</span>
              <button onClick={changeRate}>{rates[rateIdx]}x</button>
              <span>{fmt(duration)}</span>
            </section>
          </section>
        ) : (
          <p className="text-sm">Loading audio…</p>
        )}
      </DialogContent>
    </Dialog>
  );
} 