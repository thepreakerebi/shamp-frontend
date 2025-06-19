"use client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useTestRuns, TestRunStatus } from "@/hooks/use-testruns";
import dynamic from "next/dynamic";
import StepNode from "./_components/step-node";
import RecordingNode from "./_components/recording-node";
import { SummaryPanel } from "./_components/summary-panel";

// Dynamic React Flow components (SSR disabled)
const ReactFlow = dynamic(() => import("reactflow").then(m => m.ReactFlow), { ssr: false });
const Background = dynamic(() => import("reactflow").then(m => m.Background), { ssr: false });
// const Controls = dynamic(() => import("reactflow").then(m => m.Controls), { ssr: false });

import type { Node } from "reactflow";

// Keep nodeTypes stable across renders to avoid React Flow warning #002
const nodeTypes = {
  step: StepNode,
  recording: RecordingNode,
};

export default function TestRunCanvasPage() {
  const { testRunId } = useParams<{ testRunId: string }>();
  const { getTestRunStatus } = useTestRuns();
  const [personaName, setPersonaName] = useState<string | undefined>();
  const [nodes, setNodes] = useState<Node[]>([]);
  const [run, setRun] = useState<TestRunStatus | null>(null);

  // Map run.stepsWithScreenshots to React Flow nodes
  const buildNodes = (run: TestRunStatus) => {
    const steps = (run.stepsWithScreenshots ?? []).slice(1); // skip first step
    const baseX = 0;
    const spacing = 320; // px between nodes horizontally
    const built: Node[] = steps.map((s, idx) => ({
      id: `step-${idx}`,
      type: "step",
      position: { x: baseX + idx * spacing, y: 0 },
      data: {
        screenshot: s.screenshot,
        description: (s.step as Record<string, unknown>)?.evaluation_previous_goal as string ?? "",
        nextGoal: (s.step as Record<string, unknown>)?.next_goal as string ?? "",
      },
    }));
    // Add recording node below with gap
    const recPosY = 400;
    const recNode: Node = {
      id: "recording",
      type: "recording",
      position: { x: 0, y: recPosY },
      data: {
        url: run.recordings?.[0]?.url?.trim() ?? null,
        testRunId,
      },
    };
    setNodes([...built, recNode]);
  };

  useEffect(() => {
    (async () => {
      if (!testRunId) return;
      try {
        const run = await getTestRunStatus(testRunId);
        const pn = (run as { personaName?: string }).personaName;
        setPersonaName(pn);
        setRun(run as TestRunStatus);
        buildNodes(run as TestRunStatus);
      } catch {
        /* ignore */
      }
    })();
  }, [testRunId, getTestRunStatus]);

  return (
    <section className="grid grid-cols-[320px_1fr_360px] h-screen w-full">
      {/* Left summary panel */}
      {run && (
        <SummaryPanel run={run} personaName={personaName} />
      )}

      {/* Center canvas */}
      <section className="relative overflow-hidden">
        {/* Only render React Flow on client */}
        {ReactFlow && (
          <ReactFlow
            nodes={nodes}
            nodeTypes={nodeTypes}
            fitView
            proOptions={{ hideAttribution: true }}
            panOnScroll
            zoomOnScroll={false}
            minZoom={0.05}
            maxZoom={4}
          >
            {/* <Controls /> */}
            <Background />
          </ReactFlow>
        )}
      </section>

      {/* Right chat panel placeholder */}
      <aside className="border-l overflow-auto p-4">
        <h2 className="text-lg font-semibold mb-2">Chat</h2>
        <p className="text-sm text-muted-foreground">Coming soon…</p>
      </aside>
    </section>
  );
} 