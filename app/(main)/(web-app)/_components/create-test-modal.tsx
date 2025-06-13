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
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandEmpty, CommandItem } from "@/components/ui/command";
import { ChevronsUpDown, Check } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTests } from "@/hooks/use-tests";
import { useProjects } from "@/hooks/use-projects";
import { usePersonas } from "@/hooks/use-personas";
import type { Persona } from "@/hooks/use-personas";
import Image from "next/image";

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
  const [openProject, setOpenProject] = React.useState(false);
  const [openPersona, setOpenPersona] = React.useState(false);

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
              <Popover open={openProject} onOpenChange={setOpenProject}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openProject}
                    className="w-full justify-between"
                    disabled={projectsLoading || loading}
                  >
                    {form.projectId
                      ? projects?.find(p => p._id === form.projectId)?.name
                      : "Select project"}
                    <ChevronsUpDown className="size-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0 max-h-60 overflow-y-auto" align="start">
                  <Command>
                    <CommandInput placeholder="Search project..." className="h-9" />
                    <ScrollArea className="max-h-60">
                      <CommandList>
                        <CommandEmpty>No project found.</CommandEmpty>
                        {projects?.map(p => (
                          <CommandItem
                            key={p._id}
                            value={p.name}
                            onSelect={() => {
                              setForm(f => ({ ...f, projectId: p._id }));
                              setFieldErrors(prev => ({ ...prev, projectId: undefined }));
                              setOpenProject(false);
                            }}
                          >
                            {p.name}
                            <Check className={`ml-auto size-4 ${form.projectId === p._id ? 'opacity-100' : 'opacity-0'}`} />
                          </CommandItem>
                        ))}
                      </CommandList>
                    </ScrollArea>
                  </Command>
                </PopoverContent>
              </Popover>
              {fieldErrors.projectId && <p className="text-destructive text-xs mt-1">{fieldErrors.projectId}</p>}
            </section>
            <section>
              <label className="block text-sm font-medium mb-1">Persona</label>
              <Popover open={openPersona} onOpenChange={setOpenPersona}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openPersona}
                    className="w-full justify-between"
                    disabled={personasLoading || loading}
                  >
                    {form.personaId
                      ? personas?.find(per => per._id === form.personaId)?.name
                      : "Select persona"}
                    <ChevronsUpDown className="size-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0 max-h-60 overflow-y-auto" align="start">
                  <Command>
                    <CommandInput placeholder="Search persona..." className="h-9" />
                    <ScrollArea className="max-h-60">
                      <CommandList>
                        <CommandEmpty>No persona found.</CommandEmpty>
                        {personas?.map((p: Persona) => (
                          <CommandItem
                            key={p._id}
                            value={p.name}
                            onSelect={() => {
                              setForm(f => ({ ...f, personaId: p._id }));
                              setFieldErrors(prev => ({ ...prev, personaId: undefined }));
                              setOpenPersona(false);
                            }}
                          >
                            <div className="flex items-center gap-2">
                              {p.avatarUrl ? (
                                <Image
                                  src={p.avatarUrl}
                                  alt={p.name}
                                  width={24}
                                  height={24}
                                  className="rounded-full object-cover border border-border bg-muted"
                                  unoptimized
                                />
                              ) : (
                                <span className="w-6 h-6 rounded-full flex items-center justify-center bg-muted text-[10px] font-medium text-muted-foreground border border-border">
                                  {p.name?.[0]?.toUpperCase() || "?"}
                                </span>
                              )}
                              <span>{p.name}</span>
                            </div>
                            <Check className={`ml-auto size-4 ${form.personaId === p._id ? 'opacity-100' : 'opacity-0'}`} />
                          </CommandItem>
                        ))}
                      </CommandList>
                    </ScrollArea>
                  </Command>
                </PopoverContent>
              </Popover>
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