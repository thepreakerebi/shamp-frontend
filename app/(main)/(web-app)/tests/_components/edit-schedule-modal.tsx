"use client";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useTestSchedules } from "@/hooks/use-test-schedules";
import { Loader2 } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { ChevronsUpDown } from "lucide-react";
import { format } from "date-fns";

interface Props {
  open: boolean;
  setOpen: (o: boolean) => void;
  scheduleId: string;
  currentRule?: string;
}

export function EditScheduleModal({ open, setOpen, scheduleId, currentRule }: Props) {
  // Parse current rule to determine frequency and keep hour/minute
  const parseRule = (rule?: string) => {
    if (!rule) return { min: 0, hr: 9, type: "daily" as "daily"|"weekly"|"monthly" };
    const parts = rule.trim().split(/\s+/);
    if (parts.length !==5) return { min:0, hr:9, type:"daily"};
    const [minStr, hrStr, domStr,, dowStr] = parts;
    const min = parseInt(minStr,10); const hr = parseInt(hrStr,10);
    let type: "daily"|"weekly"|"monthly" = "daily";
    if(domStr === "*" && dowStr !== "*") type = "weekly";
    else if(domStr !== "*" && dowStr === "*") type = "monthly";
    return { min, hr, type };
  };

  const init = parseRule(currentRule);
  const [freq, setFreq] = useState<"daily"|"weekly"|"monthly">(()=>init.type as "daily"|"weekly"|"monthly");
  const [saving, setSaving] = useState(false);
  const [runDate, setRunDate] = useState<Date>(()=>new Date());
  const [runHour, setRunHour] = useState<string>(()=>String(init.hr).padStart(2,"0"));
  const [runMinute, setRunMinute] = useState<string>(()=>String(init.min).padStart(2,"0"));
  const [dateOpen,setDateOpen]=useState(false);

  const buildRule = () => {
    const min = parseInt(runMinute,10);
    const hr = parseInt(runHour,10);
    if (freq === "daily") return `${min} ${hr} * * *`;
    if (freq === "weekly") {
      const dow = runDate.getUTCDay();
      return `${min} ${hr} * * ${dow}`;
    }
    const dom = runDate.getUTCDate();
    return `${min} ${hr} ${dom} * *`;
  };

  const { updateRecurringSchedule } = useTestSchedules();

  const handleSave = async () => {
    const newRule = buildRule();
    try {
      setSaving(true);
      await updateRecurringSchedule(scheduleId, newRule);
      setOpen(false);
    } catch {
      // error toast handled in hook
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={o=>!saving && setOpen(o)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Recurrence Rule</DialogTitle>
          <DialogDescription>Select a frequency and time</DialogDescription>
        </DialogHeader>
        <section className="space-y-4">
          <RadioGroup value={freq} onValueChange={(v)=>setFreq(v as "daily"|"weekly"|"monthly")} className="space-y-2">
            <div className="flex items-center gap-2">
              <RadioGroupItem className="data-[state=checked]:bg-secondary data-[state=checked]:text-secondary-foreground" id="daily" value="daily" />
              <label htmlFor="daily" className="text-sm select-none">Daily</label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem className="data-[state=checked]:bg-secondary data-[state=checked]:text-secondary-foreground" id="weekly" value="weekly" />
              <label htmlFor="weekly" className="text-sm select-none">Weekly</label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem className="data-[state=checked]:bg-secondary data-[state=checked]:text-secondary-foreground" id="monthly" value="monthly" />
              <label htmlFor="monthly" className="text-sm select-none">Monthly</label>
            </div>
          </RadioGroup>

          {freq!=="daily" && (
            <section className="space-y-2">
              <label className="text-sm font-medium">{freq==="weekly"?"Run on" : "Run day"}</label>
              <Popover open={dateOpen} onOpenChange={setDateOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    {format(runDate, "PPP")}
                    <ChevronsUpDown className="size-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0" align="start">
                  <Calendar mode="single" selected={runDate} onSelect={(d)=>{if(d) setRunDate(d); setDateOpen(false);}} initialFocus />
                </PopoverContent>
              </Popover>
            </section>
          )}

          <section className="space-y-2">
            <label className="text-sm font-medium">Time (UTC)</label>
            <div className="flex items-center gap-2">
              <Select value={runHour} onValueChange={setRunHour}>
                <SelectTrigger className="w-24 justify-between"><SelectValue placeholder="HH"/></SelectTrigger>
                <SelectContent>{Array.from({length:24}).map((_,i)=>(<SelectItem key={i} value={String(i).padStart(2,"0")}>{String(i).padStart(2,"0")}</SelectItem>))}</SelectContent>
              </Select>
              <span className="text-muted-foreground">:</span>
              <Select value={runMinute} onValueChange={setRunMinute}>
                <SelectTrigger className="w-24 justify-between"><SelectValue placeholder="MM"/></SelectTrigger>
                <SelectContent>{['00','15','30','45'].map(m=>(<SelectItem key={m} value={m}>{m}</SelectItem>))}</SelectContent>
              </Select>
            </div>
          </section>
        </section>
        <DialogFooter>
          <Button variant="ghost" onClick={()=>setOpen(false)} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 