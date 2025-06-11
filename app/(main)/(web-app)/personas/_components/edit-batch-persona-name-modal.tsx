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
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useBatchPersonas, BatchPersona } from "@/hooks/use-batch-personas";

interface EditBatchPersonaNameModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  batchPersona: Pick<BatchPersona, "_id" | "name"> | null;
  onSuccess?: () => void;
}

export function EditBatchPersonaNameModal({ open, setOpen, batchPersona, onSuccess }: EditBatchPersonaNameModalProps) {
  const [name, setName] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const { updateBatchPersonaName } = useBatchPersonas();
  const prevOpen = React.useRef(false);

  React.useEffect(() => {
    if (open && !prevOpen.current && batchPersona) {
      setName(batchPersona.name || "");
      setError(null);
    }
    prevOpen.current = open;
  }, [open, batchPersona]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchPersona) return;
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    setLoading(true);
    try {
      await updateBatchPersonaName(batchPersona._id, name.trim());
      toast.success("Batch name updated");
      setOpen(false);
      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update name");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="rounded-3xl">
        <DialogHeader>
          <DialogTitle>Change Batch Name</DialogTitle>
          <DialogDescription>Update the name for this batch persona.</DialogDescription>
        </DialogHeader>
        {error && <div className="text-destructive text-sm mb-2">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4" id="edit-batch-name-form">
          <section>
            <label htmlFor="batchName" className="block text-sm font-medium mb-1">Name</label>
            <Input id="batchName" value={name} onChange={e => setName(e.target.value)} disabled={loading} required />
          </section>
        </form>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={loading}>Cancel</Button>
          </DialogClose>
          <Button variant="default" type="submit" form="edit-batch-name-form" disabled={loading}>
            {loading && <Loader2 className="animate-spin mr-2 h-5 w-5" />}
            {loading ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 