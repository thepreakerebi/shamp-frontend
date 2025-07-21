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

    // Grid layout: 5 columns per row
    const COLS = 5;
    const COL_SPACING = 320; // px horizontally
    const ROW_SPACING = 360; // px vertically between step rows

    const built: Node[] = steps.map((s, idx) => {
      const col = idx % COLS;
      const row = Math.floor(idx / COLS);
      return {
        id: `step-${idx}`,
        type: "step",
        position: { x: col * COL_SPACING, y: row * ROW_SPACING },
        data: {
          screenshot: s.screenshot,
          description: (s.step as Record<string, unknown>)?.evaluation_previous_goal as string ?? "",
          nextGoal: (s.step as Record<string, unknown>)?.next_goal as string ?? "",
        },
      } as Node;
    });

    // If no steps yet and run still in progress, add a placeholder node
    const runInProgress = !['finished','stopped','cancelled'].includes((run.browserUseStatus ?? '').toLowerCase());
    if (built.length === 0 && runInProgress) {
      built.push({
        id: 'placeholder',
        type: 'step',
        position: { x: 0, y: 0 },
        data: { placeholder: true },
      });
    }

    // Determine bounding box of steps to center recording node
    let centerX = 0;
    if (built.length) {
      const xs = built.map(n => n.position.x);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      centerX = minX + (maxX - minX) / 2;
    }

    // Recording node Y: one extra row below last step row plus margin
    const totalRows = Math.ceil(built.length / COLS);
    const recPosY = totalRows * ROW_SPACING + 200;

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

  // When liveRun updates with new steps or recordings, rebuild nodes
  useEffect(() => {
    if (!liveRun) return;
    if (!run) return; // initial run not set yet
    const stepsLen = liveRun.stepsWithScreenshots?.length ?? 0;
    const recLen = liveRun.recordings?.length ?? 0;
    const prevStepsLen = run.stepsWithScreenshots?.length ?? 0;
    const prevRecLen = run.recordings?.length ?? 0;
    if (stepsLen !== prevStepsLen || recLen !== prevRecLen) {
      buildNodes(liveRun);
      setRun(prev => {
        if (!prev) return liveRun;
        return {
          ...prev,
          ...liveRun,
          analysis: liveRun.analysis ?? prev.analysis,
          browserUseOutput: liveRun.browserUseOutput ?? prev.browserUseOutput,
        } as TestRunStatus;
      });
    }
  }, [liveRun?.stepsWithScreenshots?.length, liveRun?.recordings?.length]);

  if (fetchError) {
    notFound();
    return null;
  }

  return (
    <>
      {/* Mobile notice */}
      <section className="flex md:hidden flex-col items-center justify-center text-center p-6 gap-4 h-screen w-full">
        <h1 className="text-xl font-semibold">Test run view unavailable on mobile</h1>
        <p className="text-sm text-muted-foreground max-w-sm">The interactive canvas, summary, and chat require a larger screen. Please open this page on a desktop or tablet to view the full test run details.</p>
      </section>

      {/* Desktop canvas */}
      <section className="hidden md:grid grid-cols-[320px_1fr_360px] h-screen w-full">
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
    </>
  );
} 