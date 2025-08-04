"use client";
import { Test } from "@/hooks/use-tests";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ProjectBadge } from "@/components/ui/project-badge";
import { PersonaBadge } from "@/components/ui/persona-badge";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useTestRuns } from "@/hooks/use-testruns";
import { Loader2, CalendarClock, Laptop, Tablet as TabletIcon, Smartphone, FileImage, FileText } from "lucide-react";
import { toast } from "sonner";
import { RowActionsDropdown } from "../../_components/row-actions-dropdown";
import { useTests } from "@/hooks/use-tests";
import { useRouter } from "next/navigation";
import { useTestRunsStore } from "@/lib/store/testruns";
import { useTestsStore } from "@/lib/store/tests";
import { useBilling } from "@/hooks/use-billing";
import CheckDialog from "@/components/autumn/check-dialog";
import React from "react";

/**
 * DetailsSection
 * Displays key information about a usability test in a clean, grouped layout.
 * - Test name & description
 * - Project & persona badges
 * - Run statistics (successful / failed / total)
 */
export default function DetailsSection({ test }: { test: Test }) {
  const { startTestRun } = useTestRuns();
  const { moveTestToTrash, deleteTest, duplicateTest } = useTests();
  const [running, setRunning] = useState(false);
  const router = useRouter();

  // Billing info to gate scheduling feature
  const { summary, loading: billingLoading, allowed } = useBilling();
  const [showPaywallRun, setShowPaywallRun] = useState(false);

  const planName =
    summary?.products && Array.isArray(summary.products) && summary.products.length > 0
      ? (summary.products[0] as { name?: string; id?: string }).name ||
        (summary.products[0] as { id?: string }).id
      : "Free";

  const scheduleEnabled =
    billingLoading || !["free", "hobby"].includes((planName ?? "").toLowerCase());

  const getCreditsPreview = () => {
    const features: unknown = summary?.features;
    let feature: unknown;
    if (Array.isArray(features)) {
      feature = features.find((f) => (f as { feature_id: string }).feature_id === "credits");
    } else if (features && typeof features === "object") {
      feature = (features as Record<string, unknown>)["credits"];
    }
    const bal = (feature as { balance?: number })?.balance;
    const usageExhausted = typeof bal === "number" && bal < 1;

    const nextProduct = {
      id: "hobby",
      name: "Hobby Plan",
      is_add_on: false,
      free_trial: undefined,
    } as unknown as Record<string, unknown>;

    return {
      scenario: usageExhausted ? "usage_limit" : "feature_flag",
      feature_id: "credits",
      feature_name: "Credits",
      product_id: "hobby",
      products: [nextProduct],
    };
  };

  const handleRun = async () => {
    if (running) return;

    if (!allowed({ featureId: 'credits', requiredBalance: 1 })) {
      setShowPaywallRun(true);
      return;
    }
    setRunning(true);
    const popup = typeof window !== 'undefined' ? window.open('', '_blank') : null;
    if (popup) {
      popup.document.write(`<!DOCTYPE html><html><head><title>Starting test run…</title><style>html,body{height:100%;margin:0;display:flex;align-items:center;justify-content:center;font-family:sans-serif;color:#555}</style></head><body><p>Preparing test run…</p></body></html>`);
    }
    try {
      const { testRun } = await startTestRun(test._id);
      toast.success("Test run started");
      if (testRun && testRun._id) {
        if (popup) {
          popup.location.href = `/testruns/${testRun._id}`;
        } else {
          window.open(`/testruns/${testRun._id}`, '_blank');
        }
      } else if (popup) {
        popup.close();
      }
    } catch (err) {
      if (popup) popup.close();
      toast.error(err instanceof Error ? err.message : 'Failed to start test run');
    }
    setRunning(false);
  };

  const handleSchedule = () => {
    router.push(`/tests/${test._id}/schedule-run`);
  };

  const successfulRuns = "successfulRuns" in test ? (test as unknown as { successfulRuns?: number }).successfulRuns ?? 0 : 0;
  const failedRuns = "failedRuns" in test ? (test as unknown as { failedRuns?: number }).failedRuns ?? 0 : 0;

  const testRunsStore = useTestRunsStore(state => state.testRuns);
  const testsStore = useTestsStore();
  const runsSlice = testsStore.getTestRunsForTest(test._id);
  const { getTestRunsForTest } = useTests();
  const [loadingRuns, setLoadingRuns] = useState(false);

  // Determine if any run is currently running for this test
  const { isRunning, isPaused } = React.useMemo(() => {
    const list = testRunsStore?.filter(r => r.test === test._id) || [];
    return {
      isRunning: list.some(r => r.browserUseStatus === 'running'),
      isPaused: list.some(r => r.browserUseStatus === 'paused'),
    };
  }, [testRunsStore, test._id]);

  // Deliberately omit getTestRunsForTest from deps because its identity is
  // not stable across renders (defined inside a hook). Including it would
  // re-trigger the effect endlessly and cause a "maximum update depth"
  // error. The ESLint rule is disabled for this line.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (runsSlice === undefined && !loadingRuns) {
      (async () => {
        setLoadingRuns(true);
        try { await getTestRunsForTest(test._id, true); } catch {}
        setLoadingRuns(false);
      })();
    }
  }, [runsSlice, test._id, loadingRuns]);

  const totalRunsStore = runsSlice ? runsSlice.length : testRunsStore?.filter(r => r.test === test._id).length;

  const totalRuns = totalRunsStore !== undefined ? totalRunsStore : (loadingRuns ? 0 : ("totalRuns" in test ? (test as unknown as { totalRuns?: number }).totalRuns ?? successfulRuns + failedRuns : successfulRuns + failedRuns));

   
  const personaNames: string[] | undefined = (test as unknown as { personaNames?: string[] }).personaNames;
   
  const personasWithIds: Array<{ _id: string; name: string }> | undefined = (test as unknown as { personas?: Array<{ _id: string; name: string }> }).personas;

  // Determine device type from viewport
  const deviceType = (() => {
    const w = (test as unknown as { browserViewportWidth?: number }).browserViewportWidth;
    const h = (test as unknown as { browserViewportHeight?: number }).browserViewportHeight;
    if (!w || !h) return null;
    // Exact presets used by create/edit pages
    if (w === 1280 && h === 720) return "Desktop" as const;
    if (w === 820 && h === 1180) return "Tablet" as const;
    if (w === 800 && h === 1280) return "Mobile" as const;
    // Legacy presets
    if (w === 1280 && h === 960) return "Desktop" as const;
    if (w === 834 && h === 1112) return "Tablet" as const;
    if (w === 390 && h === 844) return "Mobile" as const;
    // Fallback based on width only
    if (w >= 1000) return "Desktop" as const;
    if (w >= 700) return "Tablet" as const;
    return "Mobile" as const;
  })();

  const showDeviceType = deviceType && !["free","hobby","hobby_annual"].includes((planName??"").toLowerCase());

  return (
    <article className="p-4 space-y-6" aria-labelledby="test-details-heading">
      {/* Header */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <section className="space-y-1 flex-1 min-w-0">
          <h2 id="test-details-heading" className="text-xl font-semibold leading-tight truncate">
            {test.name}
          </h2>
          {test.description && (
            <p className="text-sm text-muted-foreground max-w-prose line-clamp-2">
              {test.description}
            </p>
          )}
        </section>
        <section className="flex items-center gap-4 shrink-0">
          <RowActionsDropdown
            testId={test._id}
            testName={test.name}
            actions={{ moveTestToTrash, deleteTest, duplicateTest }}
            showOpen={false}
            showRun={false}
          />
          {scheduleEnabled && (
            <Button variant="outline" onClick={handleSchedule} className="flex items-center gap-1">
              <CalendarClock className="w-4 h-4" />
              Schedule run
            </Button>
          )}
          {isRunning ? (
            <Badge variant="secondary" className="px-2 py-1 text-xs bg-primary/10 text-primary-foreground dark:text-primary flex items-center gap-1">
              <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              running
            </Badge>
          ) : isPaused ? (
            <Badge variant="secondary" className="px-2 py-1 text-xs bg-yellow-400/20 text-yellow-700 dark:text-yellow-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
              paused
            </Badge>
          ) : (
            <Button onClick={handleRun} variant="secondary" disabled={running}>
              {running && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Run test
            </Button>
          )}
          {showPaywallRun && (
            /* @ts-expect-error preview partial */
            <CheckDialog open={showPaywallRun} setOpen={setShowPaywallRun} preview={getCreditsPreview()} />
          )}
        </section>
      </header>

      <Separator />

      {/* Project & Personas */}
      <section className="flex flex-col md:flex-row items-start gap-6">
        {/* Project */}
        <div className="space-y-2 w-full md:w-1/3">
          <h3 className="text-sm font-medium text-muted-foreground">Project</h3>
          {(() => {
            if (test.project && typeof test.project === "object" && "name" in test.project) {
              return (
                <ProjectBadge name={(test.project as { _id: string; name: string }).name} />
              );
            }
            return null;
          })()}
        </div>

        {/* Personas */}
        <div className="space-y-2 flex-1">
          <h3 className="text-sm font-medium text-muted-foreground">Personas</h3>
          <div className="flex flex-col gap-1">
            {personaNames && personaNames.length > 0 ? (
              // Ensure unique keys even if names repeat
              Array.from(new Set(personaNames)).map((name, idx) => (
                <PersonaBadge key={`${name}-${idx}`} name={name} />
              ))
            ) : personasWithIds && personasWithIds.length > 0 ? (
              personasWithIds.map((p, idx) => (
                <PersonaBadge key={`${p._id}-${idx}`} name={p.name} />
              ))
            ) : test.persona && typeof test.persona === "object" && "name" in test.persona ? (
              <PersonaBadge name={(test.persona as { _id: string; name: string }).name} />
            ) : (
              <span className="text-sm text-muted-foreground">–</span>
            )}
          </div>
        </div>

        {/* Device type */}
        {showDeviceType && (
          <div className="space-y-2 w-full md:w-1/3">
            <h3 className="text-sm font-medium text-muted-foreground">Device</h3>
            <Badge variant="secondary" className="flex items-center gap-1 px-2 py-1 text-sm bg-primary/10 text-primary-foreground dark:text-primary" aria-label={`Device type: ${deviceType}`}>
              {deviceType === "Desktop" && <Laptop className="w-4 h-4" />}
              {deviceType === "Tablet" && <TabletIcon className="w-4 h-4" />}
              {deviceType === "Mobile" && <Smartphone className="w-4 h-4" />}
              {deviceType}
            </Badge>
          </div>
        )}

        {/* Attachments */}
        {Array.isArray(test.files) && test.files.length > 0 && (
          <div className="space-y-2 w-full md:w-1/3">
            <h3 className="text-sm font-medium text-muted-foreground">Attachments</h3>
            <ul className="space-y-1 max-h-24 overflow-auto">
              {test.files.map((f, idx) => {
                const isImg = f.contentType?.startsWith("image/");
                const Icon = isImg ? FileImage : FileText;
                return (
                  <li key={idx} className="flex items-center gap-1 text-sm truncate">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{f.fileName}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </section>

      <Separator />

      {/* Run statistics */}
      <footer className="flex items-center gap-2 flex-wrap">
        <h3 className="sr-only">Run statistics</h3>
        <Badge
          variant="secondary"
          className="px-2 py-1 text-sm bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
          aria-label={`Successful runs: ${successfulRuns}`}
        >
          ✓ {successfulRuns} {successfulRuns === 1 ? "successful run" : "successful runs"}
        </Badge>
        <Badge
          variant="secondary"
          className="px-2 py-1 text-sm bg-red-500/10 text-red-700 dark:text-red-400"
          aria-label={`Failed runs: ${failedRuns}`}
        >
          ✗ {failedRuns} {failedRuns === 1 ? "failed run" : "failed runs"}
        </Badge>
        {totalRuns > 0 && (
          <Badge
            variant="secondary"
            className="px-2 py-1 text-sm bg-primary/10 text-primary-foreground dark:text-primary"
            aria-label={`Total runs: ${totalRuns}`}
          >
            {totalRuns} {totalRuns === 1 ? "total run" : "total runs"}
          </Badge>
        )}
      </footer>
    </article>
  );
} 