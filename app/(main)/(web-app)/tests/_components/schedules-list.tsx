"use client";
import React, { useEffect, useState } from "react";
import { useBilling } from "@/hooks/use-billing";
import { Sparkles, Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useTestSchedules } from "@/hooks/use-test-schedules";
import { ScheduleCard } from "./schedule-card";
import { TestsCardSkeleton } from "./tests-card-skeleton";
import { SchedulesCardToolbar } from "./schedules-card-toolbar";

export function SchedulesList() {
  const { schedules, schedulesLoading } = useTestSchedules();
  const { summary, loading: billingLoading } = useBilling();

  const planName =
    summary?.products && Array.isArray(summary.products) && summary.products.length > 0
      ? (summary.products[0] as { name?: string; id?: string }).name ||
        (summary.products[0] as { id?: string }).id
      : "Free";

  // Treat annual variants (e.g. hobby_annual, Hobby - Annual) the same as the base plan
  const normalizedPlan = (planName ?? '')
    .toLowerCase()
    .replace(/(_annual$|\s-\s*annual$)/, '');
  const isFreeOrHobby = !billingLoading && ['free', 'hobby'].includes(normalizedPlan);

  const canUseSchedules = billingLoading || !isFreeOrHobby;

  const [showTop, setShowTop] = useState(false);
  useEffect(() => {
    const handler = () => setShowTop(window.scrollY > 400);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  if (schedulesLoading && (!schedules || schedules.length === 0)) {
    return <TestsCardSkeleton count={6} />;
  }

  if (!schedules || schedules.length === 0) {
    if (!canUseSchedules) {
      return (
        <section className="flex flex-col items-center justify-center w-full py-16 gap-4 bg-background rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
          <Sparkles className="text-muted-foreground mb-2" size={40} />
          <h2 className="text-xl font-semibold text-foreground mb-1">Schedules unavailable</h2>
          <p className="text-muted-foreground text-sm mb-4 text-center max-w-xs">
            Test scheduling is available on Pro and higher plans. Upgrade your plan to unlock this feature.
          </p>
          <Link href="/pricing">
            <Button className="gap-2" variant="default">
              <Plus className="size-4" /> Upgrade plan
            </Button>
          </Link>
        </section>
      );
    }

    return (
      <section className="flex flex-col items-center justify-center w-full py-16 gap-4 bg-background rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
        <h2 className="text-xl font-semibold text-foreground mb-1">No schedules yet</h2>
        <p className="text-muted-foreground text-sm max-w-xs text-center">
          You haven&apos;t scheduled any test runs yet. To create one, open the test you want to run, click the <span className="font-medium">“Schedule run”</span> button, and fill in the schedule details.
        </p>
      </section>
    );
  }

  return (
    <section>
      <section className="flex flex-col">
        <SchedulesCardToolbar />
        <section className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 py-1">
          {schedules.map(s => (
            <ScheduleCard key={s._id} schedule={s} />
          ))}
        </section>
      </section>
      {showTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-4 z-20 md:hidden bg-secondary text-secondary-foreground rounded-full p-3 shadow-lg"
          aria-label="Scroll to top"
        >
          ↑
        </button>
      )}
    </section>
  );
} 