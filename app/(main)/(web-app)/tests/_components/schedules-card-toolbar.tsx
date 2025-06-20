"use client";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Filter } from "lucide-react";
import { useProjects, type Project } from "@/hooks/use-projects";
import { usePersonas, type Persona as PersonaType } from "@/hooks/use-personas";
import { useTestSchedules } from "@/hooks/use-test-schedules";

export function SchedulesCardToolbar() {
  const [query, setQuery] = useState("");
  const { fetchSchedules } = useTestSchedules();

  const { projects } = useProjects();
  const { personas } = usePersonas();

  const [projSel, setProjSel] = useState<string[]>([]);
  const [persSel, setPersSel] = useState<string[]>([]);

  const toggleId = (arr: string[], id: string, setter: (v: string[]) => void) => {
    if (arr.includes(id)) setter(arr.filter(i => i !== id));
    else setter([...arr, id]);
  };

  // Debounced search
  useEffect(()=>{
    const t = setTimeout(()=>{ /* TODO integrate search API */ },400);
    return ()=> clearTimeout(t);
  },[query, projSel, persSel]);

  return (
    <section className="sticky top-[60px] z-10 bg-background flex items-center justify-between gap-2 py-4">
      <Input
        placeholder="Search schedules…"
        value={query}
        onChange={e=>setQuery(e.target.value)}
        className="max-w-xs"
      />
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1"><Filter className="w-4 h-4"/> Filters</Button>
        </PopoverTrigger>
        <PopoverContent align="end">
          <div className="space-y-4">
            {projects && projects.length>0 && (
              <div>
                <p className="text-sm font-medium mb-1">Projects</p>
                <ScrollArea className="h-24 border rounded p-2">
                  {projects.map((p:Project)=>(
                    <label key={p._id} className="flex items-center gap-2 py-1 text-sm">
                      <Checkbox checked={projSel.includes(p._id)} onCheckedChange={()=>toggleId(projSel,p._id,setProjSel)} />
                      <span>{p.name}</span>
                    </label>
                  ))}
                </ScrollArea>
              </div>
            )}
            {personas && personas.length>0 && (
              <div>
                <p className="text-sm font-medium mb-1">Personas</p>
                <ScrollArea className="h-24 border rounded p-2">
                  {personas.map((p:PersonaType)=>(
                    <label key={p._id} className="flex items-center gap-2 py-1 text-sm">
                      <Checkbox checked={persSel.includes(p._id)} onCheckedChange={()=>toggleId(persSel,p._id,setPersSel)} />
                      <span>{p.name}</span>
                    </label>
                  ))}
                </ScrollArea>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="ghost" onClick={()=>{ setProjSel([]); setPersSel([]); /* reset search */ setQuery(""); fetchSchedules(); }}>Reset</Button>
              <Button size="sm" onClick={()=>{/* TODO apply filters*/}}>Apply</Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </section>
  );
} 