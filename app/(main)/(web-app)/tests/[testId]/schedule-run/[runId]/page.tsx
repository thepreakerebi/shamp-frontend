"use client";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useTestRuns } from "@/hooks/use-testruns";
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
import { format } from "date-fns";

export default function EditScheduledRunPage() {
  const { testId, runId } = useParams<{ testId: string; runId: string }>();
  const router = useRouter();
  const { getTestRunStatus, updateScheduledTestRun } = useTestRuns();
  const { personas: allPersonas } = usePersonas();

  const [loading, setLoading] = useState(true);
  const [personaOptions, setPersonaOptions] = useState<Persona[]>([]);
  const [selectedPersona, setSelectedPersona] = useState<string>("");
  const [personaLabel, setPersonaLabel] = useState<string>("");
  const [openSelect, setOpenSelect] = useState(false);
  const [runDate, setRunDate] = useState<Date | undefined>();
  const [runHour, setRunHour] = useState<string>("");
  const [runMinute, setRunMinute] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ personaId?: string; runDate?: string; runTime?: string }>({});

  // Load existing run + personas
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const run = await getTestRunStatus(runId);
        if (run.status !== "pending") {
          toast.error("Only pending scheduled runs can be edited");
          router.back();
          return;
        }
        // Try to determine persona id from run or by name
        let preselectId = "";
        const runObj = run as unknown as Record<string, unknown>;
        if (typeof runObj.persona === "string") {
          preselectId = runObj.persona;
        }
        const pName = runObj.personaName as string | undefined;
        if (!preselectId && pName && allPersonas) {
          const match = allPersonas.find(p=>p.name===pName);
          if (match) preselectId = match._id;
        }
        setSelectedPersona(preselectId);
        setPersonaLabel(pName || "");
        if (run.scheduledFor) {
          const dt = new Date(run.scheduledFor);
          setRunDate(dt);
          setRunHour(String(dt.getUTCHours()).padStart(2, "0"));
          setRunMinute(String(dt.getUTCMinutes()).padStart(2, "0"));
        }
        if (allPersonas) {
          const opts = [...allPersonas];
          if (pName && !opts.find(p=>p.name===pName)) {
            opts.push({ _id: "__current__", name: pName } as unknown as Persona);
          }
          setPersonaOptions(opts);
        }
      } catch {
        toast.error("Failed to load scheduled run");
        router.back();
      } finally {
        setLoading(false);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId, allPersonas]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: typeof errors = {};
    if (!selectedPersona) errs.personaId = "Persona is required";
    if (!runDate) errs.runDate = "Date is required";
    if (runHour === "" || runMinute === "") errs.runTime = "Time is required";
    if (Object.keys(errs).length) { setErrors(errs); return; }
    try {
      setSaving(true);
      const dt = new Date(runDate!);
      dt.setHours(parseInt(runHour,10), parseInt(runMinute,10), 0,0);
      const pName = personaOptions.find(p=>p._id===selectedPersona)?.name || personaLabel;
      await updateScheduledTestRun(runId, { personaId: selectedPersona, scheduledFor: dt.toISOString() }, pName);
      toast.success("Scheduled run updated");
      router.push(`/tests/${testId}?tab=runs`);
    } catch(err){
      toast.error(err instanceof Error? err.message : "Failed to update run");
    } finally { setSaving(false); }
  };

  if (loading) return <main className="p-6">Loading…</main>;

  const displayDate = runDate ? format(runDate, "PPP") : "Pick a date";

  return (
    <main className="p-4 w-full max-w-md mx-auto space-y-6">
      <h1 className="text-2xl font-semibold">Edit Scheduled Run</h1>
      <form onSubmit={submit} className="space-y-6">
        {/* Persona select */}
        <section className="space-y-2">
          <label className="text-sm font-medium">Persona</label>
          <Popover open={openSelect} onOpenChange={setOpenSelect}>
            <PopoverTrigger asChild>
              <Button variant="outline" role="combobox" className="w-full justify-between">
                {selectedPersona ? (personaOptions.find(p=>p._id===selectedPersona)?.name || personaLabel) : "Select persona"}
                <ChevronsUpDown className="size-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
              <Command>
                <CommandInput placeholder="Search persona…" className="h-9" />
                <CommandList>
                  <CommandEmpty>No persona found.</CommandEmpty>
                  {personaOptions.map(p=> (
                    <CommandItem key={p._id} value={p.name} onSelect={()=>{ setSelectedPersona(p._id); setOpenSelect(false); }}>
                      <div className="flex items-center gap-2 w-full">
                        {p.avatarUrl ? (
                          <Image src={p.avatarUrl} alt={p.name} width={24} height={24} className="rounded-full object-cover border" unoptimized />
                        ) : (
                          <span className="w-6 h-6 rounded-full flex items-center justify-center bg-muted text-[10px] font-medium text-muted-foreground border">{p.name[0]?.toUpperCase()||"?"}</span>
                        )}
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-medium truncate">{p.name}</span>
                          {p.description && <span className="text-xs text-muted-foreground line-clamp-2">{p.description}</span>}
                        </div>
                      </div>
                      <Check className={`ml-auto size-4 ${selectedPersona===p._id?"opacity-100":"opacity-0"}`} />
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
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start font-normal">
                {displayDate}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0" align="start">
              <Calendar mode="single" selected={runDate} onSelect={(d)=>{ setRunDate(d); setErrors({...errors, runDate: undefined}); }} initialFocus />
            </PopoverContent>
          </Popover>
          {errors.runDate && <p className="text-destructive text-xs mt-1">{errors.runDate}</p>}
        </section>

        {/* Time */}
        <section className="space-y-2">
          <label className="text-sm font-medium">Run time (UTC)</label>
          <div className="flex items-center gap-2">
            <Select value={runHour} onValueChange={v=>{ setRunHour(v); setErrors({...errors, runTime: undefined}); }}>
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
            <Select value={runMinute} onValueChange={v=>{ setRunMinute(v); setErrors({...errors, runTime: undefined}); }}>
              <SelectTrigger className="w-20 justify-between">
                <SelectValue placeholder="MM" />
              </SelectTrigger>
              <SelectContent>
                {['00','15','30','45'].map(m=> (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {errors.runTime && <p className="text-destructive text-xs mt-1">{errors.runTime}</p>}
        </section>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={()=>router.back()} disabled={saving}>Cancel</Button>
          <Button type="submit" disabled={saving} variant="default" className="flex items-center gap-2">
            {saving && <Loader2 className="size-4 animate-spin" />}
            {saving?"Saving…":"Save changes"}
          </Button>
        </div>
      </form>
    </main>
  );
} 