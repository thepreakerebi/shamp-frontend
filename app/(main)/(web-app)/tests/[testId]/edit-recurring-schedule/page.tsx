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
  const [initialLoaded, setInitialLoaded] = React.useState(false);
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
        // Prefer using anchorDate when available; fall back to friendly rule
        const friendly = (s.recurrenceRule || "").toLowerCase();
        if (s.anchorDate) {
          const ad = new Date(s.anchorDate);
          // Use local hours/minutes so UI matches what user selected at creation
          setRunHour(String(ad.getHours()).padStart(2,"0"));
          setRunMinute(String(ad.getMinutes()).padStart(2,"0"));
          setRunDate(new Date(ad.getFullYear(), ad.getMonth(), ad.getDate(), ad.getHours(), ad.getMinutes(), 0, 0));
          if (friendly.includes("monthly")) setFreq("monthly");
          else if (friendly.includes("weekly")) setFreq("weekly");
          else setFreq("daily");
          return;
        }
        const timeMatch = friendly.match(/at\s+(\d{1,2}):(\d{2})/);
        const parsedHour = timeMatch ? timeMatch[1].padStart(2, "0") : String(new Date(s.nextRun).getHours()).padStart(2, "0");
        const parsedMinute = timeMatch ? timeMatch[2] : String(new Date(s.nextRun).getMinutes()).padStart(2, "0");
        setRunHour(parsedHour);
        setRunMinute(parsedMinute);

        if (friendly.includes("monthly")) {
          setFreq("monthly");
          // Extract day-of-month from friendly string
          const domMatch = friendly.match(/the\s+(\d{1,2})(st|nd|rd|th)/);
          const dom = domMatch ? parseInt(domMatch[1], 10) : new Date(s.nextRun).getUTCDate();
          const now = new Date();
          // Build an anchor date at current month with DOM (or next month if passed)
          const anchor = new Date(now.getFullYear(), now.getMonth(), dom, parseInt(parsedHour,10), parseInt(parsedMinute,10), 0, 0);
          const finalDate = anchor.getTime() >= Date.now() ? anchor : new Date(now.getFullYear(), now.getMonth() + 1, dom, parseInt(parsedHour,10), parseInt(parsedMinute,10), 0, 0);
          setRunDate(finalDate);
        } else if (friendly.includes("weekly")) {
          setFreq("weekly");
          // For weekly, just show the upcoming occurrence (nextRun)
          const dt = new Date(s.nextRun);
          setRunDate(new Date(dt.getFullYear(), dt.getMonth(), dt.getDate(), parseInt(parsedHour,10), parseInt(parsedMinute,10)));
        } else {
          setFreq("daily");
          const dt = new Date(s.nextRun);
          setRunDate(new Date(dt.getFullYear(), dt.getMonth(), dt.getDate(), parseInt(parsedHour,10), parseInt(parsedMinute,10)));
        }
      } catch {
        toast.error("Failed to load schedule");
        router.back();
      } finally { setLoading(false); setInitialLoaded(true); }
    })();
  }, [scheduleId, fetchSchedules, router]);

  // Broadcast dirty state for Bottombar only after initial load
  React.useEffect(() => {
    if (!initialLoaded) return;
    const dirty = !!runDate || runHour !== "" || runMinute !== "";
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("edit-schedule-run-dirty", { detail: dirty }));
    }
  }, [runDate, runHour, runMinute, initialLoaded]);

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

      // Build cron with UTC hours/minutes to match backend's UTC cron parsing
      const hr = dt.getUTCHours();
      const min = dt.getUTCMinutes();
      let rule = `${min} ${hr} * * *`;
      if (freq === "weekly") {
        const dow = dt.getUTCDay();
        rule = `${min} ${hr} * * ${dow}`;
      } else if (freq === "monthly") {
        const dom = dt.getUTCDate();
        rule = `${min} ${hr} ${dom} * *`;
      }

      await updateRecurringSchedule(scheduleId, rule, new Date(Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate(), dt.getUTCHours(), dt.getUTCMinutes(), 0, 0)).toISOString());
      // Avoid duplicate success toasts (socket + local). Delay navigation slightly.
      setTimeout(()=>router.push(`/tests?tab=schedules`), 0);
      
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
      <form id="edit-schedule-run-form" onSubmit={submit} className="space-y-6" onKeyDown={(e)=>{
        if ((e.key === 'Enter' || e.key === 'Return') && e.target instanceof HTMLElement && e.target.tagName !== 'TEXTAREA'){
          e.preventDefault();
          const form = document.getElementById('edit-schedule-run-form') as HTMLFormElement | null;
          form?.requestSubmit();
        }
      }}>
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


