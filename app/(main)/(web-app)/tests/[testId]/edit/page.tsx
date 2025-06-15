"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTests } from "@/hooks/use-tests";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import ProjectCommand from "../../create/_components/project-command";
import PersonaCommand from "../../create/_components/persona-command";
import { toast } from "sonner";

export default function EditTestPage() {
  const { testId } = useParams<{ testId: string }>();
  const { tests, updateTest, getTestById } = useTests();
  const router = useRouter();

  const existing = tests?.find(t => t._id === testId);

  // Helpers to extract id whether value is string or populated object
  const getId = (value: unknown): string => {
    if (!value) return "";
    if (typeof value === "string") return value;
    if (typeof value === "object" && value && (value as { _id?: string })._id) {
      return (value as { _id: string })._id;
    }
    return "";
  };

  const [initialLoaded, setInitialLoaded] = useState(!!existing);
  const [form, setForm] = useState<{ name: string; description: string; projectId: string; personaId: string }>(() => {
    const firstPersonaId = (() => {
      if (!existing) return "";
      const e = existing as { personaNames?: string[]; persona?: unknown };
      if (Array.isArray(e.personaNames) && e.personaNames.length) {
        return ""; // cannot resolve id from name list
      }
      return getId(e.persona);
    })();
    return {
      name: existing?.name || "",
      description: existing?.description || "",
      projectId: getId(existing?.project),
      personaId: firstPersonaId,
    };
  });
  const [errors, setErrors] = useState<{ name?: string; description?: string; projectId?: string; personaId?: string }>({});
  const [saving, setSaving] = useState(false);

  // fetch if not present
  useEffect(() => {
    if (!existing && testId) {
      (async () => {
        const t = await getTestById(testId);
        const firstPersonaId = (t as { persona?: unknown }).persona ? getId((t as { persona?: unknown }).persona) : "";
        setForm({
          name: t.name,
          description: t.description || "",
          projectId: getId(t.project),
          personaId: firstPersonaId,
        });
        setInitialLoaded(true);
      })();
    }
  }, [existing, testId, getTestById]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: typeof errors = {};
    if (!form.name) errs.name = "Name is required";
    if (!form.description) errs.description = "Description is required";
    if (!form.projectId) errs.projectId = "Project is required";
    if (!form.personaId) errs.personaId = "Persona is required";
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try{
      await updateTest(testId, { name: form.name, description: form.description, project: form.projectId, persona: form.personaId });
      toast.success("Test updated");
      router.push(`/tests`);
    }catch(err){
      toast.error(err instanceof Error? err.message : "Failed to update test");
    }finally{ setSaving(false);}  
  };

  if(!initialLoaded){
    return <main className="p-6 text-center">Loading…</main>;
  }

  return (
    <main className="p-4 w-full max-w-[500px] mx-auto space-y-6">
      <h1 className="text-2xl font-semibold">Edit Test</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <section>
          <label htmlFor="name" className="block text-sm font-medium mb-1">Name</label>
          <Input id="name" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} aria-invalid={!!errors.name} />
          {errors.name && <p className="text-destructive text-xs mt-1">{errors.name}</p>}
        </section>
        <section>
          <label htmlFor="description" className="block text-sm font-medium mb-1">Description</label>
          <Textarea id="description" value={form.description} onChange={e=>setForm({...form, description:e.target.value})} aria-invalid={!!errors.description}/>
          {errors.description && <p className="text-destructive text-xs mt-1">{errors.description}</p>}
        </section>
        <section>
          <label className="block text-sm font-medium mb-1">Project</label>
          <ProjectCommand value={form.projectId} onChange={(id: string)=>{ setForm({...form, projectId:id}); setErrors({...errors, projectId: undefined}); }} />
          {errors.projectId && <p className="text-destructive text-xs mt-1">{errors.projectId}</p>}
        </section>
        <section>
          <label className="block text-sm font-medium mb-1">Persona</label>
          <PersonaCommand value={form.personaId} onChange={(id: string)=>{ setForm({...form, personaId:id}); setErrors({...errors, personaId: undefined}); }} />
          {errors.personaId && <p className="text-destructive text-xs mt-1">{errors.personaId}</p>}
        </section>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={()=>router.back()}>Cancel</Button>
          <Button type="submit" disabled={saving} className="flex items-center gap-2">
            {saving && <Loader2 className="animate-spin size-4" />}
            {saving?"Saving…":"Save changes"}
          </Button>
        </div>
      </form>
    </main>
  );
} 