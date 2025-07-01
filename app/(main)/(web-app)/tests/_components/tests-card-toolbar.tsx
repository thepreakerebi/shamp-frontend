"use client";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Filter, X } from "lucide-react";
import { useProjects, type Project } from "@/hooks/use-projects";
import { usePersonas, type Persona as PersonaType } from "@/hooks/use-personas";
import { useAuth } from "@/lib/auth";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useTests } from "@/hooks/use-tests";

export function TestsCardToolbar() {
  const [query, setQuery] = useState("");
  const { searchTests } = useTests();

  // Filter state
  const { projects } = useProjects();
  const { personas } = usePersonas();
  const { user } = useAuth();
  const [projSel, setProjSel] = useState<string[]>([]);
  const [persSel, setPersSel] = useState<string[]>([]);
  const [runStatus, setRunStatus] = useState<string>("any");
  const [role, setRole] = useState<string>("any");

  const toggleId = (arr: string[], id: string, setter: (v: string[]) => void) => {
    if (arr.includes(id)) setter(arr.filter(i => i !== id));
    else setter([...arr, id]);
  };

  const buildParams = (): Record<string,string> => {
    const params: Record<string,string> = {};
    if (query) {
      const lower = query.trim().toLowerCase();
      if (lower === 'you' && user) {
        const full = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
        if (full) params.q = full;
      } else {
        params.q = query;
      }
    }
    if (projSel.length) params.project = projSel.join(",");
    if (persSel.length) params.persona = persSel.join(",");
    if (runStatus !== "any") params.runStatus = runStatus;
    if (role !== "any") params.role = role;
    return params;
  };

  const applyFilters = () => searchTests(buildParams());

  // Debounced quick search
  useEffect(()=>{
    const t = setTimeout(()=>{ searchTests(buildParams()); },400);
    return ()=> clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[query, projSel, persSel, runStatus, role]);

  return (
    <section className="sticky top-[60px] z-10 bg-background flex items-center justify-between gap-2 py-4">
      <div className="relative max-w-xs">
        <Input
          placeholder="Search tests…"
          value={query}
          onChange={e=>setQuery(e.target.value)}
          className="pr-8"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setQuery("")}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-transparent"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
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
            <div>
              <p className="text-sm font-medium mb-1">Run status</p>
              <Select value={runStatus} onValueChange={setRunStatus}>
                <SelectTrigger className="w-full h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  <SelectItem value="never">Never run</SelectItem>
                  <SelectItem value="success">Has success</SelectItem>
                  <SelectItem value="failed">Has failure</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="text-sm font-medium mb-1">Creator role</p>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="w-full h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="ghost" onClick={()=>{
                setProjSel([]);setPersSel([]);setRunStatus("any");setRole("any");searchTests({});
              }}>Reset</Button>
              <Button size="sm" onClick={applyFilters}>Apply</Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </section>
  );
} 