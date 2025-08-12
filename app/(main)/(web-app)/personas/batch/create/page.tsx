"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, Trash } from "lucide-react";
import { useBatchPersonas } from "@/hooks/use-batch-personas";
import { toast } from "sonner";
import { LoadingBenefitsModal } from "../../_components/loading-benefits-modal";
import { useRouter } from "next/navigation";
import { UnsavedChangesDialog } from "@/components/ui/unsaved-changes-dialog";

export default function CreateBatchPersonaPage() {
  const { createBatchPersona } = useBatchPersonas(false); // disable auto fetch
  const router = useRouter();

  const [form, setForm] = React.useState({
    count: 3,
    name: "",
    description: "",
    targetAudience: "",
    additionalContext: "",
  });
  // Keep a simple array of strings for UX, but convert to map on submit to satisfy backend schema
  const [diversity, setDiversity] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<{ count?: string; name?: string; description?: string }>({});

  const [confirmLeaveOpen, setConfirmLeaveOpen] = React.useState(false);
  const [pendingHref, setPendingHref] = React.useState<string | null>(null);

  const isDirty = React.useMemo(() => {
    if (loading) return false;
    return (
      form.name || form.description || form.targetAudience || form.additionalContext || diversity.some(d=>d.trim())
    );
  }, [form, diversity, loading]);

  // Broadcast dirty state for topbar Cancel button
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('create-batch-persona-dirty', { detail: isDirty }));
    }
  }, [isDirty]);

  React.useEffect(() => {
    const handleLinkClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      const anchor = t.closest('a[data-slot="breadcrumb-link"]') as HTMLAnchorElement | null;
      if (!anchor) return;
      if (!isDirty) return;
      if (anchor.href === window.location.href) return;
      e.preventDefault();
      setPendingHref(anchor.href);
      setConfirmLeaveOpen(true);
    };
    document.addEventListener('click', handleLinkClick, true);
    return () => document.removeEventListener('click', handleLinkClick, true);
  }, [isDirty]);

  // Cancel handled by Topbar via create-batch-persona-dirty broadcast

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    // Clear field-specific error as user edits
    setFieldErrors(prev => ({ ...prev, [e.target.name]: undefined }));
  };

  const handleDiversityChange = (idx: number, value: string) => {
    setDiversity((prev) => prev.map((item, i) => (i === idx ? value : item)));
  };
  const addDiversityItem = () => setDiversity((prev) => [...prev, ""]);
  const removeDiversityItem = (idx: number) => setDiversity((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    // Validate required fields
    let hasError = false;
    const newFieldErrors: { count?: string; name?: string; description?: string } = {};
    if (!form.count || Number(form.count) <= 0) {
      newFieldErrors.count = "Count is required.";
      hasError = true;
    }
    if (!form.name) {
      newFieldErrors.name = "Batch name is required.";
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
    // Trigger loading modal and topbar button spinner
    window.dispatchEvent(new CustomEvent('create-persona-loading', { detail: true }));
    window.dispatchEvent(new CustomEvent('create-batch-persona-loading', { detail: true }));
    try {
      const res = await createBatchPersona({
        count: Number(form.count),
        name: form.name,
        description: form.description,
        targetAudience: form.targetAudience || undefined,
        diversity: (() => {
          const keys = diversity.map((d) => d.trim()).filter(Boolean);
          if (!keys.length) return undefined;
          const map: Record<string, boolean> = {};
          keys.forEach((k) => { map[k] = true; });
          return map;
        })(),
        additionalContext: form.additionalContext || undefined,
      });
      toast.success("New batch personas created!");
      router.push(`/personas/batch/${res._id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create batch personas");
    } finally {
      window.dispatchEvent(new CustomEvent('create-persona-loading', { detail: false }));
      window.dispatchEvent(new CustomEvent('create-batch-persona-loading', { detail: false }));
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-[500px] py-10 pb-20">
      <LoadingBenefitsModal />
      <h1 className="text-2xl font-semibold mb-6">Create Batch Personas</h1>
      {error && <div className="text-destructive text-sm mb-4">{error}</div>}
      <form
        id="create-batch-persona-form"
        onSubmit={handleSubmit}
        className="space-y-6"
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === "Return") && e.target instanceof HTMLElement && e.target.tagName !== "TEXTAREA") {
            e.preventDefault();
            handleSubmit(e);
          }
        }}
      >
        <section>
          <label htmlFor="count" className="block text-sm font-medium mb-1">Count</label>
          <span className="block text-xs text-muted-foreground mb-1">How many unique personas do you want to generate in this batch? 3–10 recommended.</span>
          <Input id="count" name="count" type="number" min={1} max={10} value={form.count} onChange={handleChange} disabled={loading} aria-invalid={!!fieldErrors.count} aria-describedby={fieldErrors.count ? 'count-error' : undefined} required />
          {fieldErrors.count && (
            <div id="count-error" className="text-destructive text-xs mt-1">
              {fieldErrors.count}
            </div>
          )}
        </section>
        <section>
          <label htmlFor="name" className="block text-sm font-medium mb-1">Batch Name</label>
          <span className="block text-xs text-muted-foreground mb-1">A short label to identify this group of personas.</span>
          <Input id="name" name="name" value={form.name} onChange={handleChange} disabled={loading} aria-invalid={!!fieldErrors.name} aria-describedby={fieldErrors.name ? 'name-error' : undefined} required />
          {fieldErrors.name && (
            <div id="name-error" className="text-destructive text-xs mt-1">
              {fieldErrors.name}
            </div>
          )}
        </section>
        <section>
          <label htmlFor="description" className="block text-sm font-medium mb-1">Description</label>
          <span className="block text-xs text-muted-foreground mb-1">Describe the overall purpose or theme for these personas.</span>
          <Textarea id="description" name="description" value={form.description} onChange={handleChange} disabled={loading} aria-invalid={!!fieldErrors.description} aria-describedby={fieldErrors.description ? 'description-error' : undefined} required />
          {fieldErrors.description && (
            <div id="description-error" className="text-destructive text-xs mt-1">
              {fieldErrors.description}
            </div>
          )}
        </section>
        <section>
          <label htmlFor="targetAudience" className="block text-sm font-medium mb-1">Target Audience <span className="text-muted-foreground">(optional)</span></label>
          <span className="block text-xs text-muted-foreground mb-1">Who will use or encounter the product?</span>
          <Input id="targetAudience" name="targetAudience" value={form.targetAudience} onChange={handleChange} disabled={loading} />
        </section>
        <fieldset className="border rounded-md p-3">
          <legend className="text-sm font-medium px-1">Diversity <span className="text-muted-foreground">(optional)</span></legend>
          <div className="flex items-center justify-between mb-1 mt-2">
            <span className="block text-xs text-muted-foreground">
              Add diversity requirements for this batch. (e.g. gender, age, background, etc.) <em>(Press Enter to add another)</em>
            </span>
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
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === "Return") {
                    e.preventDefault();
                    e.stopPropagation();
                    addDiversityItem();
                  }
                }}
                autoFocus={idx === diversity.length - 1}
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
          <span className="block text-xs text-muted-foreground mb-1">Any extra guidance you want the AI to consider.</span>
          <Textarea id="additionalContext" name="additionalContext" value={form.additionalContext} onChange={handleChange} disabled={loading} />
        </section>

        {/* Note: Cancel and submission buttons are handled in Topbar */}
      </form>

      <UnsavedChangesDialog
        open={confirmLeaveOpen}
        onOpenChange={setConfirmLeaveOpen}
        onDiscard={() => {
          setConfirmLeaveOpen(false);
          if (pendingHref) {
            router.push(pendingHref);
          } else {
            router.back();
          }
        }}
      />
    </section>
  );
} 