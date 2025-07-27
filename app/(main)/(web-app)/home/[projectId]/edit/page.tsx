"use client";
import { useEffect, useState, useRef, useMemo } from "react";
import { useRouter, useParams, notFound } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useProjects } from "@/hooks/use-projects";
import { useProjectsStore } from "@/lib/store/projects";
import { UnsavedChangesDialog } from "@/components/ui/unsaved-changes-dialog";

export default function EditProjectPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const router = useRouter();
  const { updateProject, getProjectById } = useProjects();
  const project = useProjectsStore((s) => s.projects?.find((p) => p._id === projectId) || null);

  const [form, setForm] = useState({ name: "", description: "", url: "" });
  const [authCredentials, setAuthCredentials] = useState<{ key: string; value: string }[]>([]);
  const [paymentCredentials, setPaymentCredentials] = useState<{ key: string; value: string }[]>([]);
  const [authMode, setAuthMode] = useState<'credentials' | 'oauth'>('credentials');
  const [errors, setErrors] = useState<{ name?: string; url?: string }>({});
  const [loading, setLoading] = useState(false);

  // Unsaved changes dialog state
  const [confirmLeaveOpen, setConfirmLeaveOpen] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  // Determine if there are unsaved changes compared to the current project values
  const isDirty = useMemo(() => {
    if (!project || loading) return false;
    const authCredObj = Object.fromEntries(authCredentials.filter(c => c.key).map(c => [c.key, c.value]));
    const paymentCredObj = Object.fromEntries(paymentCredentials.filter(c => c.key).map(c => [c.key, c.value]));
    return (
      form.name !== (project.name || "") ||
      form.description !== (project.description || "") ||
      form.url !== (project.url || "") ||
      JSON.stringify(authCredObj) !== JSON.stringify(project.authCredentials || {}) ||
      JSON.stringify(paymentCredObj) !== JSON.stringify(project.paymentCredentials || {}) ||
      authMode !== (project?.authMode ?? 'credentials')
    );
  }, [form, authCredentials, paymentCredentials, authMode, project, loading]);

  // Broadcast loading state to topbar
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('edit-project-loading', { detail: loading }));
    }
  }, [loading]);

  // Initialize form once when project first loads to avoid wiping user input on store updates
  const initializedRef = useRef(false);
  useEffect(() => {
    if (project && !initializedRef.current) {
      setForm({
        name: project.name || "",
        description: project.description || "",
        url: project.url || "",
      });
      setAuthCredentials(
        project.authCredentials ? Object.entries(project.authCredentials).map(([k, v]) => ({ key: k, value: v })) : []
      );
      setPaymentCredentials(
        project.paymentCredentials ? Object.entries(project.paymentCredentials).map(([k, v]) => ({ key: k, value: v })) : []
      );
      setAuthMode(project.authMode ?? 'credentials');
      initializedRef.current = true;
    }
  }, [project]);

  // Intercept breadcrumb link clicks when there are unsaved changes
  useEffect(() => {
    const handleLinkClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      const anchor = t.closest('a[data-slot="breadcrumb-link"]') as HTMLAnchorElement | null;
      if (!anchor) return;
      if (!isDirty) return;
      if (anchor.href === window.location.href) return; // same page
      e.preventDefault();
      setPendingHref(anchor.href);
      setConfirmLeaveOpen(true);
    };
    document.addEventListener('click', handleLinkClick, true);
    return () => document.removeEventListener('click', handleLinkClick, true);
  }, [isDirty]);

  if (project === null) {
    // If store loaded but project missing, 404
    const all = useProjectsStore.getState().projects;
    if (all !== null) notFound();
    return null;
  }

  function validateUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors(prev => ({ ...prev, [e.target.name as keyof typeof errors]: undefined }));
  };

  const handleCredChange = (
    idx: number,
    type: "auth" | "payment",
    field: "key" | "value",
    value: string
  ) => {
    if (type === "auth") {
      setAuthCredentials(prev => prev.map((c, i) => (i === idx ? { ...c, [field]: value } : c)));
    } else {
      setPaymentCredentials(prev => prev.map((c, i) => (i === idx ? { ...c, [field]: value } : c)));
    }
  };
  const addCred = (type: "auth" | "payment") => {
    if (type === "auth") setAuthCredentials(prev => [...prev, { key: "", value: "" }]);
    else setPaymentCredentials(prev => [...prev, { key: "", value: "" }]);
  };
  const removeCred = (type: "auth" | "payment", idx: number) => {
    if (type === "auth") setAuthCredentials(prev => prev.filter((_, i) => i !== idx));
    else setPaymentCredentials(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: typeof errors = {};
    if (!form.name) newErrors.name = "Project name is required.";
    if (!form.url) newErrors.url = "Project URL is required.";
    else if (!validateUrl(form.url)) newErrors.url = "Please enter a valid URL (must start with http/https).";

    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }

    if (!project) return;
    setLoading(true);
    try {
      const authCredObj = Object.fromEntries(authCredentials.filter(c => c.key).map(c => [c.key, c.value]));
      const paymentCredObj = Object.fromEntries(paymentCredentials.filter(c => c.key).map(c => [c.key, c.value]));

      await updateProject(project._id, {
        name: form.name,
        description: form.description,
        url: form.url,
        authMode,
        authCredentials: authCredObj,
        paymentCredentials: paymentCredObj,
      });

      // Fetch updated project with decrypted credentials to refresh store
      try {
        await getProjectById(project._id);
      } catch {}

      toast.success("Project updated!");
      router.push(`/home/${project._id}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update project");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelNavigation = () => {
    if (isDirty) {
      setConfirmLeaveOpen(true);
    } else {
      router.back();
    }
  };

  return (
    <main className="p-4 w-full max-w-[500px] mx-auto space-y-6">
      <h1 className="text-2xl font-semibold">Edit Project</h1>
      <form
          onSubmit={handleSubmit}
          className="space-y-4"
          id="edit-project-form"
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === 'Return') && e.target instanceof HTMLElement && e.target.tagName !== 'TEXTAREA') {
              e.preventDefault();
              const form = document.getElementById('edit-project-form') as HTMLFormElement | null;
              form?.requestSubmit();
            }
          }}
        >
          {/* Name */}
          <section>
            <label htmlFor="name" className="block text-sm font-medium">Name</label>
            <p className="text-xs text-muted-foreground mb-1">Choose a clear, human-readable name (e.g. “Marketing Website”).</p>
            <Input id="name" name="name" value={form.name} onChange={handleChange} aria-invalid={!!errors.name} />
            {errors.name && <p className="text-destructive text-xs mt-1">{errors.name}</p>}
          </section>
          {/* URL */}
          <section>
            <label htmlFor="url" className="block text-sm font-medium">URL</label>
            <p className="text-xs text-muted-foreground mb-1">Full address starting with http:// or https:// (e.g. https://www.example.com)</p>
            <Input id="url" name="url" value={form.url} onChange={handleChange} aria-invalid={!!errors.url} />
            {errors.url && <p className="text-destructive text-xs mt-1">{errors.url}</p>}
          </section>
          {/* Description */}
          <section>
            <label htmlFor="description" className="block text-sm font-medium">Description <span className="text-muted-foreground">(optional)</span></label>
            <p className="text-xs text-muted-foreground mb-1">Describe the product or feature this project is for.</p>
            <Textarea id="description" name="description" value={form.description} onChange={handleChange} />
          </section>

          {/* Authentication Mode */}
          <section>
            <label className="block text-sm font-medium">Authentication Mode</label>
            <p className="text-xs text-muted-foreground mb-1">Choose how Personas should authenticate for this project, whether with email/password or OAuth(like Google, Apple, etc.)</p>
            <RadioGroup
              value={authMode}
              onValueChange={(v) => setAuthMode(v as 'credentials' | 'oauth')}
              className="flex gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="credentials" id="auth-credentials" />
                <label htmlFor="auth-credentials" className="text-sm">Credentials</label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="oauth" id="auth-oauth" />
                <label htmlFor="auth-oauth" className="text-sm">OAuth</label>
              </div>
            </RadioGroup>
          </section>

          {/* Auth Credentials */}
          <fieldset className="border rounded-md p-3">
            <legend className="text-sm font-medium px-1">{authMode === 'oauth' ? 'OAuth Credentials' : 'Auth Credentials'} <span className="text-muted-foreground">(optional)</span></legend>
            <div className="flex items-center justify-between mb-1 mt-2">
              <span className="block text-xs text-muted-foreground">
                Add authentication keys and values for this project. <em>(Press Enter to add another)</em>
              </span>
              <Button type="button" size="icon" variant="ghost" onClick={() => addCred("auth")} disabled={loading}>
                <Plus className="size-4" />
                <span className="sr-only">Add Auth Credential</span>
              </Button>
            </div>
            {authCredentials.map((cred, idx) => (
              <section key={idx} className="flex gap-2 mb-2">
                <label className="sr-only" htmlFor={`auth-key-${idx}`}>Key</label>
                <Input
                  id={`auth-key-${idx}`}
                  placeholder="Key"
                  value={cred.key}
                  onChange={e => handleCredChange(idx, "auth", "key", e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === "Return") {
                      e.preventDefault();
                      e.stopPropagation();
                      addCred("auth");
                    }
                  }}
                  autoFocus={idx === authCredentials.length - 1}
                  disabled={loading}
                />
                <label className="sr-only" htmlFor={`auth-value-${idx}`}>Value</label>
                <Input
                  id={`auth-value-${idx}`}
                  placeholder="Value"
                  value={cred.value}
                  onChange={e => handleCredChange(idx, "auth", "value", e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === "Return") {
                      e.preventDefault();
                      e.stopPropagation();
                      addCred("auth");
                    }
                  }}
                  disabled={loading}
                />
                <Button type="button" size="icon" variant="ghost" onClick={() => removeCred("auth", idx)} disabled={loading}>
                  <Trash2 className="size-4" />
                  <span className="sr-only">Remove</span>
                </Button>
              </section>
            ))}
          </fieldset>

          {/* Payment Credentials */}
          {/* <fieldset className="border rounded-md p-3">
            <legend className="text-sm font-medium px-1">Payment Credentials <span className="text-muted-foreground">(optional)</span></legend>
            <div className="flex items-center justify-between mb-1 mt-2">
              <span className="block text-xs text-muted-foreground">
                Add payment keys and values for this project. <em>(Press Enter to add another)</em>
              </span>
              <Button type="button" size="icon" variant="ghost" onClick={() => addCred("payment")} disabled={loading}>
                <Plus className="size-4" />
                <span className="sr-only">Add Payment Credential</span>
              </Button>
            </div>
            {paymentCredentials.map((cred, idx) => (
              <section key={idx} className="flex gap-2 mb-2">
                <label className="sr-only" htmlFor={`payment-key-${idx}`}>Key</label>
                <Input
                  id={`payment-key-${idx}`}
                  placeholder="Key"
                  value={cred.key}
                  onChange={e => handleCredChange(idx, "payment", "key", e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === "Return") {
                      e.preventDefault();
                      e.stopPropagation();
                      addCred("payment");
                    }
                  }}
                  autoFocus={idx === paymentCredentials.length - 1}
                  disabled={loading}
                />
                <label className="sr-only" htmlFor={`payment-value-${idx}`}>Value</label>
                <Input
                  id={`payment-value-${idx}`}
                  placeholder="Value"
                  value={cred.value}
                  onChange={e => handleCredChange(idx, "payment", "value", e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === "Return") {
                      e.preventDefault();
                      e.stopPropagation();
                      addCred("payment");
                    }
                  }}
                  disabled={loading}
                />
                <Button type="button" size="icon" variant="ghost" onClick={() => removeCred("payment", idx)} disabled={loading}>
                  <Trash2 className="size-4" />
                  <span className="sr-only">Remove</span>
                </Button>
              </section>
            ))}
          </fieldset> */}

          {/* Action buttons */}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={handleCancelNavigation}>Cancel</Button>
          </div>
        </form>

      {/* Unsaved changes confirmation */}
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
    </main>
  );
} 