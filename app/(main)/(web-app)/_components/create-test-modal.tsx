"use client";
import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTests } from "@/hooks/use-tests";
import { useProjects } from "@/hooks/use-projects";
import { usePersonas } from "@/hooks/use-personas";
import type { Persona } from "@/hooks/use-personas";
import type { Project } from "@/hooks/use-projects";

// Context to expose open state globally
const CreateTestModalContext = React.createContext<{ open: boolean; setOpen: (o: boolean) => void } | null>(null);

export function useCreateTestModal() {
  const ctx = React.useContext(CreateTestModalContext);
  if (!ctx) throw new Error("useCreateTestModal must be used within provider");
  return ctx;
}

export function CreateTestModalProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  return (
    <CreateTestModalContext.Provider value={{ open, setOpen }}>
      {children}
      <CreateTestModal />
    </CreateTestModalContext.Provider>
  );
}

function CreateTestModal() {
  const { open, setOpen } = useCreateTestModal();
  const { createTest } = useTests();
  const { projects, projectsLoading } = useProjects();
  const { personas, personasLoading } = usePersonas();

  const [form, setForm] = React.useState({ name: "", description: "", projectId: "", personaId: "" });
  const [fieldErrors, setFieldErrors] = React.useState<{ name?: string; description?: string; projectId?: string; personaId?: string }>({});
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setFieldErrors(prev => ({ ...prev, [e.target.name]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const errs: { name?: string; description?: string; projectId?: string; personaId?: string } = {};
    if (!form.name) errs.name = "Name is required";
    if (!form.description) errs.description = "Description is required";
    if (!form.projectId) errs.projectId = "Project is required";
    if (!form.personaId) errs.personaId = "Persona is required";
    if (Object.keys(errs).length) {
      setFieldErrors(errs);
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
      setOpen(false);
      setForm({ name: "", description: "", projectId: "", personaId: "" });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create test");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="rounded-3xl max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Test</DialogTitle>
          <DialogDescription>Provide the details to create a new test.</DialogDescription>
        </DialogHeader>
        {error && <div className="text-destructive text-sm mb-2">{error}</div>}
        <ScrollArea className="max-h-[60vh] pr-2">
          <form id="create-test-form" onSubmit={handleSubmit} className="space-y-4">
            <section>
              <label htmlFor="name" className="block text-sm font-medium mb-1">Name</label>
              <Input id="name" name="name" value={form.name} onChange={handleChange} disabled={loading} aria-invalid={!!fieldErrors.name} />
              {fieldErrors.name && <p className="text-destructive text-xs mt-1">{fieldErrors.name}</p>}
            </section>
            <section>
              <label htmlFor="description" className="block text-sm font-medium mb-1">Description</label>
              <Textarea id="description" name="description" value={form.description} onChange={handleChange} disabled={loading} aria-invalid={!!fieldErrors.description} />
              {fieldErrors.description && <p className="text-destructive text-xs mt-1">{fieldErrors.description}</p>}
            </section>
            <section>
              <label className="block text-sm font-medium mb-1">Project</label>
              <Select value={form.projectId} onValueChange={v => { setForm(f => ({ ...f, projectId: v })); setFieldErrors(prev=>({...prev, projectId: undefined})); }} disabled={projectsLoading || loading}>
                <SelectTrigger className="w-full h-8"><SelectValue placeholder="Select project"/></SelectTrigger>
                <SelectContent>
                  {projects?.map((p: Project) => (
                    <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldErrors.projectId && <p className="text-destructive text-xs mt-1">{fieldErrors.projectId}</p>}
            </section>
            <section>
              <label className="block text-sm font-medium mb-1">Persona</label>
              <Select
                value={form.personaId}
                onValueChange={v => setForm(f => ({ ...f, personaId: v }))}
                disabled={personasLoading || loading}
              >
                <SelectTrigger className="w-full h-8"><SelectValue placeholder="Select persona"/></SelectTrigger>
                <SelectContent>
                  {personas?.map((p: Persona) => (
                    <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldErrors.personaId && <p className="text-destructive text-xs mt-1">{fieldErrors.personaId}</p>}
            </section>
          </form>
        </ScrollArea>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={loading}>Cancel</Button>
          </DialogClose>
          <Button type="submit" form="create-test-form" disabled={loading}>
            {loading && <Loader2 className="animate-spin mr-2 h-5 w-5" />}
            {loading ? "Creating..." : "Create test"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 