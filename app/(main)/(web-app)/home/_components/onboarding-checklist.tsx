"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, ChevronDown, ChevronUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { StartTestRunModal } from "@/app/(main)/(web-app)/test-runs/_components/start-test-run-modal";
import { useOnboardingChecklist } from "@/hooks/use-onboarding-checklist";
import { cn } from "@/lib/utils";

const LOCAL_KEY = "onboarding_checklist_collapsed";
const DONE_KEY = "onboarding_checklist_done";

export function OnboardingChecklist() {
  const { ready, hasProject, hasPersona, hasTest, hasRun, allDone } = useOnboardingChecklist();
  const router = useRouter();
  const [runModalOpen, setRunModalOpen] = React.useState(false);

  // Track whether the user has ever completed the checklist
  const [done, setDone] = React.useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(DONE_KEY) === "1";
  });

  // Determine collapsed state after we know whether the checklist is complete
  const [collapsed, setCollapsed] = React.useState(false);

  // Sync collapsed state with localStorage based on completion status
  React.useEffect(() => {
    if (!ready) return;

    if (allDone) {
      // Mark onboarding as permanently done
      setDone(true);
      if (typeof window !== "undefined") {
        localStorage.setItem(DONE_KEY, "1");
        localStorage.setItem(LOCAL_KEY, "1"); // collapse as well
      }
    } else {
      // Ensure checklist starts expanded for incomplete onboarding (unless previously done)
      setCollapsed(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, allDone]);

  const handleToggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    if (typeof window !== "undefined") {
      localStorage.setItem(LOCAL_KEY, next ? "1" : "0");
    }
  };

  if (!ready || done) return null;

  return (
    <aside
      role="complementary"
      aria-label="Getting started checklist"
      className="fixed bottom-6 right-6 z-50 max-w-xs w-[20rem] sm:w-80"
    >
      <Card className="shadow-lg">
        <header className="flex items-center justify-between p-3 border-b">
          <h3 className="font-semibold text-sm">Getting started</h3>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleToggle}
            aria-label={collapsed ? "Expand checklist" : "Collapse checklist"}
          >
            {collapsed ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </Button>
        </header>
        {!collapsed && (
          <ul className="p-3 space-y-2 text-sm">
            <ChecklistItem
              done={hasProject}
              label="Create your first project"
              enabled={true}
              onClick={() => router.push('/home/create')}
            />
            <ChecklistItem
              done={hasPersona}
              label="Create a persona"
              enabled={hasProject}
              onClick={() => router.push('/personas/create')}
            />
            <ChecklistItem
              done={hasTest}
              label="Create a test"
              enabled={hasPersona}
              onClick={() => router.push('/tests/create')}
            />
            <ChecklistItem
              done={hasRun}
              label="Start a test run"
              enabled={hasTest}
              onClick={() => setRunModalOpen(true)}
            />
          </ul>
        )}
      </Card>
      {/* Test run modal */}
      <StartTestRunModal open={runModalOpen} onOpenChange={setRunModalOpen} />
    </aside>
  );
}

interface ChecklistItemProps {
  done: boolean;
  label: string;
  enabled?: boolean;
  onClick?: () => void;
}

function ChecklistItem({ done, label, enabled = true, onClick }: ChecklistItemProps) {
  return (
    <li>
      <button
        type="button"
        disabled={done || !enabled}
        onClick={enabled && !done ? onClick : undefined}
        className={cn(
          "w-full flex items-center gap-2 text-left rounded-md p-1",
          done && "text-muted-foreground cursor-default",
          !done && enabled && "hover:bg-accent/50",
          !done && !enabled && "text-muted-foreground cursor-default"
        )}
      >
        {done ? (
          <CheckCircle2 className="size-4 text-green-600" />
        ) : (
          <Circle className="size-4 text-muted-foreground" />
        )}
        <span className={cn(done && "line-through")}>{label}</span>
      </button>
    </li>
  );
} 