"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useBatchTests } from "@/hooks/use-batch-tests";
import { useProjects } from "@/hooks/use-projects";
import { useBatchPersonas } from "@/hooks/use-batch-personas";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import ProjectCommand from "../create/_components/project-command";
import BatchPersonaCommand from "./_components/batch-persona-command";
import TestCommand from "./_components/test-command";

export default function CreateBatchTestPage() {
  const { createBatchTest } = useBatchTests();
  const router = useRouter();
  // Preload projects & personas
  useProjects();
  useBatchPersonas();

  const [form, setForm] = useState({ projectId: "", batchPersonaId: "", testId: "" });
  const [errors, setErrors] = useState<{ projectId?: string; batchPersonaId?: string; testId?: string }>({});
  const [loading, setLoading] = useState(false);

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
      router.push("/tests?tab=groups");
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
      <form onSubmit={handleSubmit} className="space-y-4">
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
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={()=>router.back()}>Cancel</Button>
          <Button type="submit" variant="default" disabled={loading} className="flex items-center gap-2">
            {loading && <Loader2 className="animate-spin size-4" />}
            {loading ? "Creating…" : "Create batch test"}
          </Button>
        </div>
      </form>
    </main>
  );
} 