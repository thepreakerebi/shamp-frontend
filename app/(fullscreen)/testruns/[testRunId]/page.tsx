"use client";
import { useParams, notFound } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { useTestRuns, TestRunStatus } from "@/hooks/use-testruns";
import dynamic from "next/dynamic";
import StepNode from "./_components/step-node";
import RecordingNode from "./_components/recording-node";
import { SummaryPanel } from "./_components/summary-panel";
import { ChatPanel } from "./_components/chat-panel";
import SummaryPanelContentSkeleton from "./_components/summary-panel-content-skeleton";
import ChatPanelContentSkeleton from "./_components/chat-panel-content-skeleton";
import { TestRunToolbar } from "./_components/test-run-toolbar";

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
  const { getTestRunStatus, testRuns } = useTestRuns();
  const [personaName, setPersonaName] = useState<string | undefined>();
  const [nodes, setNodes] = useState<Node[]>([]);
  const [run, setRun] = useState<TestRunStatus | null>(null);
  const [fetchError, setFetchError] = useState(false);

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

    // Compute center X based on step nodes
    const centerX = built.length
      ? built[0].position.x + ((built[built.length - 1].position.x - built[0].position.x) / 2)
      : 0;

    // Add recording node below with gap, centered
    const recPosY = 800;
    const recNode: Node = {
      id: "recording",
      type: "recording",
      position: { x: centerX, y: recPosY },
      data: {
        url: run.recordings?.[0]?.url?.trim() ?? null,
        testRunId,
      },
    };
    setNodes([...built, recNode]);
  };

  useEffect(() => {
    if (!testRunId) return;
    // Fetch only if we haven't loaded this run yet
    if (run) return;

    (async () => {
      try {
        const fetched = await getTestRunStatus(testRunId);
        const pn = (fetched as { personaName?: string }).personaName;
        setPersonaName(pn);
        setRun(fetched as TestRunStatus);
        buildNodes(fetched as TestRunStatus);
      } catch {
        setFetchError(true);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testRunId, run]);

  // Memoised live run from store
  const liveRun = useMemo(() => {
    if (!testRunId) return null;
    return (testRuns ?? []).find(r => r._id === testRunId) as TestRunStatus | undefined;
  }, [testRuns, testRunId]);

  // When liveRun.stepsWithScreenshots grows, rebuild nodes
  useEffect(() => {
    if (!liveRun || !liveRun.stepsWithScreenshots) return;
    if (!run) return; // initial run not set yet
    buildNodes(liveRun);
    setRun(liveRun);
  }, [liveRun?.stepsWithScreenshots?.length]);

  if (fetchError) {
    notFound();
    return null;
  }

  return (
    <section className="grid grid-cols-[320px_1fr_360px] h-screen w-full">
      {/* Left summary panel */}
      {run ? (
        <SummaryPanel run={run} personaName={personaName} />
      ) : (
        <SummaryPanelContentSkeleton />
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

      {/* Right chat panel */}
      {run ? (
        <ChatPanel run={run} personaName={personaName} />
      ) : (
        <ChatPanelContentSkeleton />
      )}

      {/* Bottom toolbar */}
      {run && <TestRunToolbar run={run} />}
    </section>
  );
} 