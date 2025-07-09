"use client";
import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { useProjects } from "@/hooks/use-projects";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function CreateProjectPage() {
  const { createProject } = useProjects();
  const router = useRouter();

  const [form, setForm] = useState({ name: "", description: "", url: "" });
  const [authCredentials, setAuthCredentials] = useState<{ key: string; value: string }[]>([]);
  const [paymentCredentials, setPaymentCredentials] = useState<{ key: string; value: string }[]>([]);
  const [errors, setErrors] = useState<{ name?: string; url?: string }>({});
  const [loading, setLoading] = useState(false);

  // Broadcast loading state to listeners (e.g., Topbar)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent('create-project-loading', { detail: loading }));
    // No cleanup needed
  }, [loading]);

  // Simple client-side URL validation
  function validateUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors(prev => ({ ...prev, [e.target.name as keyof typeof errors]: undefined }));
  };

  // Credential helpers
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

    setLoading(true);
    try {
      const authCredObj = Object.fromEntries(authCredentials.filter(c => c.key).map(c => [c.key, c.value]));
      const paymentCredObj = Object.fromEntries(paymentCredentials.filter(c => c.key).map(c => [c.key, c.value]));
      await createProject({
        name: form.name,
        description: form.description,
        url: form.url,
        authCredentials: authCredObj,
        paymentCredentials: paymentCredObj,
      });
      toast.success("New project created!");
      router.push("/home");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create project");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="p-4 w-full max-w-[600px] mx-auto space-y-6">
      <h1 className="text-2xl font-semibold">Create Project</h1>
      <ScrollArea className="max-h-[80vh] pr-2">
        <form onSubmit={handleSubmit} className="space-y-4" id="create-project-form">
          {/* Name */}
          <section>
            <label htmlFor="name" className="block text-sm font-medium mb-1">Name</label>
            <Input id="name" name="name" value={form.name} onChange={handleChange} aria-invalid={!!errors.name} />
            {errors.name && <p className="text-destructive text-xs mt-1">{errors.name}</p>}
          </section>
          {/* URL */}
          <section>
            <label htmlFor="url" className="block text-sm font-medium mb-1">URL</label>
            <Input id="url" name="url" value={form.url} onChange={handleChange} aria-invalid={!!errors.url} />
            {errors.url && <p className="text-destructive text-xs mt-1">{errors.url}</p>}
          </section>
          {/* Description */}
          <section>
            <label htmlFor="description" className="block text-sm font-medium mb-1">Description <span className="text-muted-foreground">(optional)</span></label>
            <Textarea id="description" name="description" value={form.description} onChange={handleChange} />
          </section>

          {/* Auth Credentials */}
          <fieldset className="border rounded-md p-3">
            <legend className="text-sm font-medium px-1">Auth Credentials <span className="text-muted-foreground">(optional)</span></legend>
            <div className="flex items-center justify-between mb-1 mt-2">
              <span className="block text-xs text-muted-foreground">Add authentication keys and values for this project.</span>
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
                  disabled={loading}
                />
                <label className="sr-only" htmlFor={`auth-value-${idx}`}>Value</label>
                <Input
                  id={`auth-value-${idx}`}
                  placeholder="Value"
                  value={cred.value}
                  onChange={e => handleCredChange(idx, "auth", "value", e.target.value)}
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
          <fieldset className="border rounded-md p-3">
            <legend className="text-sm font-medium px-1">Payment Credentials <span className="text-muted-foreground">(optional)</span></legend>
            <div className="flex items-center justify-between mb-1 mt-2">
              <span className="block text-xs text-muted-foreground">Add payment keys and values for this project.</span>
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
                  disabled={loading}
                />
                <label className="sr-only" htmlFor={`payment-value-${idx}`}>Value</label>
                <Input
                  id={`payment-value-${idx}`}
                  placeholder="Value"
                  value={cred.value}
                  onChange={e => handleCredChange(idx, "payment", "value", e.target.value)}
                  disabled={loading}
                />
                <Button type="button" size="icon" variant="ghost" onClick={() => removeCred("payment", idx)} disabled={loading}>
                  <Trash2 className="size-4" />
                  <span className="sr-only">Remove</span>
                </Button>
              </section>
            ))}
          </fieldset>

          {/* Note: Submission is triggered from Topbar button */}
        </form>
      </ScrollArea>
    </main>
  );
} 