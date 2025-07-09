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
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Trash } from "lucide-react";

// Context for global modal control
const CreateBatchPersonasModalContext = React.createContext<{
  open: boolean;
  setOpen: (open: boolean) => void;
} | null>(null);

export function useCreateBatchPersonasModal() {
  const ctx = React.useContext(CreateBatchPersonasModalContext);
  if (!ctx) throw new Error("useCreateBatchPersonasModal must be used within CreateBatchPersonasModalProvider");
  return ctx;
}

export function CreateBatchPersonasModalProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  return (
    <CreateBatchPersonasModalContext.Provider value={{ open, setOpen }}>
      {children}
      <CreateBatchPersonasModal />
    </CreateBatchPersonasModalContext.Provider>
  );
}

function CreateBatchPersonasModal() {
  const { open, setOpen } = useCreateBatchPersonasModal();
  const [form, setForm] = React.useState({
    count: 3,
    name: "",
    description: "",
    targetAudience: "",
    additionalContext: "",
  });
  const [diversity, setDiversity] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const { token } = useAuth();
  const prevOpen = React.useRef(false);

  React.useEffect(() => {
    if (open && !prevOpen.current) {
      setForm({
        count: 3,
        name: "",
        description: "",
        targetAudience: "",
        additionalContext: "",
      });
      setDiversity([]);
      setError(null);
    }
    prevOpen.current = open;
  }, [open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Diversity dynamic list handlers
  const handleDiversityChange = (idx: number, value: string) => {
    setDiversity((prev) => prev.map((item, i) => (i === idx ? value : item)));
  };
  const addDiversityItem = () => setDiversity((prev) => [...prev, ""]);
  const removeDiversityItem = (idx: number) => setDiversity((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.name || !form.description || !form.count) {
      setError("Name, description, and count are required.");
      return;
    }
    setLoading(true);
    try {
      if (!token) throw new Error("Not authenticated");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/batchpersonas`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          count: Number(form.count),
          name: form.name,
          description: form.description,
          targetAudience: form.targetAudience || undefined,
          diversity: diversity.filter((d) => d.trim()).length ? diversity.filter((d) => d.trim()) : undefined,
          additionalContext: form.additionalContext || undefined,
        }),
      });
      if (!res.ok) throw new Error("Failed to create batch persona");
      toast.success("New batch personas created!");
      setOpen(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create batch personas");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="rounded-3xl">
        <DialogHeader>
          <DialogTitle>Create Batch Personas</DialogTitle>
          <DialogDescription>Generate multiple personas at once using AI.</DialogDescription>
        </DialogHeader>
        {error && <div className="text-destructive text-sm mb-2">{error}</div>}
        <ScrollArea className="max-h-[60vh] pr-2">
          <form onSubmit={handleSubmit} className="space-y-4" id="create-batch-personas-form">
            <section>
              <label htmlFor="count" className="block text-sm font-medium mb-1">Count</label>
              <span className="block text-xs text-muted-foreground mb-1">How many unique personas do you want to generate in this batch? 3–10 recommended.</span>
              <Input id="count" name="count" type="number" min={1} max={10} value={form.count} onChange={handleChange} disabled={loading} required />
            </section>
            <section>
              <label htmlFor="name" className="block text-sm font-medium mb-1">Batch Name</label>
              <span className="block text-xs text-muted-foreground mb-1">A short label to identify this group of personas (e.g. “Mobile Banking Personas”).</span>
              <Input id="name" name="name" value={form.name} onChange={handleChange} disabled={loading} required />
            </section>
            <section>
              <label htmlFor="description" className="block text-sm font-medium mb-1">Description</label>
              <span className="block text-xs text-muted-foreground mb-1">Describe the overall purpose or theme for these personas. This helps the AI stay on track.</span>
              <Textarea id="description" name="description" value={form.description} onChange={handleChange} disabled={loading} required />
            </section>
            <section>
              <label htmlFor="targetAudience" className="block text-sm font-medium mb-1">Target Audience <span className="text-muted-foreground">(optional)</span></label>
              <span className="block text-xs text-muted-foreground mb-1">Who will use or encounter the product? e.g. “first-time home buyers” or “Gen-Z gamers”.</span>
              <Input id="targetAudience" name="targetAudience" value={form.targetAudience} onChange={handleChange} disabled={loading} />
            </section>
            <fieldset className="border rounded-md p-3">
              <legend className="text-sm font-medium px-1">Diversity <span className="text-muted-foreground">(optional)</span></legend>
              <div className="flex items-center justify-between mb-1 mt-2">
                <span className="block text-xs text-muted-foreground">Add diversity requirements for this batch (e.g. gender, age, background).</span>
                <Button type="button" size="icon" variant="ghost" onClick={addDiversityItem} disabled={loading}>
                  <Plus className="size-4" />
                  <span className="sr-only">Add Diversity</span>
                </Button>
              </div>
              {diversity.map((item, idx) => (
                <section key={idx} className="flex gap-2 mb-2">
                  <Input
                    placeholder="Diversity requirement"
                    value={item}
                    onChange={e => handleDiversityChange(idx, e.target.value)}
                    disabled={loading}
                  />
                  <Button type="button" size="icon" variant="ghost" onClick={() => removeDiversityItem(idx)} disabled={loading}>
                    <span className="sr-only">Remove</span>
                    <Trash className="size-4" />
                  </Button>
                </section>
              ))}
            </fieldset>
            <section>
              <label htmlFor="additionalContext" className="block text-sm font-medium mb-1">Additional Context <span className="text-muted-foreground">(optional)</span></label>
              <span className="block text-xs text-muted-foreground mb-1">Any extra guidance you want the AI to consider (market segment, product stage, constraints, etc.).</span>
              <Textarea id="additionalContext" name="additionalContext" value={form.additionalContext} onChange={handleChange} disabled={loading} />
            </section>
          </form>
        </ScrollArea>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={loading}>Cancel</Button>
          </DialogClose>
          <Button variant="default" type="submit" form="create-batch-personas-form" disabled={loading}>
            {loading && <Loader2 className="animate-spin mr-2 h-5 w-5" />}
            {loading ? "Creating..." : "Create batch"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 