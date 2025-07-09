"use client";

import React from "react";
import { useRouter, useParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Trash } from "lucide-react";
import { usePersonas } from "@/hooks/use-personas";
import { toast } from "sonner";

export default function EditPersonaPage() {
  const params = useParams();
  const personaId = params.personaId as string;
  const router = useRouter();
  const { getPersonaById, updatePersona } = usePersonas();

  const [initialLoaded, setInitialLoaded] = React.useState(false);
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

  React.useEffect(() => {
    const fetchPersona = async () => {
      try {
        const persona = await getPersonaById(personaId);
        setForm({
          name: persona.name || "",
          description: persona.description || "",
          background: persona.background || "",
          gender: persona.gender || "",
        });
        setGoals(Array.isArray(persona.goals) ? persona.goals : []);
        setFrustrations(Array.isArray(persona.frustrations) ? persona.frustrations : []);
        setTraits(Array.isArray(persona.traits) ? (persona.traits as string[]) : []);
        setPreferredDevices(Array.isArray(persona.preferredDevices) ? persona.preferredDevices : []);
        setInitialLoaded(true);
      } catch {
        router.push("/personas");
      }
    };
    fetchPersona();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personaId]);

  if (!initialLoaded) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setFieldErrors((prev) => ({ ...prev, [e.target.name]: undefined }));
  };

  const handleListChange = (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    idx: number,
    value: string,
  ) => {
    setter((prev) => prev.map((item, i) => (i === idx ? value : item)));
  };
  const addListItem = (setter: React.Dispatch<React.SetStateAction<string[]>>) => setter((prev) => [...prev, ""]);
  const removeListItem = (setter: React.Dispatch<React.SetStateAction<string[]>>, idx: number) =>
    setter((prev) => prev.filter((_, i) => i !== idx));

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
    // Broadcast loading event
    window.dispatchEvent(new CustomEvent('edit-persona-loading', { detail: true }));
    try {
      await updatePersona(personaId, {
        name: form.name,
        description: form.description,
        background: form.background || undefined,
        gender: form.gender ? form.gender : undefined,
        goals: goals.filter((g) => g.trim()).length ? goals.filter((g) => g.trim()) : undefined,
        frustrations: frustrations.filter((f) => f.trim()).length ? frustrations.filter((f) => f.trim()) : undefined,
        traits: traits.filter((t) => t.trim()).length ? traits.filter((t) => t.trim()) : undefined,
        preferredDevices: preferredDevices.length ? preferredDevices : undefined,
      });
      toast.success("Persona updated!");
      router.push(`/personas/${personaId}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update persona");
    } finally {
      setLoading(false);
      window.dispatchEvent(new CustomEvent('edit-persona-loading', { detail: false }));
    }
  };

  return (
    <div className="mx-auto max-w-lg py-10">
      <h1 className="text-2xl font-semibold mb-6">Edit Persona</h1>
      {error && <div className="text-destructive text-sm mb-4">{error}</div>}
      <form
        id="edit-persona-form"
        onSubmit={handleSubmit}
        className="space-y-6"
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === "Return") && e.target instanceof HTMLElement && e.target.tagName !== "TEXTAREA") {
            e.preventDefault();
            handleSubmit(e);
          }
        }}
      >
        {/* Name */}
        <section>
          <label htmlFor="name" className="block text-sm font-medium mb-1">
            Name
          </label>
          <span className="block text-xs text-muted-foreground mb-1">
            Give your persona a short, descriptive name (e.g. &quot;Liam Smith&quot;).
          </span>
          <Input id="name" name="name" value={form.name} onChange={handleChange} disabled={loading} aria-invalid={!!fieldErrors.name} aria-describedby={fieldErrors.name ? "name-error" : undefined} required />
          {fieldErrors.name && (
            <div id="name-error" className="text-destructive text-xs mt-1">
              {fieldErrors.name}
            </div>
          )}
        </section>
        {/* Description */}
        <section>
          <label htmlFor="description" className="block text-sm font-medium mb-1">
            Description
          </label>
          <span className="block text-xs text-muted-foreground mb-1">
            Briefly explain who this persona is and what drives them (1–2 sentences).
          </span>
          <Textarea id="description" name="description" value={form.description} onChange={handleChange} disabled={loading} aria-invalid={!!fieldErrors.description} aria-describedby={fieldErrors.description ? "description-error" : undefined} required />
          {fieldErrors.description && (
            <div id="description-error" className="text-destructive text-xs mt-1">
              {fieldErrors.description}
            </div>
          )}
        </section>
        {/* Background */}
        <section>
          <label htmlFor="background" className="block text-sm font-medium mb-1">
            Background <span className="text-muted-foreground">(optional)</span>
          </label>
          <span className="block text-xs text-muted-foreground mb-1">
            Include demographic or professional context that shapes their perspective.
          </span>
          <Textarea id="background" name="background" value={form.background} onChange={handleChange} disabled={loading} />
        </section>
        {/* Gender */}
        <section>
          <label className="block text-sm font-medium mb-1">
            Gender <span className="text-muted-foreground">(optional)</span>
          </label>
          <div className="flex items-center gap-4 mt-2">
            {["Male", "Female", "Prefer not to say"].map((genderOption) => (
              <label key={genderOption} className="flex items-center gap-1 text-sm">
                <input type="radio" name="gender" value={genderOption} checked={form.gender === genderOption} onChange={() => setForm((f) => ({ ...f, gender: genderOption }))} disabled={loading} />
                {genderOption}
              </label>
            ))}
          </div>
        </section>
        {/* Goals */}
        <fieldset className="border rounded-md p-3">
          <legend className="text-sm font-medium px-1">
            Goals <span className="text-muted-foreground">(optional)</span>
          </legend>
          <div className="flex items-center justify-between mb-1 mt-2">
            <span className="block text-xs text-muted-foreground">What outcomes does this persona want to achieve when using the product?</span>
            <Button type="button" size="icon" variant="ghost" onClick={() => addListItem(setGoals)} disabled={loading}>
              <Plus className="size-4" />
              <span className="sr-only">Add Goal</span>
            </Button>
          </div>
          {goals.map((goal, idx) => (
            <section key={idx} className="flex gap-2 mb-2">
              <Input placeholder="Goal" value={goal} onChange={(e) => handleListChange(setGoals, idx, e.target.value)} disabled={loading} />
              <Button type="button" size="icon" variant="ghost" onClick={() => removeListItem(setGoals, idx)} disabled={loading}>
                <span className="sr-only">Remove</span>
                <Trash className="size-4" />
              </Button>
            </section>
          ))}
        </fieldset>
        {/* Frustrations */}
        <fieldset className="border rounded-md p-3">
          <legend className="text-sm font-medium px-1">
            Frustrations <span className="text-muted-foreground">(optional)</span>
          </legend>
          <div className="flex items-center justify-between mb-1 mt-2">
            <span className="block text-xs text-muted-foreground">Which pain points or obstacles does this persona face today?</span>
            <Button type="button" size="icon" variant="ghost" onClick={() => addListItem(setFrustrations)} disabled={loading}>
              <Plus className="size-4" />
              <span className="sr-only">Add Frustration</span>
            </Button>
          </div>
          {frustrations.map((frustration, idx) => (
            <section key={idx} className="flex gap-2 mb-2">
              <Input placeholder="Frustration" value={frustration} onChange={(e) => handleListChange(setFrustrations, idx, e.target.value)} disabled={loading} />
              <Button type="button" size="icon" variant="ghost" onClick={() => removeListItem(setFrustrations, idx)} disabled={loading}>
                <span className="sr-only">Remove</span>
                <Trash className="size-4" />
              </Button>
            </section>
          ))}
        </fieldset>
        {/* Traits */}
        <fieldset className="border rounded-md p-3">
          <legend className="text-sm font-medium px-1">
            Traits <span className="text-muted-foreground">(optional)</span>
          </legend>
          <div className="flex items-center justify-between mb-1 mt-2">
            <span className="block text-xs text-muted-foreground">What are the key characteristics or personality traits of this persona?</span>
            <Button type="button" size="icon" variant="ghost" onClick={() => addListItem(setTraits)} disabled={loading}>
              <Plus className="size-4" />
              <span className="sr-only">Add Trait</span>
            </Button>
          </div>
          {traits.map((trait, idx) => (
            <section key={idx} className="flex gap-2 mb-2">
              <Input placeholder="Trait" value={trait} onChange={(e) => handleListChange(setTraits, idx, e.target.value)} disabled={loading} />
              <Button type="button" size="icon" variant="ghost" onClick={() => removeListItem(setTraits, idx)} disabled={loading}>
                <span className="sr-only">Remove</span>
                <Trash className="size-4" />
              </Button>
            </section>
          ))}
        </fieldset>
        {/* Preferred Devices */}
        <fieldset className="border rounded-md p-3">
          <legend className="text-sm font-medium px-1">
            Preferred Devices <span className="text-muted-foreground">(optional)</span>
          </legend>
          <div className="flex items-center justify-between mb-1 mt-2">
            <span className="block text-xs text-muted-foreground">What devices or platforms does this persona prefer to use?</span>
            <Button type="button" size="icon" variant="ghost" onClick={() => addListItem(setPreferredDevices)} disabled={loading}>
              <Plus className="size-4" />
              <span className="sr-only">Add Preferred Device</span>
            </Button>
          </div>
          {preferredDevices.map((device, idx) => (
            <section key={idx} className="flex gap-2 mb-2">
              <Input placeholder="Preferred Device" value={device} onChange={(e) => handleListChange(setPreferredDevices, idx, e.target.value)} disabled={loading} />
              <Button type="button" size="icon" variant="ghost" onClick={() => removeListItem(setPreferredDevices, idx)} disabled={loading}>
                <span className="sr-only">Remove</span>
                <Trash className="size-4" />
              </Button>
            </section>
          ))}
        </fieldset>
        {/* Note: submit handled by Topbar */}
      </form>
    </div>
  );
} 