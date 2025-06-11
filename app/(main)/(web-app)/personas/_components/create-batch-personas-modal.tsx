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
import { useBatchPersonas } from "@/hooks/use-batch-personas";

interface CreateBatchPersonasModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateBatchPersonasModal({ open, setOpen, onSuccess }: CreateBatchPersonasModalProps) {
  const [form, setForm] = React.useState({
    count: 3,
    name: "",
    description: "",
    targetAudience: "",
    diversity: "",
    requiredFields: "name,description",
    additionalContext: "",
  });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const { createBatchPersona } = useBatchPersonas();
  const prevOpen = React.useRef(false);

  React.useEffect(() => {
    if (open && !prevOpen.current) {
      setForm({
        count: 3,
        name: "",
        description: "",
        targetAudience: "",
        diversity: "",
        requiredFields: "name,description",
        additionalContext: "",
      });
      setError(null);
    }
    prevOpen.current = open;
  }, [open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.name || !form.description || !form.count) {
      setError("Name, description, and count are required.");
      return;
    }
    setLoading(true);
    try {
      await createBatchPersona({
        count: Number(form.count),
        name: form.name,
        description: form.description,
        targetAudience: form.targetAudience || undefined,
        diversity: form.diversity || undefined,
        requiredFields: form.requiredFields
          ? form.requiredFields.split(",").map(f => f.trim())
          : undefined,
        additionalContext: form.additionalContext || undefined,
      });
      toast.success("Batch personas created!");
      setOpen(false);
      if (onSuccess) onSuccess();
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
        <form onSubmit={handleSubmit} className="space-y-4" id="create-batch-personas-form">
          <section>
            <label htmlFor="count" className="block text-sm font-medium mb-1">Count</label>
            <Input id="count" name="count" type="number" min={1} max={10} value={form.count} onChange={handleChange} disabled={loading} required />
          </section>
          <section>
            <label htmlFor="name" className="block text-sm font-medium mb-1">Batch Name</label>
            <Input id="name" name="name" value={form.name} onChange={handleChange} disabled={loading} required />
          </section>
          <section>
            <label htmlFor="description" className="block text-sm font-medium mb-1">Description</label>
            <Textarea id="description" name="description" value={form.description} onChange={handleChange} disabled={loading} required />
          </section>
          <section>
            <label htmlFor="targetAudience" className="block text-sm font-medium mb-1">Target Audience <span className="text-muted-foreground">(optional)</span></label>
            <Input id="targetAudience" name="targetAudience" value={form.targetAudience} onChange={handleChange} disabled={loading} />
          </section>
          <section>
            <label htmlFor="diversity" className="block text-sm font-medium mb-1">Diversity <span className="text-muted-foreground">(optional, e.g. gender, age)</span></label>
            <Input id="diversity" name="diversity" value={form.diversity} onChange={handleChange} disabled={loading} />
          </section>
          <section>
            <label htmlFor="requiredFields" className="block text-sm font-medium mb-1">Required Fields <span className="text-muted-foreground">(comma separated)</span></label>
            <Input id="requiredFields" name="requiredFields" value={form.requiredFields} onChange={handleChange} disabled={loading} />
          </section>
          <section>
            <label htmlFor="additionalContext" className="block text-sm font-medium mb-1">Additional Context <span className="text-muted-foreground">(optional)</span></label>
            <Textarea id="additionalContext" name="additionalContext" value={form.additionalContext} onChange={handleChange} disabled={loading} />
          </section>
        </form>
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