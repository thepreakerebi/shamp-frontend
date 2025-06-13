"use client";
import { Table } from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Filter } from "lucide-react";
import { useProjects, type Project } from "@/hooks/use-projects";
import { usePersonas, type Persona as PersonaType } from "@/hooks/use-personas";
import { useAuth } from "@/lib/auth";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useTests } from "@/hooks/use-tests";

interface ToolbarProps<T> {
  table: Table<T>;
  onFilter: (params: Record<string, string>) => void;
}

export function TestsTableToolbar<T>({ table, onFilter }: ToolbarProps<T>) {
  const [query, setQuery] = useState("");

  const selected = table.getSelectedRowModel().rows.length;

  // Filter state
  const { projects } = useProjects();
  const { personas } = usePersonas();
  const { user } = useAuth();
  const [projSel, setProjSel] = useState<string[]>([]);
  const [persSel, setPersSel] = useState<string[]>([]);
  const [runStatus, setRunStatus] = useState<string>("any");
  const [role, setRole] = useState<string>("any");
  const { clearFilters } = useTests();

  const toggleId = (arr: string[], id: string, setter: (v: string[]) => void) => {
    if (arr.includes(id)) {
      setter(arr.filter(i => i !== id));
    } else {
      setter([...arr, id]);
    }
  };

  const applyFilters = () => {
    const params: Record<string, string> = {};
    if (query) {
      const lower = query.trim().toLowerCase();
      if (lower === 'you' && user) {
        const full = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
        if (full) params.q = full;
      } else {
        params.q = query;
      }
    }
    if (projSel.length > 0) params.project = projSel.join(",");
    if (persSel.length > 0) params.persona = persSel.join(",");
    if (runStatus && runStatus !== "any") params.runStatus = runStatus;
    if (role && role !== "any") params.role = role;
    onFilter(params);
  };

  // Debounced quick search on query change
  useEffect(() => {
    const timeout = setTimeout(() => {
      const params: Record<string, string> = {};
      if (query) {
        const lower = query.trim().toLowerCase();
        if (lower === 'you' && user) {
          const full = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
          if (full) params.q = full;
        } else {
          params.q = query;
        }
      }
      if (projSel.length > 0) params.project = projSel.join(",");
      if (persSel.length > 0) params.persona = persSel.join(",");
      if (runStatus && runStatus !== "any") params.runStatus = runStatus;
      if (role && role !== "any") params.role = role;
      onFilter(params);
    }, 400);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  return (
    <section className="flex items-center justify-between gap-2 mb-2">
      <Input
        placeholder="Search tests…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="max-w-xs"
      />
      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1"><Filter className="w-4 h-4"/> Filters</Button>
          </PopoverTrigger>
          <PopoverContent align="end">
            <div className="space-y-4">
              {projects && projects.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-1">Projects</p>
                  <ScrollArea className="h-24 border rounded p-2">
                    {projects.map((p: Project) => (
                      <label key={p._id} className="flex items-center gap-2 py-1 text-sm">
                        <Checkbox
                          checked={projSel.includes(p._id)}
                          onCheckedChange={() => toggleId(projSel, p._id, setProjSel)}
                        />
                        <span>{p.name}</span>
                      </label>
                    ))}
                  </ScrollArea>
                </div>
              )}
              {personas && personas.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-1">Personas</p>
                  <ScrollArea className="h-24 border rounded p-2">
                    {personas.map((p: PersonaType) => (
                      <label key={p._id} className="flex items-center gap-2 py-1 text-sm">
                        <Checkbox
                          checked={persSel.includes(p._id)}
                          onCheckedChange={() => toggleId(persSel, p._id, setPersSel)}
                        />
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
                <Button size="sm" variant="ghost" onClick={()=> {
                  setProjSel([]);
                  setPersSel([]);
                  setRunStatus("any");
                  setRole("any");
                  clearFilters();
                }}>Reset</Button>
                <Button size="sm" onClick={applyFilters}>Apply</Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
        {selected > 0 && <span className="text-sm mr-2">{selected} selected</span>}
      </div>
    </section>
  );
} 