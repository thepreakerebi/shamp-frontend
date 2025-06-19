"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandEmpty, CommandItem } from "@/components/ui/command";
import { ChevronsUpDown, Check } from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Test } from "@/hooks/use-tests";
import { useAuth } from "@/lib/auth";
import { Checkbox } from "@/components/ui/checkbox";
import { useTests } from "@/hooks/use-tests";
import { usePersonas } from "@/hooks/use-personas";

interface ScheduleTestRunModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  test: Test;
}

interface PersonaOption { _id: string; name: string; avatarUrl?: string; description?: string; }

export function ScheduleTestRunModal({ open, onOpenChange, test }: ScheduleTestRunModalProps) {
  const { token } = useAuth();
  const [selectedPersona, setSelectedPersona] = useState<string>("");
  const [openSelect, setOpenSelect] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [runAt, setRunAt] = useState<string>(""); // datetime-local value
  const [isRecurring, setIsRecurring] = useState(false);

  const { getTestById } = useTests();
  const { personas: allPersonas } = usePersonas();

  const [personas, setPersonas] = useState<PersonaOption[]>([]);

  useEffect(() => {
    if (!open) {
      setSelectedPersona("");
      setRunAt("");
      setIsRecurring(false);
      setPersonas([]);
    }
  }, [open]);

  const extractPersonas = (t: Test): PersonaOption[] => {
    const result: PersonaOption[] = [];
    // Attempt to read an array "personas" (not typed)
    const personasField = (t as unknown as { personas?: unknown }).personas;
    if (Array.isArray(personasField) && personasField.length > 0) {
      personasField.forEach((p) => {
        if (p && typeof p === "object" && "_id" in p && "name" in p) {
          const obj = p as { _id: string; name: string; avatarUrl?: string; description?: string };
          result.push({ _id: obj._id, name: obj.name, avatarUrl: obj.avatarUrl, description: obj.description });
        }
      });
    } else if (t.persona && typeof t.persona === "object" && "_id" in t.persona && "name" in t.persona) {
      const per = t.persona as { _id: string; name: string; avatarUrl?: string; description?: string };
      result.push({ _id: per._id, name: per.name, avatarUrl: per.avatarUrl, description: per.description });
    } else {
      // Fall back to personaNames string array (ids may be unavailable)
      type WithPersonaNames = { personaNames?: string[] };
      const names = (t as WithPersonaNames).personaNames;
      if (Array.isArray(names) && names.length > 0) {
        names.forEach(nm => result.push({ _id: nm, name: nm }));
      }
    }
    return result;
  };

  // Populate personas list on mount/open
  useEffect(() => {
    if (!open) return;
    const local = extractPersonas(test);
    if (local.length > 0) {
      setPersonas(local);
      return;
    }
    // Fallback: fetch test details to get populated personas
    (async () => {
      try {
        const fresh = await getTestById(test._id);
        setPersonas(extractPersonas(fresh));
      } catch {
        // ignore
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, test._id]);

  // Merge with global personas to pick avatar/description
  useEffect(() => {
    if (!allPersonas || personas.length === 0) return;
    setPersonas(prev => prev.map(p => {
      const full = allPersonas.find(ap => ap._id === p._id || ap.name === p.name);
      return full ? { ...p, avatarUrl: full.avatarUrl, description: full.description } : p;
    }));
  }, [allPersonas, personas.length]);

  const handleSubmit = async () => {
    if (!selectedPersona || !runAt) return;
    if (!token) {
      toast.error("Not authenticated");
      return;
    }
    try {
      setSubmitting(true);
      const payload: Record<string, unknown> = {
        testId: test._id,
        personaId: selectedPersona,
      };
      let endpoint = "/testschedules/schedule";
      if (isRecurring) {
        // Build cron rule for daily at selected time
        const date = new Date(runAt);
        const minute = date.getUTCMinutes();
        const hour = date.getUTCHours();
        const rule = `${minute} ${hour} * * *`;
        payload["recurrenceRule"] = rule;
        endpoint = "/testschedules/recurring";
      } else {
        payload["scheduledFor"] = new Date(runAt).toISOString();
      }
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to schedule test run");
      toast.success(isRecurring ? "Recurring schedule created" : "Test run scheduled");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to schedule test run");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl max-w-md">
        <DialogHeader>
          <DialogTitle>Schedule test run</DialogTitle>
        </DialogHeader>

        {/* Persona select */}
        <section className="space-y-4 py-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Persona</label>
            <Popover open={openSelect} onOpenChange={setOpenSelect}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" className="w-full justify-between">
                  {selectedPersona
                    ? personas.find(p => p._id === selectedPersona)?.name
                    : "Select persona"}
                  <ChevronsUpDown className="size-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search persona…" className="h-9" />
                  <CommandList>
                    <CommandEmpty>No persona found.</CommandEmpty>
                    {personas.map(p => (
                      <CommandItem
                        key={p._id}
                        value={p.name}
                        onSelect={() => {
                          setSelectedPersona(p._id);
                          setOpenSelect(false);
                        }}
                      >
                        <div className="flex items-center gap-2 w-full">
                          {p.avatarUrl ? (
                            <Image src={p.avatarUrl} alt={p.name} width={24} height={24} className="rounded-full object-cover border" unoptimized />
                          ) : (
                            <span className="w-6 h-6 rounded-full flex items-center justify-center bg-muted text-[10px] font-medium text-muted-foreground border">
                              {p.name?.[0]?.toUpperCase() || "?"}
                            </span>
                          )}
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm font-medium truncate">{p.name}</span>
                            {p.description && (
                              <span className="text-xs text-muted-foreground line-clamp-2">{p.description}</span>
                            )}
                          </div>
                        </div>
                        <Check className={`ml-auto size-4 ${selectedPersona === p._id ? "opacity-100" : "opacity-0"}`} />
                      </CommandItem>
                    ))}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Date/time picker */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Run at</label>
            <input
              type="datetime-local"
              value={runAt}
              onChange={e => setRunAt(e.target.value)}
              className="w-full border rounded-md px-3 py-2 text-sm"
            />
          </div>

          {/* Recurring checkbox */}
          <div className="flex items-center gap-2">
            <Checkbox id="recurring" checked={isRecurring} onCheckedChange={v => setIsRecurring(!!v)} />
            <label htmlFor="recurring" className="text-sm select-none">
              Make recurring (daily at selected time)
            </label>
          </div>
        </section>

        <DialogFooter className="mt-6">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedPersona || !runAt || submitting}
            variant="secondary"
          >
            {isRecurring ? "Create schedule" : "Schedule"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 