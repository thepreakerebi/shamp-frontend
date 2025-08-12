"use client";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import React from "react";
import { useTestSchedules } from "@/hooks/use-test-schedules";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
// import { ChevronsUpDown } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { EditScheduledRunPageSkeleton } from "../_components/edit-scheduled-run-page-skeleton";

export default function EditSchedulePage() {
  const { /* testId */ } = useParams<{ testId: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const scheduleId = search?.get("scheduleId") || "";

  const { updateRecurringSchedule, fetchSchedules } = useTestSchedules();

  const [loading, setLoading] = React.useState(true);
  const [runDate, setRunDate] = React.useState<Date | undefined>(undefined);
  const [runHour, setRunHour] = React.useState<string>("");
  const [runMinute, setRunMinute] = React.useState<string>("");
  const [freq, setFreq] = React.useState<"daily" | "weekly" | "monthly">("daily");
  const [errors, setErrors] = React.useState<{ runDate?: string; runTime?: string; dateTime?: string }>({});
  const [dateOpen, setDateOpen] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        await fetchSchedules();
        const store = (await import("@/lib/store/testSchedules")).useTestSchedulesStore;
        const s = store.getState().schedules?.find(sc => sc._id === scheduleId);
        if (!s) throw new Error("Schedule not found");
        const dt = new Date(s.nextRun);
        setRunDate(dt);
        setRunHour(String(dt.getUTCHours()).padStart(2, "0"));
        setRunMinute(String(dt.getUTCMinutes()).padStart(2, "0"));
        const rr = (s.recurrenceRule || "").toLowerCase();
        if (rr.includes("monthly")) setFreq("monthly");
        else if (rr.includes("weekly")) setFreq("weekly");
        else setFreq("daily");
      } catch {
        toast.error("Failed to load schedule");
        router.back();
      } finally {
        setLoading(false);
      }
    })();
  }, [scheduleId, fetchSchedules, router]);

  // Broadcast dirty state for Bottombar
  React.useEffect(() => {
    const dirty = !!runDate || runHour !== "" || runMinute !== "";
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("edit-schedule-run-dirty", { detail: dirty }));
    }
  }, [runDate, runHour, runMinute]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: typeof errors = {};
    if (!runDate) errs.runDate = "Date is required";
    if (runHour === "" || runMinute === "") errs.runTime = "Time is required";
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    try {
      if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("edit-schedule-run-loading", { detail: true }));
      const dt = new Date(runDate!);
      dt.setHours(parseInt(runHour, 10), parseInt(runMinute, 10), 0, 0);
      if (dt.getTime() < Date.now()) {
        setErrors({ dateTime: "Selected date/time is in the past" });
        return;
      }

      const min = parseInt(runMinute, 10);
      const hr = parseInt(runHour, 10);
      let rule = `${min} ${hr} * * *`;
      if (freq === "weekly") {
        const dow = dt.getUTCDay();
        rule = `${min} ${hr} * * ${dow}`;
      } else if (freq === "monthly") {
        const dom = dt.getUTCDate();
        rule = `${min} ${hr} ${dom} * *`;
      }

      await updateRecurringSchedule(scheduleId, rule);
      toast.success("Schedule updated");
      router.push(`/tests?tab=schedules`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update schedule");
    } finally {
      if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("edit-schedule-run-loading", { detail: false }));
    }
  };

  if (loading) return <EditScheduledRunPageSkeleton />;

  const displayDate = runDate ? format(runDate, "PPP") : "Pick a date";

  return (
    <main className="p-4 w-full max-w-[500px] mx-auto space-y-6 pb-20">
      <h1 className="text-2xl font-semibold">Edit Recurring Schedule</h1>
      <form id="edit-schedule-run-form" onSubmit={submit} className="space-y-6">
        {/* Date */}
        <section className="space-y-2">
          <label className="text-sm font-medium">Run date</label>
          <Popover open={dateOpen} onOpenChange={setDateOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start font-normal">
                {displayDate}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0" align="start">
              <Calendar
                mode="single"
                selected={runDate}
                onSelect={(d) => {
                  setRunDate(d);
                  setErrors({ ...errors, runDate: undefined });
                  setDateOpen(false);
                }}
                initialFocus
                disabled={{ before: new Date() }}
              />
            </PopoverContent>
          </Popover>
          {errors.runDate && <p className="text-destructive text-xs mt-1">{errors.runDate}</p>}
          {errors.dateTime && <p className="text-destructive text-xs mt-1">{errors.dateTime}</p>}
        </section>

        {/* Time */}
        <section className="space-y-2">
          <label className="text-sm font-medium">Run time (UTC)</label>
          <div className="flex items-center gap-2">
            <Select value={runHour} onValueChange={(v) => { setRunHour(v); setErrors({ ...errors, runTime: undefined }); }}>
              <SelectTrigger className="w-20 justify-between">
                <SelectValue placeholder="HH" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 24 }).map((_, i) => (
                  <SelectItem key={i} value={String(i).padStart(2, "0")}>
                    {String(i).padStart(2, "0")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-muted-foreground">:</span>
            <Select value={runMinute} onValueChange={(v) => { setRunMinute(v); setErrors({ ...errors, runTime: undefined }); }}>
              <SelectTrigger className="w-20 justify-between">
                <SelectValue placeholder="MM" />
              </SelectTrigger>
              <SelectContent>
                {["00", "15", "30", "45"].map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {errors.runTime && <p className="text-destructive text-xs mt-1">{errors.runTime}</p>}
        </section>

        {/* Frequency */}
        <section className="space-y-2">
          <label className="text-sm font-medium">Frequency</label>
          <RadioGroup value={freq} onValueChange={(v) => setFreq(v as typeof freq)} className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <RadioGroupItem value="daily" id="daily" className="data-[state=checked]:bg-secondary data-[state=checked]:text-secondary-foreground" />
              <label htmlFor="daily" className="text-sm select-none">Daily</label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="weekly" id="weekly" className="data-[state=checked]:bg-secondary data-[state=checked]:text-secondary-foreground" />
              <label htmlFor="weekly" className="text-sm select-none">Weekly</label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="monthly" id="monthly" className="data-[state=checked]:bg-secondary data-[state=checked]:text-secondary-foreground" />
              <label htmlFor="monthly" className="text-sm select-none">Monthly</label>
            </div>
          </RadioGroup>
        </section>

        {/* Actions in Bottombar */}
      </form>
    </main>
  );
}


