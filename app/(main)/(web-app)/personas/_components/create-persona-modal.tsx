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
import { Plus, Loader2, Trash } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { usePersonas } from "@/hooks/use-personas";

// Context for global modal control
const CreatePersonaModalContext = React.createContext<{
  open: boolean;
  setOpen: (open: boolean) => void;
} | null>(null);

export function useCreatePersonaModal() {
  const ctx = React.useContext(CreatePersonaModalContext);
  if (!ctx) throw new Error("useCreatePersonaModal must be used within CreatePersonaModalProvider");
  return ctx;
}

export function CreatePersonaModalProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  return (
    <CreatePersonaModalContext.Provider value={{ open, setOpen }}>
      {children}
      <CreatePersonaModal />
    </CreatePersonaModalContext.Provider>
  );
}

function CreatePersonaModal() {
  const { open, setOpen } = useCreatePersonaModal();
  const [form, setForm] = React.useState({
    name: "",
    description: "",
    background: "",
    gender: "",
  });
  const [goals, setGoals] = React.useState<string[]>([]);
  const [frustrations, setFrustrations] = React.useState<string[]>([]);
  const [traits, setTraits] = React.useState<string[]>([]);
  const [preferredDevices, setPreferredDevices] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<{ name?: string; description?: string }>({});
  const { createPersona } = usePersonas();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setFieldErrors((prev) => ({ ...prev, [e.target.name]: undefined }));
  };

  // Dynamic list handlers
  const handleListChange = (setter: React.Dispatch<React.SetStateAction<string[]>>, idx: number, value: string) => {
    setter((prev) => prev.map((item, i) => (i === idx ? value : item)));
  };
  const addListItem = (setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter((prev) => [...prev, ""]);
  };
  const removeListItem = (setter: React.Dispatch<React.SetStateAction<string[]>>, idx: number) => {
    setter((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    let hasError = false;
    const newFieldErrors: { name?: string; description?: string } = {};
    if (!form.name) {
      newFieldErrors.name = "Persona name is required.";
      hasError = true;
    }
    if (!form.description) {
      newFieldErrors.description = "Description is required.";
      hasError = true;
    }
    if (hasError) {
      setFieldErrors(newFieldErrors);
      return;
    }
    setLoading(true);
    try {
      await createPersona({
        name: form.name,
        description: form.description,
        background: form.background || undefined,
        gender: form.gender ? form.gender : undefined,
        goals: goals.filter((g) => g.trim()).length ? goals.filter((g) => g.trim()) : undefined,
        frustrations: frustrations.filter((f) => f.trim()).length ? frustrations.filter((f) => f.trim()) : undefined,
        traits: traits.filter((t) => t.trim()).length ? traits.filter((t) => t.trim()) : undefined,
        preferredDevices: preferredDevices.length ? preferredDevices : undefined,
      });
      toast.success("New persona created!");
      setOpen(false);
      setForm({ name: "", description: "", background: "", gender: "" });
      setGoals([]);
      setFrustrations([]);
      setTraits([]);
      setPreferredDevices([]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create persona");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="rounded-3xl">
        <DialogHeader>
          <DialogTitle>Create Persona</DialogTitle>
          <DialogDescription>Fill in the details to create a new persona.</DialogDescription>
        </DialogHeader>
        {error && <div className="text-destructive text-sm mb-2">{error}</div>}
        <ScrollArea className="max-h-[60vh] pr-2">
          <form 
            onSubmit={handleSubmit} 
            className="space-y-4" 
            id="create-persona-form"
            onKeyDown={e => {
              // Only submit on Enter if not inside a textarea
              if (
                (e.key === "Enter" || e.key === "Return") &&
                e.target instanceof HTMLElement &&
                e.target.tagName !== "TEXTAREA"
              ) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          >
            <section>
              <label htmlFor="name" className="block text-sm font-medium mb-1">Name</label>
              <Input id="name" name="name" value={form.name} onChange={handleChange} disabled={loading} aria-invalid={!!fieldErrors.name} aria-describedby={fieldErrors.name ? 'name-error' : undefined} required />
              {fieldErrors.name && <div id="name-error" className="text-destructive text-xs mt-1">{fieldErrors.name}</div>}
            </section>
            <section>
              <label htmlFor="description" className="block text-sm font-medium mb-1">Description</label>
              <Textarea id="description" name="description" value={form.description} onChange={handleChange} disabled={loading} aria-invalid={!!fieldErrors.description} aria-describedby={fieldErrors.description ? 'description-error' : undefined} required />
              {fieldErrors.description && <div id="description-error" className="text-destructive text-xs mt-1">{fieldErrors.description}</div>}
            </section>
            <section>
              <label htmlFor="background" className="block text-sm font-medium mb-1">Background <span className="text-muted-foreground">(optional)</span></label>
              <Textarea id="background" name="background" value={form.background} onChange={handleChange} disabled={loading} />
            </section>
            <section>
              <label className="block text-sm font-medium mb-1">Gender <span className="text-muted-foreground">(optional)</span></label>
              <div className="flex items-center gap-4 mt-2">
                {["Male", "Female", "Prefer not to say"].map(genderOption => (
                  <label key={genderOption} className="flex items-center gap-1 text-sm">
                    <input
                      type="radio"
                      name="gender"
                      value={genderOption}
                      checked={form.gender === genderOption}
                      onChange={() => setForm(f => ({ ...f, gender: genderOption }))}
                      disabled={loading}
                    />
                    {genderOption}
                  </label>
                ))}
              </div>
            </section>
            <fieldset className="border rounded-md p-3">
              <legend className="text-sm font-medium px-1">Goals <span className="text-muted-foreground">(optional)</span></legend>
              <div className="flex items-center justify-between mb-1 mt-2">
                <span className="block text-xs text-muted-foreground">Add goals for this persona.</span>
                <Button type="button" size="icon" variant="ghost" onClick={() => addListItem(setGoals)} disabled={loading}>
                  <Plus className="size-4" />
                  <span className="sr-only">Add Goal</span>
                </Button>
              </div>
              {goals.map((goal, idx) => (
                <section key={idx} className="flex gap-2 mb-2">
                  <Input
                    placeholder="Goal"
                    value={goal}
                    onChange={e => handleListChange(setGoals, idx, e.target.value)}
                    disabled={loading}
                  />
                  <Button type="button" size="icon" variant="ghost" onClick={() => removeListItem(setGoals, idx)} disabled={loading}>
                    <span className="sr-only">Remove</span>
                    <Trash className="size-4" />
                  </Button>
                </section>
              ))}
            </fieldset>
            <fieldset className="border rounded-md p-3">
              <legend className="text-sm font-medium px-1">Frustrations <span className="text-muted-foreground">(optional)</span></legend>
              <div className="flex items-center justify-between mb-1 mt-2">
                <span className="block text-xs text-muted-foreground">Add frustrations for this persona.</span>
                <Button type="button" size="icon" variant="ghost" onClick={() => addListItem(setFrustrations)} disabled={loading}>
                  <Plus className="size-4" />
                  <span className="sr-only">Add Frustration</span>
                </Button>
              </div>
              {frustrations.map((frustration, idx) => (
                <section key={idx} className="flex gap-2 mb-2">
                  <Input
                    placeholder="Frustration"
                    value={frustration}
                    onChange={e => handleListChange(setFrustrations, idx, e.target.value)}
                    disabled={loading}
                  />
                  <Button type="button" size="icon" variant="ghost" onClick={() => removeListItem(setFrustrations, idx)} disabled={loading}>
                    <span className="sr-only">Remove</span>
                    <Trash className="size-4" />
                  </Button>
                </section>
              ))}
            </fieldset>
            <fieldset className="border rounded-md p-3">
              <legend className="text-sm font-medium px-1">Traits <span className="text-muted-foreground">(optional)</span></legend>
              <div className="flex items-center justify-between mb-1 mt-2">
                <span className="block text-xs text-muted-foreground">Add traits for this persona.</span>
                <Button type="button" size="icon" variant="ghost" onClick={() => addListItem(setTraits)} disabled={loading}>
                  <Plus className="size-4" />
                  <span className="sr-only">Add Trait</span>
                </Button>
              </div>
              {traits.map((trait, idx) => (
                <section key={idx} className="flex gap-2 mb-2">
                  <Input
                    placeholder="Trait"
                    value={trait}
                    onChange={e => handleListChange(setTraits, idx, e.target.value)}
                    disabled={loading}
                  />
                  <Button type="button" size="icon" variant="ghost" onClick={() => removeListItem(setTraits, idx)} disabled={loading}>
                    <span className="sr-only">Remove</span>
                    <Trash className="size-4" />
                  </Button>
                </section>
              ))}
            </fieldset>
            <fieldset className="border rounded-md p-3">
              <legend className="text-sm font-medium px-1">Preferred Devices <span className="text-muted-foreground">(optional)</span></legend>
              <div className="flex items-center gap-4 mt-2">
                {['Desktop', 'Tablet', 'Mobile'].map(device => (
                  <label key={device} className="flex items-center gap-1 text-sm">
                    <input
                      type="checkbox"
                      value={device}
                      checked={preferredDevices.includes(device)}
                      onChange={e => {
                        setPreferredDevices(prev =>
                          e.target.checked
                            ? [...prev, device]
                            : prev.filter(d => d !== device)
                        );
                      }}
                      disabled={loading}
                    />
                    {device}
                  </label>
                ))}
              </div>
            </fieldset>
          </form>
        </ScrollArea>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={loading}>Cancel</Button>
          </DialogClose>
          <Button variant="default" type="submit" form="create-persona-form" disabled={loading}>
            {loading && <Loader2 className="animate-spin mr-2 h-5 w-5" />}
            {loading ? "Creating..." : "Create persona"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 