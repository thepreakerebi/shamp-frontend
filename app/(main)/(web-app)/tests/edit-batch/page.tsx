"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useBatchTests } from "@/hooks/use-batch-tests";
import { useProjects } from "@/hooks/use-projects";
import { useBatchPersonas } from "@/hooks/use-batch-personas";
import BatchPersonaCommand from "../create-batch/_components/batch-persona-command";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export default function EditBatchTestPage() {
  const params = useSearchParams();
  const batchId = params.get("id");
  const router = useRouter();
  const { getBatchTestById, updateBatchTest } = useBatchTests();
  const { projects } = useProjects();
  useBatchPersonas();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ batchPersonaId?: string }>({});
  const [form, setForm] = useState({ projectId: "", batchPersonaId: "", testName: "" });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!batchId) return;
    (async () => {
      try {
        const bt = await getBatchTestById(batchId);
        setForm({
          projectId: typeof bt.project === "object" ? bt.project._id : bt.project,
          batchPersonaId: typeof bt.batchPersona === "object" ? bt.batchPersona._id : (bt.batchPersona ?? ""),
          testName: typeof bt.test === "object" && bt.test ? (bt.test.name ?? "") : "",
        });
      } catch {
        toast.error("Failed to load batch test");
        router.back();
      } finally {
        setLoading(false);
      }
    })();
  }, [batchId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchId) return;
    const errs: typeof errors = {};
    if (!form.batchPersonaId) errs.batchPersonaId = "Batch persona is required";
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try {
      await updateBatchTest(batchId, { batchPersona: form.batchPersonaId });
      toast.success("Batch test updated");
      router.push(`/tests/batch/${batchId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update batch test");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="p-4 w-full max-w-[500px] mx-auto space-y-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <div className="flex justify-end gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-32" />
        </div>
      </main>
    );
  }

  return (
    <main className="p-4 w-full max-w-[500px] mx-auto space-y-6">
      <h1 className="text-2xl font-semibold">Edit Batch Test</h1>
      <p className="text-sm text-muted-foreground">Edit a batch test by selecting a different batch personas.</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <section>
          <label className="block text-sm font-medium mb-1">Project</label>
          {/* Project is read-only in edit mode */}
          {projects && (
            <p className="text-sm text-muted-foreground">
              {projects.find(p=>p._id===form.projectId)?.name ?? form.projectId}
            </p>
          )}
        </section>
        <section>
          <label className="block text-sm font-medium mb-1">Batch Personas</label>
          <BatchPersonaCommand
            value={form.batchPersonaId}
            onChange={(id) => {
              setForm(prev => ({ ...prev, batchPersonaId: id }));
              setErrors(prev => ({ ...prev, batchPersonaId: undefined }));
            }}
          />
          {errors.batchPersonaId && <p className="text-destructive text-xs mt-1">{errors.batchPersonaId}</p>}
        </section>
        <section>
          <label className="block text-sm font-medium mb-1">Base Test</label>
          <p className="text-sm text-muted-foreground">{form.testName}</p>
        </section>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={()=>router.back()}>Cancel</Button>
          <Button type="submit" variant="default" disabled={saving} className="flex items-center gap-2">
            {saving && <Loader2 className="animate-spin size-4" />}
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </form>
    </main>
  );
} 