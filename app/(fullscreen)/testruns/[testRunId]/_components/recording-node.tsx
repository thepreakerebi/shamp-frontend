"use client";
import { NodeProps } from "reactflow";
import { useState } from "react";

interface RecordingData {
  url?: string | null;
}

export default function RecordingNode({ data }: NodeProps<RecordingData>) {
  const [loaded, setLoaded] = useState(false);
  const videoUrl = data.url?.trim();
  const hasVideo = !!videoUrl;

  // Helper to set loaded from multiple events
  const handleLoaded = () => {
    setLoaded(true);
  };

  return (
    <section className="flex flex-col items-center justify-center max-w-[420px] border rounded-lg bg-card shadow relative">
      {!hasVideo && (
        <div className="w-full h-48 flex items-center justify-center text-muted-foreground text-sm bg-muted rounded-lg">
          No recording yet
        </div>
      )}
      {hasVideo && (
        <video
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