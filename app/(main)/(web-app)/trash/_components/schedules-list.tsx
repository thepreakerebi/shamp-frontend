"use client";
import { useTestSchedules } from "@/hooks/use-test-schedules";
import type { TestSchedule } from "@/lib/store/testSchedules";
import React, { useState } from "react";
import { TrashCardActionsDropdown } from "@/components/ui/trash-card-actions-dropdown";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";
import { TestsCardSkeleton } from "@/app/(main)/(web-app)/tests/_components/tests-card-skeleton";
import { Badge } from "@/components/ui/badge";
import { ProjectBadge } from "@/components/ui/project-badge";
import { PersonaBadge } from "@/components/ui/persona-badge";
import { format } from "date-fns";

export function TrashedSchedulesList() {
  const {
    trashedSchedules,
    trashedSchedulesLoading,
    trashedSchedulesError,
    restoreScheduleFromTrash,
    deleteSchedule,
  } = useTestSchedules();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [scheduleToDelete, setScheduleToDelete] = useState<TestSchedule | null>(null);

  // Deduplicate to avoid duplicate-key warnings
  const uniqueSchedules = React.useMemo(() => {
    if (!trashedSchedules) return [] as TestSchedule[];
    const map = new Map<string, TestSchedule>();
    trashedSchedules.forEach(s => {
      if (!map.has(s._id)) map.set(s._id, s);
    });
    const arr = Array.from(map.values());
    const getTs = (s: TestSchedule): number => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const anyS = s as any;
      if (anyS.updatedAt) return new Date(anyS.updatedAt).getTime();
      return parseInt(s._id.substring(0,8),16)*1000;
    };
    return arr.sort((a,b)=> getTs(b) - getTs(a));
  }, [trashedSchedules]);

  const handleRestore = async (schedule: TestSchedule) => {
    try {
      await restoreScheduleFromTrash(schedule._id);
      toast.success("Schedule restored");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to restore schedule");
    }
  };

  const promptDelete = (schedule: TestSchedule) => {
    setScheduleToDelete(schedule);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!scheduleToDelete) return;
    setConfirmLoading(true);
    try {
      await deleteSchedule(scheduleToDelete._id);
      setConfirmOpen(false);
      setScheduleToDelete(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete schedule");
    } finally {
      setConfirmLoading(false);
    }
  };

  if (trashedSchedulesLoading && uniqueSchedules.length === 0) {
    return <TestsCardSkeleton count={6} />;
  }

  if (trashedSchedulesError) {
    return <p className="text-destructive p-4">Error loading trashed schedules: {trashedSchedulesError}</p>;
  }

  if (uniqueSchedules.length === 0) {
    return <p className="text-muted-foreground p-4">No schedules in trash.</p>;
  }

  return (
    <section>
      <header className="px-4 mb-4">
        <h2 className="text-xl font-semibold">Trashed Schedules</h2>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 p-4" aria-label="Trashed schedules list">
        {uniqueSchedules.map(sch => (
          <article key={sch._id} className="rounded-3xl border dark:border-0 bg-card/80 p-4 flex flex-col gap-3">
            <header className="flex items-start gap-3">
              <figure className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-xl font-bold shrink-0" aria-hidden="true">
                {sch.testName?.[0]?.toUpperCase() || "S"}
              </figure>
              <section className="flex-1 min-w-0">
                <h3 className="font-semibold leading-tight truncate" title={sch.testName}>{sch.testName}</h3>
                {sch.testDescription && (
                  <p className="text-sm text-muted-foreground line-clamp-2" title={sch.testDescription}>{sch.testDescription}</p>
                )}
              </section>
              <nav onClick={e=>e.stopPropagation()} data-stop-row>
                <TrashCardActionsDropdown onRestore={() => handleRestore(sch)} onDelete={() => promptDelete(sch)} />
              </nav>
            </header>

            {/* Badges */}
            <section className="flex flex-wrap items-center gap-2 mt-auto">
              {sch.projectName && <ProjectBadge name={sch.projectName} />}
              {sch.personaName && <PersonaBadge name={sch.personaName} />}
              {sch.recurrenceRule && (
                <Badge variant="secondary" className="px-1.5 py-0 text-xs bg-primary/10 text-primary-foreground dark:text-primary whitespace-nowrap">
                  {sch.recurrenceRule}
                </Badge>
              )}
              {sch.nextRun && (
                <Badge variant="outline" className="text-xs whitespace-nowrap">
                  Next run: {format(new Date(sch.nextRun), "PPP p")}
                </Badge>
              )}
            </section>
          </article>
        ))}
      </section>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete Schedule Permanently"
        description={`Are you sure you want to permanently delete this schedule? This action cannot be undone.`}
        confirmLabel="Delete"
        confirmVariant="destructive"
        loading={confirmLoading}
        onConfirm={confirmDelete}
      />
    </section>
  );
} 