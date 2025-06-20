"use client";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useTests } from "@/hooks/use-tests";
import { usePersonas } from "@/hooks/use-personas";
import type { Persona } from "@/hooks/use-personas";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandEmpty, CommandItem } from "@/components/ui/command";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { ChevronsUpDown, Check, Loader2 } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { useTestsStore } from "@/lib/store/tests";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useTestRunsStore } from "@/lib/store/testruns";
import { ScheduleRunPageSkeleton } from "../_components/schedule-run-page-skeleton";

export default function ScheduleRunPage() {
  const { testId } = useParams<{ testId: string }>();
  const router = useRouter();
  const { token } = useAuth();
  const { getTestById } = useTests();
  const { personas: allPersonas } = usePersonas();
  const updateTestInList = useTestsStore(state=>state.updateTestInList);
  const addTestRunToList = useTestRunsStore(state=>state.addTestRunToList);

  const [loading, setLoading] = useState(true);
  const [personaOptions, setPersonaOptions] = useState<Persona[]>([]);
  const [selectedPersona, setSelectedPersona] = useState<string>("");
  const [openSelect, setOpenSelect] = useState(false);
  const [runDate, setRunDate] = useState<Date | undefined>(undefined);
  const [runHour, setRunHour] = useState<string>("");
  const [runMinute, setRunMinute] = useState<string>("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState<"daily" | "weekly" | "monthly">("daily");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ personaId?: string; runDate?: string; runTime?: string; dateTime?: string }>({});
  const [dateOpen, setDateOpen] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const test = await getTestById(testId);
        const map = new Map<string, Persona>();
        const raw = (test as unknown as { personas?: Persona[] }).personas;
        if (Array.isArray(raw)) {
          raw.forEach(p => map.set(p._id, p));
        }
        const names = (test as unknown as { personaNames?: string[] }).personaNames;
        if (Array.isArray(names) && allPersonas) {
          names.forEach(nm => {
            const match = allPersonas.find(p => p.name === nm);
            if (match) {
              map.set(match._id, match);
            }
          });
        }
        const updatedTest = test as unknown as import("@/hooks/use-tests").Test;
        updateTestInList(updatedTest);
        setPersonaOptions(Array.from(map.values()));
      } catch {
        toast.error("Failed to load test");
        router.back();
      } finally {
        setLoading(false);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testId]);

  const doSchedule = async () => {
    if (!selectedPersona || !runDate || runHour === "" || runMinute === "") return;
    if (!token) { toast.error("Not authenticated"); return; }
    try {
      setSubmitting(true);
      const payload: Record<string, unknown> = {
        testId,
        personaId: selectedPersona,
      };
      const dateTime = new Date(runDate);
      dateTime.setHours(parseInt(runHour, 10), parseInt(runMinute, 10), 0, 0);

      if (dateTime.getTime() < Date.now()) {
        setErrors({ dateTime: "Selected date/time is in the past" });
        setSubmitting(false);
        return;
      }

      let endpoint = "/testschedules/schedule";
      if (isRecurring) {
        let rule = "";
        const min = dateTime.getUTCMinutes();
        const hr = dateTime.getUTCHours();
        if (recurrenceType === "daily") {
          rule = `${min} ${hr} * * *`;
        } else if (recurrenceType === "weekly") {
          const dow = dateTime.getUTCDay(); // 0 (Sun) - 6 (Sat)
          rule = `${min} ${hr} * * ${dow}`;
        } else {
          const dom = dateTime.getUTCDate();
          rule = `${min} ${hr} ${dom} * *`;
        }
        payload.recurrenceRule = rule;
        endpoint = "/testschedules/recurring";
      } else {
        payload.scheduledFor = dateTime.toISOString();
      }
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}${endpoint}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to schedule");
      let newRun: import("@/hooks/use-testruns").TestRun | null = null;
      try {
        newRun = await res.json();
      } catch {}

      // If a non-recurring run was created, optimistically add to stores for immediate UI update
      if (!isRecurring && newRun && newRun._id) {
        try {
          type RunWithPersona = import("@/hooks/use-testruns").TestRun & { personaName?: string; test: string };
          const runWithPersona: RunWithPersona = {
            ...newRun,
            test: testId,
            personaName: personaOptions.find(p=>p._id === selectedPersona)?.name,
          } as RunWithPersona;
          addTestRunToList(runWithPersona);
          // also update test-specific cache
          const prev = useTestsStore.getState().getTestRunsForTest(testId) || [];
          useTestsStore.getState().setTestRunsForTest(testId, [runWithPersona, ...prev]);
        } catch {}
      }

      toast.success(isRecurring ? "Recurring schedule created" : "Test run scheduled");
      if (isRecurring) {
        router.push(`/tests?tab=schedules`);
      } else {
        router.push(`/tests/${testId}?tab=runs`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to schedule");
    } finally {
      setSubmitting(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: typeof errors = {};
    if (!selectedPersona) errs.personaId = "Persona is required";
    if (!runDate) errs.runDate = "Date is required";
    if (runHour === "" || runMinute === "") errs.runTime = "Time is required";
    if (Object.keys(errs).length) { setErrors(errs); return; }
    await doSchedule();
  };

  if (loading) {
    return <ScheduleRunPageSkeleton />;
  }

  return (
    <main className="p-4 w-full max-w-md mx-auto space-y-6">
      <h1 className="text-2xl font-semibold">Schedule Test Run</h1>

      <form onSubmit={submit} className="space-y-6">
        {/* Persona select */}
        <section className="space-y-2">
          <label className="text-sm font-medium">Persona</label>
          <Popover open={openSelect} onOpenChange={setOpenSelect}>
            <PopoverTrigger asChild>
              <Button variant="outline" role="combobox" className="w-full justify-between">
                {selectedPersona ? personaOptions.find(p=>p._id===selectedPersona)?.name : "Select persona"}
                <ChevronsUpDown className="size-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
              <Command>
                <CommandInput placeholder="Search persona…" className="h-9" />
                <CommandList>
                  <CommandEmpty>No persona found.</CommandEmpty>
                  {personaOptions.map(p => (
                    <CommandItem key={p._id} value={p.name} onSelect={()=>{ setSelectedPersona(p._id); setOpenSelect(false); }}>
                      <div className="flex items-center gap-2 w-full">
                        {p.avatarUrl ? (
                          <Image src={p.avatarUrl} alt={p.name} width={24} height={24} className="rounded-full object-cover border" unoptimized />
                        ) : (
                          <span className="w-6 h-6 rounded-full flex items-center justify-center bg-muted text-[10px] font-medium text-muted-foreground border">{p.name[0]?.toUpperCase() || "?"}</span>
                        )}
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-medium truncate">{p.name}</span>
                          {p.description && <span className="text-xs text-muted-foreground line-clamp-2">{p.description}</span>}
                        </div>
                      </div>
                      <Check className={`ml-auto size-4 ${selectedPersona === p._id ? "opacity-100" : "opacity-0"}`} />
                    </CommandItem>
                  ))}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          {errors.personaId && <p className="text-destructive text-xs mt-1">{errors.personaId}</p>}
        </section>

        {/* Date */}
        <section className="space-y-2">
          <label className="text-sm font-medium">Run date</label>
          <Popover open={dateOpen} onOpenChange={setDateOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start font-normal">
                {runDate ? format(runDate, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0" align="start">
              <Calendar
                mode="single"
                selected={runDate}
                onSelect={(d)=>{setRunDate(d); setErrors({...errors, runDate: undefined}); setDateOpen(false);}}
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
            <Select value={runHour} onValueChange={v=>{setRunHour(v); setErrors({...errors, runTime: undefined});}}>
              <SelectTrigger className="w-20 justify-between">
                <SelectValue placeholder="HH" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({length:24}).map((_,i)=>(
                  <SelectItem key={i} value={String(i).padStart(2,"0")}>{String(i).padStart(2,"0")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-muted-foreground">:</span>
            <Select value={runMinute} onValueChange={v=>{setRunMinute(v); setErrors({...errors, runTime: undefined});}}>
              <SelectTrigger className="w-20 justify-between">
                <SelectValue placeholder="MM" />
              </SelectTrigger>
              <SelectContent>
                {['00','15','30','45'].map(m=>(
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {errors.runTime && <p className="text-destructive text-xs mt-1">{errors.runTime}</p>}
        </section>

        {/* Recurring */}
        <section className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Checkbox id="recurring" checked={isRecurring} className="data-[state=checked]:bg-secondary data-[state=checked]:text-secondary-foreground" onCheckedChange={v=>setIsRecurring(!!v)} />
            <label htmlFor="recurring" className="text-sm select-none">Make recurring</label>
          </div>
          {isRecurring && (
            <div className="pl-6">
              <RadioGroup value={recurrenceType} onValueChange={(v: "daily" | "weekly" | "monthly")=>setRecurrenceType(v)} className="flex items-center gap-4">
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
            </div>
          )}
        </section>

        {/* Actions */}
        <section className="flex justify-end gap-2">
          <Button variant="ghost" type="button" onClick={()=>router.back()} disabled={submitting}>Cancel</Button>
          <Button type="submit" disabled={submitting} variant="default">
            {submitting && <Loader2 className="mr-2 size-4 animate-spin" />} 
            {isRecurring?"Create schedule":"Schedule"}
          </Button>
        </section>
      </form>
    </main>
  );
} 