"use client";
import React, { useEffect, useState } from "react";
import { useTestSchedules } from "@/hooks/use-test-schedules";
import { ScheduleCard } from "./schedule-card";
import { TestsCardSkeleton } from "./tests-card-skeleton";
import { SchedulesCardToolbar } from "./schedules-card-toolbar";

export function SchedulesList() {
  const { schedules, schedulesLoading } = useTestSchedules();

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
    return (
      <section className="flex flex-col items-center justify-center w-full py-16 gap-4 bg-background rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
        <p className="text-muted-foreground text-sm">No schedules</p>
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