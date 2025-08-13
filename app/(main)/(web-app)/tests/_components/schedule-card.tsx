"use client";
import { Badge } from "@/components/ui/badge";
import { ProjectBadge } from "@/components/ui/project-badge";
import { PersonaBadge } from "@/components/ui/persona-badge";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { ScheduleRowActionsDropdown } from "./schedule-row-actions-dropdown";
import { useTestSchedules } from "@/hooks/use-test-schedules";
import { TestSchedule } from "@/lib/store/testSchedules";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { useAuth } from "@/lib/auth";

export function ScheduleCard({ schedule }: { schedule: TestSchedule }) {
  const router = useRouter();
  const { moveScheduleToTrash, deleteSchedule } = useTestSchedules();
  const { user } = useAuth();

  const handleOpen: React.MouseEventHandler<HTMLDivElement> = () => {
    router.push(`/tests/${schedule.testId}`);
  };

  return (
    <section
      role="button"
      data-test-id={schedule.testId}
      onClick={handleOpen}
      className={cn(
        "rounded-3xl border dark:border-0 bg-card/80 hover:bg-muted/50 transition-all cursor-pointer flex flex-col p-4 gap-3 relative"
      )}
    >
      {/* Header */}
      <header className="flex items-start gap-3">
        <figure className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-xl font-bold shrink-0" aria-hidden="true">
          {schedule.testName?.[0]?.toUpperCase() || "S"}
        </figure>
        <section className="flex-1 min-w-0">
          <h3 className="font-semibold leading-tight truncate" title={schedule.testName}>{schedule.testName}</h3>
          {schedule.testDescription && (
            <p className="text-sm text-muted-foreground line-clamp-2" title={schedule.testDescription}>{schedule.testDescription}</p>
          )}
        </section>
        {(user?.currentWorkspaceRole === 'admin' || user?._id === schedule.createdBy) && (
          <nav onClick={(e)=>e.stopPropagation()} data-stop-row>
            <ScheduleRowActionsDropdown
              scheduleId={schedule._id}
              testName={schedule.testName}
              actions={{ moveScheduleToTrash, deleteSchedule }}
              currentRule={schedule.recurrenceRule}
              testId={schedule.testId}
            />
          </nav>
        )}
      </header>
      <Separator />

      {/* Badges */}
      <section className="flex flex-wrap items-center gap-2 mt-auto">
        {schedule.projectName && <ProjectBadge name={schedule.projectName} />}
        {schedule.personaName && <PersonaBadge name={schedule.personaName} />}
        {schedule.recurrenceRule && (
          (() => {
            const label = (() => {
              const rule = (schedule.recurrenceRule || '').toLowerCase();
              const dt = schedule.anchorDate ? new Date(schedule.anchorDate) : (schedule.nextRun ? new Date(schedule.nextRun) : null);
              const timeStr = dt ? `${String(dt.getHours()).padStart(2,'0')}:${String(dt.getMinutes()).padStart(2,'0')}` : '';
              if (rule.startsWith('weekly on')) {
                // keep the day name from server, replace time
                const dayPart = rule.replace(/\s+at\s+.*/, '');
                return `${dayPart.replace('utc','').trim()} at ${timeStr}`;
              }
              if (rule.startsWith('monthly on')) {
                const dayPart = rule.replace(/\s+at\s+.*/, '');
                return `${dayPart.replace('utc','').trim()} at ${timeStr}`;
              }
              if (rule.startsWith('daily at')) {
                return `Daily at ${timeStr}`;
              }
              return schedule.recurrenceRule;
            })();
            return (
              <Badge variant="secondary" className="px-1.5 py-0 text-xs bg-primary/10 text-primary-foreground dark:text-primary whitespace-nowrap">
                {label}
              </Badge>
            );
          })()
        )}
        {schedule.nextRun && (
          <Badge variant="outline" className="text-xs whitespace-nowrap">
            {(() => { const dt = new Date(schedule.nextRun); return `Next run: ${format(dt, 'PPP')} ${String(dt.getHours()).padStart(2,'0')}:${String(dt.getMinutes()).padStart(2,'0')}`; })()}
          </Badge>
        )}
      </section>
    </section>
  );
} 