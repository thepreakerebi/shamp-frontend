"use client";
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useTests } from "@/hooks/use-tests";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import ProjectCommand from "./_components/project-command";
import PersonaCommand from "./_components/persona-command";

export default function CreateTestPage() {
  const { createTest } = useTests();
  const router = useRouter();

  const [form, setForm] = useState({ name: "", description: "", projectId: "", personaId: "" });
  const [errors, setErrors] = useState<{ name?: string; description?: string; projectId?: string; personaId?: string }>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: typeof errors = {};
    if (!form.name) errs.name = "Name is required";
    if (!form.description) errs.description = "Description is required";
    if (!form.projectId) errs.projectId = "Project is required";
    if (!form.personaId) errs.personaId = "Persona is required";
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setLoading(true);
    try {
      await createTest({
        name: form.name,
        description: form.description,
        project: form.projectId,
        persona: form.personaId,
      });
      toast.success("Test created");
      router.push("/tests");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create test");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="p-4 w-full max-w-[500px] mx-auto space-y-6">
      <h1 className="text-2xl font-semibold">Create Test</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <section>
          <label htmlFor="name" className="block text-sm font-medium mb-1">Name</label>
          <Input id="name" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} aria-invalid={!!errors.name} />
          {errors.name && <p className="text-destructive text-xs mt-1">{errors.name}</p>}
        </section>
        <section>
          <label htmlFor="description" className="block text-sm font-medium mb-1">Description</label>
          <Textarea id="description" value={form.description} onChange={e=>setForm({...form, description:e.target.value})} aria-invalid={!!errors.description} />
          {errors.description && <p className="text-destructive text-xs mt-1">{errors.description}</p>}
        </section>
        <section>
          <label className="block text-sm font-medium mb-1">Project</label>
          <ProjectCommand value={form.projectId} onChange={(id) => {
            setForm({ ...form, projectId: id });
            setErrors({ ...errors, projectId: undefined });
          }} />
          {errors.projectId && <p className="text-destructive text-xs mt-1">{errors.projectId}</p>}
        </section>
        <section>
          <label className="block text-sm font-medium mb-1">Persona</label>
          <PersonaCommand value={form.personaId} onChange={(id) => {
            setForm({ ...form, personaId: id });
            setErrors({ ...errors, personaId: undefined });
          }} />
          {errors.personaId && <p className="text-destructive text-xs mt-1">{errors.personaId}</p>}
        </section>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={()=>router.back()}>Cancel</Button>
          <Button type="submit" variant="default" disabled={loading} className="flex items-center gap-2">
            {loading && <Loader2 className="animate-spin size-4" />}
            {loading?"Creating…":"Create test"}
          </Button>
        </div>
      </form>
    </main>
  );
} 