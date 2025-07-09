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

export function OnboardingChecklist() {
  const { ready, hasProject, hasPersona, hasTest, hasRun, allDone } = useOnboardingChecklist();
  const router = useRouter();
  const [runModalOpen, setRunModalOpen] = React.useState(false);

  const [collapsed, setCollapsed] = React.useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(LOCAL_KEY) === "1";
  });

  React.useEffect(() => {
    if (allDone) {
      localStorage.setItem(LOCAL_KEY, "1");
    }
  }, [allDone]);

  const handleToggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    if (typeof window !== "undefined") {
      localStorage.setItem(LOCAL_KEY, next ? "1" : "0");
    }
  };

  if (!ready || allDone) return null;

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
              onClick={() => router.push('/home/create')}
            />
            <ChecklistItem
              done={hasPersona}
              label="Create a persona"
              onClick={() => router.push('/personas/create')}
            />
            <ChecklistItem
              done={hasTest}
              label="Create a test"
              onClick={() => router.push('/tests/create')}
            />
            <ChecklistItem
              done={hasRun}
              label="Start a test run"
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
  onClick?: () => void;
}

function ChecklistItem({ done, label, onClick }: ChecklistItemProps) {
  return (
    <li>
      <button
        type="button"
        disabled={done}
        onClick={onClick}
        className={cn(
          "w-full flex items-center gap-2 text-left",
          done ? "text-muted-foreground cursor-default" : "hover:bg-accent/50 rounded-md p-1"
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