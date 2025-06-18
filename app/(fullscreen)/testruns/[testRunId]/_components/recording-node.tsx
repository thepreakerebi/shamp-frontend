"use client";
import { NodeProps } from "reactflow";
import { useState } from "react";

interface RecordingData {
  url?: string | null;
}

export default function RecordingNode({ data }: NodeProps<RecordingData>) {
  const [loaded, setLoaded] = useState(false);
  const hasVideo = !!data.url;

  return (
    <section className="flex flex-col items-center justify-center max-w-[420px] border rounded-lg bg-card shadow relative">
      {!hasVideo && (
        <div className="w-full h-48 flex items-center justify-center text-muted-foreground text-sm bg-muted rounded-lg">
          No recording yet
        </div>
      )}
      {hasVideo && (
        <video
          src={data.url!}
          controls
          onLoadedData={() => setLoaded(true)}
          className="w-full rounded-lg"
        />
      )}
      {!loaded && hasVideo && (
        <div className="w-full h-48 animate-pulse bg-muted absolute inset-0 rounded-lg" />
      )}
    </section>
  );
} 