"use client";
import React, { useState, useEffect, useMemo } from "react";
// import { Button } from "@/components/ui/button";
// import { Loader2 } from "lucide-react";
import { useBatchTests } from "@/hooks/use-batch-tests";
import { useProjects } from "@/hooks/use-projects";
import { useBatchPersonas } from "@/hooks/use-batch-personas";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import ProjectCommand from "../create/_components/project-command";
import BatchPersonaCommand from "./_components/batch-persona-command";
import TestCommand from "./_components/test-command";
import { UnsavedChangesDialog } from "@/components/ui/unsaved-changes-dialog";

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic';

export default function CreateBatchTestPage() {
  const { createBatchTest } = useBatchTests();
  const router = useRouter();
  // Preload projects & personas
  useProjects();
  useBatchPersonas();

  const [form, setForm] = useState({ projectId: "", batchPersonaId: "", testId: "" });
  const [errors, setErrors] = useState<{ projectId?: string; batchPersonaId?: string; testId?: string }>({});
  const [loading, setLoading] = useState(false);

  const [confirmLeaveOpen, setConfirmLeaveOpen] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  const isDirty = useMemo(()=>{
    if (loading) return false;
    return form.projectId || form.batchPersonaId || form.testId;
  }, [form, loading]);

  // Broadcast dirty and loading states for Topbar buttons
  useEffect(()=>{
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('create-batch-test-dirty', { detail: isDirty }));
    }
  }, [isDirty]);
  useEffect(()=>{
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('create-batch-test-loading', { detail: loading }));
    }
  }, [loading]);

  useEffect(()=>{
    const handler = (e: MouseEvent)=>{
      const anchor = (e.target as HTMLElement).closest('a[data-slot="breadcrumb-link"]') as HTMLAnchorElement|null;
      if(!anchor) return;
      if(!isDirty) return;
      if(anchor.href===window.location.href) return;
      e.preventDefault();
      setPendingHref(anchor.href);
      setConfirmLeaveOpen(true);
    };
    document.addEventListener('click', handler, true);
    return ()=> document.removeEventListener('click', handler, true);
  }, [isDirty]);

  // Cancel handled from Topbar via create-batch-test-dirty broadcast

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: typeof errors = {};
    if (!form.projectId) errs.projectId = "Project is required";
    if (!form.batchPersonaId) errs.batchPersonaId = "Batch persona is required";
    if (!form.testId) errs.testId = "Test is required";
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      const payload = {
        project: form.projectId,
        batchPersona: form.batchPersonaId,
        test: form.testId,
      } satisfies Parameters<typeof createBatchTest>[0];
      await createBatchTest(payload);
      toast.success("Batch test created");
      router.push("/tests?tab=batch");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create batch test");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="p-4 w-full max-w-[500px] mx-auto space-y-6">
      <h1 className="text-2xl font-semibold">Create Batch Test</h1>
      <p className="text-sm text-muted-foreground">
        Create a batch test to run a test on a batch of personas at once.
      </p>
      <form onSubmit={handleSubmit} id="create-batch-test-form" className="space-y-4">
        <section>
          <label className="block text-sm font-medium mb-1">Project</label>
          <ProjectCommand value={form.projectId} onChange={(id: string)=>{ setForm({...form, projectId:id}); setErrors({...errors, projectId:undefined}); }} />
          {errors.projectId && <p className="text-destructive text-xs mt-1">{errors.projectId}</p>}
        </section>
        <section>
          <label className="block text-sm font-medium mb-1">Batch Persona</label>
          <BatchPersonaCommand value={form.batchPersonaId} onChange={(id: string)=>{ setForm({...form, batchPersonaId:id}); setErrors({...errors, batchPersonaId:undefined}); }} />
          {errors.batchPersonaId && <p className="text-destructive text-xs mt-1">{errors.batchPersonaId}</p>}
        </section>
        <section>
          <label className="block text-sm font-medium mb-1">Base Test</label>
          <TestCommand value={form.testId} onChange={(id: string)=>{ setForm({...form, testId:id}); setErrors({...errors, testId:undefined}); }} />
          {errors.testId && <p className="text-destructive text-xs mt-1">{errors.testId}</p>}
        </section>
        {/* Note: Submission handled via Topbar button */}
      </form>
      <UnsavedChangesDialog
        open={confirmLeaveOpen}
        onOpenChange={setConfirmLeaveOpen}
        onDiscard={() => {
          setConfirmLeaveOpen(false);
          if (pendingHref) {
            router.push(pendingHref);
          } else {
            router.back();
          }
        }}
      />
    </main>
  );
} 