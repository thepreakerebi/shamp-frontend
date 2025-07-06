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
          <Badge variant="secondary" className="px-1.5 py-0 text-xs bg-primary/10 text-primary-foreground dark:text-primary whitespace-nowrap">
            {schedule.recurrenceRule}
          </Badge>
        )}
        {schedule.nextRun && (
          <Badge variant="outline" className="text-xs whitespace-nowrap">
            Next run: {format(new Date(schedule.nextRun), "PPP p")}
          </Badge>
        )}
      </section>
    </section>
  );
} 