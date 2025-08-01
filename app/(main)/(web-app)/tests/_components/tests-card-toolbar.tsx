"use client";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Filter, X, Loader2, Pause, Play, Square } from "lucide-react";
import { useProjects, type Project } from "@/hooks/use-projects";
import { toast } from "sonner";
import { usePersonas, type Persona as PersonaType } from "@/hooks/use-personas";
import { useAuth } from "@/lib/auth";
import { useBilling } from "@/hooks/use-billing";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useTests } from "@/hooks/use-tests";

interface TestsCardToolbarProps {
  projectId?: string; // when inside ProjectTestsTabContent
  workspaceControls?: boolean; // global tests list
}

import ProjectSelectTestsDialog from "@/app/(main)/(web-app)/home/[projectId]/_components/select-tests-dialog";
import WorkspaceSelectTestsDialog from "./select-workspace-tests-dialog";

import { useUsers } from "@/hooks/use-users";


export function TestsCardToolbar({ projectId, workspaceControls = false }: TestsCardToolbarProps) {
  const [query, setQuery] = useState("");
  // Project suite controls
  const { runProjectTests, pauseProjectTests, resumeProjectTests, stopProjectTests, getProjectTestruns } = useProjects();
  const { projects } = useProjects();
  const { summary } = useBilling();
  const { runWorkspaceTests, pauseWorkspaceTests, resumeWorkspaceTests, stopWorkspaceTests } = useUsers();
  const isFreePlan = !summary?.products || (
    Array.isArray(summary.products) &&
    ((summary.products[0] as unknown as { id?: string })?.id === 'free')
  );
  const storeProject = projects?.find(p=>p._id===projectId);
  const [selectOpen,setSelectOpen] = useState(false);
  const [wsSelectOpen, setWsSelectOpen] = useState(false);

  const [optimisticStatus,setOptimisticStatus] = useState<Project["testsRunStatus"] | undefined>();
  const effectiveStatus: Project["testsRunStatus"] = optimisticStatus ?? storeProject?.testsRunStatus ?? 'idle';
  const [actionLoading,setActionLoading]=useState(false);
  // sync with store
  useEffect(() => {
    if (storeProject) {
      setOptimisticStatus(storeProject.testsRunStatus);
    }
  }, [storeProject?.testsRunStatus, storeProject]);
  const { searchTests } = useTests();

  // Handlers for project suite controls
  const handleRun = async () => {
    if (actionLoading) return;
    if (workspaceControls) {
      setActionLoading(true);
      try {
        await runWorkspaceTests();
        toast.success("Workspace tests started");
        setOptimisticStatus('running');
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Failed to start tests');
      } finally { setActionLoading(false); }
      return;
    }
    if (!projectId) return;
    setActionLoading(true);
    try {
      await runProjectTests(projectId);
      // Immediately fetch latest runs so badges update without tab switch
      try { await getProjectTestruns(projectId, true); } catch { /* ignore */ }
      toast.success("Project tests started");
      setOptimisticStatus('running');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to start tests');
    } finally { setActionLoading(false); }
  };
  const handlePause = async () => {
    if (actionLoading) return;
    if (workspaceControls) {
      setActionLoading(true);
      try { await pauseWorkspaceTests(); toast.success('Tests paused'); setOptimisticStatus('paused'); }
      catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Failed'); }
      finally { setActionLoading(false); }
      return;
    }
    if (!projectId) return;
    setActionLoading(true);
    try {
      await pauseProjectTests(projectId);
      toast.success('Tests paused');
      setOptimisticStatus('paused');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    } finally { setActionLoading(false); } };
  const handleResume = async () => {
    if (actionLoading) return;
    if (workspaceControls) {
      setActionLoading(true);
      try { await resumeWorkspaceTests(); toast.success('Tests resumed'); setOptimisticStatus('running'); }
      catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Failed'); }
      finally { setActionLoading(false); }
      return;
    }
    if (!projectId) return;
    setActionLoading(true);
    try {
      await resumeProjectTests(projectId);
      toast.success('Tests resumed');
      setOptimisticStatus('running');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    } finally { setActionLoading(false); } };
  const handleStop = async () => {
    if (actionLoading) return;
    if (workspaceControls) {
      setActionLoading(true);
      try { await stopWorkspaceTests(); toast.success('Tests stopped'); setOptimisticStatus('done'); }
      catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Failed'); }
      finally { setActionLoading(false); }
      return;
    }
    if (!projectId) return;
    setActionLoading(true);
    try {
      await stopProjectTests(projectId);
      toast.success('Tests stopped');
      setOptimisticStatus('done');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    } finally { setActionLoading(false); } };


  // Filter state
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
    <section className="sticky top-[60px] z-10 bg-background flex items-center gap-4 py-4">
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
            {!projectId && projects && projects.length>0 && (
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
      {workspaceControls && !projectId && (
        <>
        <WorkspaceSelectTestsDialog open={wsSelectOpen} setOpen={setWsSelectOpen} onStarted={()=>setOptimisticStatus('running')} />
        <section className="flex items-center gap-2 ml-auto">
          {!isFreePlan && (effectiveStatus==='idle' || effectiveStatus==='done') && (
            <Button size="sm" variant="outline" onClick={() => setWsSelectOpen(true)} className="gap-1">
              Select tests
            </Button>
          )}
          {!isFreePlan && (effectiveStatus==='idle' || effectiveStatus==='done') && (
            <Button size="sm" variant="secondary" disabled={actionLoading} onClick={handleRun} className="gap-1">
              {actionLoading && <Loader2 className="w-4 h-4 animate-spin"/>} Run tests
            </Button>
          )}
          {effectiveStatus==='running' && (
            <>
              <Button size="sm" variant="outline" disabled={actionLoading} onClick={handlePause} className="gap-1">
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Pause className="w-4 h-4"/>} Pause
              </Button>
              <Button size="sm" variant="destructive" disabled={actionLoading} onClick={handleStop} className="gap-1">
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Square className="w-4 h-4"/>} Stop
              </Button>
            </>
          )}
          {effectiveStatus==='paused' && (
            <>
              <Button size="sm" variant="outline" disabled={actionLoading} onClick={handleResume} className="gap-1">
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Play className="w-4 h-4"/>} Resume
              </Button>
              <Button size="sm" variant="destructive" disabled={actionLoading} onClick={handleStop} className="gap-1">
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Square className="w-4 h-4"/>} Stop
              </Button>
            </>
          )}
        </section>
        </>
      )}

      {projectId && (
        <>
               <section className="flex items-center gap-2 ml-auto">
                 {!isFreePlan && (effectiveStatus==='idle' || effectiveStatus==='done') && (
                 <Button size="sm" variant="outline" onClick={()=>setSelectOpen(true)} className="gap-1">
                   Select tests
                 </Button>
               )}
                 <ProjectSelectTestsDialog projectId={projectId} open={selectOpen} setOpen={setSelectOpen} onStarted={()=>setOptimisticStatus('running')} />
          {!isFreePlan && (effectiveStatus==='idle' || effectiveStatus==='done') && (
            <Button size="sm" variant="secondary" disabled={actionLoading} onClick={handleRun} className="gap-1">
              {actionLoading && <Loader2 className="w-4 h-4 animate-spin"/>} Run tests
            </Button>
          )}
          {effectiveStatus==='running' && (
            <>
              <Button size="sm" variant="outline" disabled={actionLoading} onClick={handlePause} className="gap-1">
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Pause className="w-4 h-4"/>} Pause
              </Button>
              <Button size="sm" variant="destructive" disabled={actionLoading} onClick={handleStop} className="gap-1">
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Square className="w-4 h-4"/>} Stop
              </Button>
            </>
          )}
          {effectiveStatus==='paused' && (
            <>
              <Button size="sm" variant="outline" disabled={actionLoading} onClick={handleResume} className="gap-1">
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Play className="w-4 h-4"/>} Resume
              </Button>
              <Button size="sm" variant="destructive" disabled={actionLoading} onClick={handleStop} className="gap-1">
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Square className="w-4 h-4"/>} Stop
              </Button>
            </>
          )}
        </section>
        </>
      )}

      
    </section>
  );
} 