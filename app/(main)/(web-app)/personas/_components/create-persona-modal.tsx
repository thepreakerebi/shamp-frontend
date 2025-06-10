"use client";
import * as React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
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
      <CreatePersonaSheet />
    </CreatePersonaModalContext.Provider>
  );
}

function CreatePersonaSheet() {
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
  const [fieldErrors, setFieldErrors] = React.useState<{ name?: string }>({});
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
    const newFieldErrors: { name?: string } = {};
    if (!form.name) {
      newFieldErrors.name = "Persona name is required.";
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
        background: form.background,
        gender: form.gender,
        goals: goals.filter((g) => g.trim()),
        frustrations: frustrations.filter((f) => f.trim()),
        traits: traits.filter((t) => t.trim()),
        preferredDevices: preferredDevices.filter((d) => d.trim()),
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
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="right" className="max-w-lg w-full md:w-[800px] rounded-l-3xl p-0 flex flex-col h-full">
        <form 
          onSubmit={handleSubmit} 
          className="flex flex-col h-full" 
          id="create-persona-form"
          onKeyDown={e => {
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
          <SheetHeader className="p-6 pb-2">
            <SheetTitle>Create Persona</SheetTitle>
            <SheetDescription>Fill in the details to create a new persona.</SheetDescription>
            {error && <div className="text-destructive text-sm mt-2">{error}</div>}
          </SheetHeader>
          <ScrollArea className="flex-1 px-6 pb-4 max-h-[82vh]">
            <div className="flex flex-col gap-y-4">
              <section>
                <label htmlFor="name" className="block text-sm font-medium mb-1">Name</label>
                <Input id="name" name="name" value={form.name} onChange={handleChange} disabled={loading} aria-invalid={!!fieldErrors.name} aria-describedby={fieldErrors.name ? 'name-error' : undefined} />
                {fieldErrors.name && <div id="name-error" className="text-destructive text-xs mt-1">{fieldErrors.name}</div>}
              </section>
              <section>
                <label htmlFor="description" className="block text-sm font-medium mb-1">Description <span className="text-muted-foreground">(optional)</span></label>
                <Textarea id="description" name="description" value={form.description} onChange={handleChange} disabled={loading} />
              </section>
              <section>
                <label htmlFor="background" className="block text-sm font-medium mb-1">Background <span className="text-muted-foreground">(optional)</span></label>
                <Textarea id="background" name="background" value={form.background} onChange={handleChange} disabled={loading} />
              </section>
              <section>
                <label htmlFor="gender" className="block text-sm font-medium mb-1">Gender <span className="text-muted-foreground">(optional)</span></label>
                <Input id="gender" name="gender" value={form.gender} onChange={handleChange} disabled={loading} />
              </section>
              {/* Dynamic lists: Goals, Frustrations, Traits, Preferred Devices */}
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
                <div className="flex items-center justify-between mb-1 mt-2">
                  <span className="block text-xs text-muted-foreground">Add preferred devices for this persona.</span>
                  <Button type="button" size="icon" variant="ghost" onClick={() => addListItem(setPreferredDevices)} disabled={loading}>
                    <Plus className="size-4" />
                    <span className="sr-only">Add Device</span>
                  </Button>
                </div>
                {preferredDevices.map((device, idx) => (
                  <section key={idx} className="flex gap-2 mb-2">
                    <Input
                      placeholder="Device"
                      value={device}
                      onChange={e => handleListChange(setPreferredDevices, idx, e.target.value)}
                      disabled={loading}
                    />
                    <Button type="button" size="icon" variant="ghost" onClick={() => removeListItem(setPreferredDevices, idx)} disabled={loading}>
                      <span className="sr-only">Remove</span>
                      <Trash className="size-4" />
                    </Button>
                  </section>
                ))}
              </fieldset>
            </div>
          </ScrollArea>
          <SheetFooter className="p-6 pt-0 flex flex-row gap-2 justify-end">
            <SheetClose asChild>
              <Button type="button" variant="outline" disabled={loading}>Cancel</Button>
            </SheetClose>
            <Button variant="default" type="submit" form="create-persona-form" disabled={loading}>
              {loading && <Loader2 className="animate-spin mr-2 h-5 w-5" />}
              {loading ? "Creating..." : "Create persona"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
} 