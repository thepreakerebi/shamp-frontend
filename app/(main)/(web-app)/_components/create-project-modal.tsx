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
import { useRouter } from "next/navigation";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { useProjects } from "@/hooks/use-projects";

// Context for global modal control
const CreateProjectModalContext = React.createContext<{
  open: boolean;
  setOpen: (open: boolean) => void;
} | null>(null);

export function useCreateProjectModal() {
  const ctx = React.useContext(CreateProjectModalContext);
  if (!ctx) throw new Error("useCreateProjectModal must be used within CreateProjectModalProvider");
  return ctx;
}

export function CreateProjectModalProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  return (
    <CreateProjectModalContext.Provider value={{ open, setOpen }}>
      {children}
      <CreateProjectModal />
    </CreateProjectModalContext.Provider>
  );
}

function CreateProjectModal() {
  const { open, setOpen } = useCreateProjectModal();
  const [form, setForm] = React.useState({ name: "", description: "", url: "" });
  const [authCredentials, setAuthCredentials] = React.useState<{ key: string; value: string }[]>([]);
  const [paymentCredentials, setPaymentCredentials] = React.useState<{ key: string; value: string }[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<{ name?: string; url?: string }>({});
  const router = useRouter();
  const { createProject } = useProjects();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setFieldErrors((prev) => ({ ...prev, [e.target.name]: undefined }));
  };

  // Dynamic credentials handlers
  const handleCredChange = (
    idx: number,
    type: "auth" | "payment",
    field: "key" | "value",
    value: string
  ) => {
    if (type === "auth") {
      setAuthCredentials((prev) => prev.map((c, i) => (i === idx ? { ...c, [field]: value } : c)));
    } else {
      setPaymentCredentials((prev) => prev.map((c, i) => (i === idx ? { ...c, [field]: value } : c)));
    }
  };
  const addCred = (type: "auth" | "payment") => {
    if (type === "auth") setAuthCredentials((prev) => [...prev, { key: "", value: "" }]);
    else setPaymentCredentials((prev) => [...prev, { key: "", value: "" }]);
  };
  const removeCred = (type: "auth" | "payment", idx: number) => {
    if (type === "auth") setAuthCredentials((prev) => prev.filter((_, i) => i !== idx));
    else setPaymentCredentials((prev) => prev.filter((_, i) => i !== idx));
  };

  // Simple client-side URL validation
  function validateUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    let hasError = false;
    const newFieldErrors: { name?: string; url?: string } = {};
    if (!form.name) {
      newFieldErrors.name = "Project name is required.";
      hasError = true;
    }
    if (!form.url) {
      newFieldErrors.url = "Project URL is required.";
      hasError = true;
    } else if (!validateUrl(form.url)) {
      newFieldErrors.url = "Please enter a valid URL (must start with http:// or https://).";
      hasError = true;
    }
    if (hasError) {
      setFieldErrors(newFieldErrors);
      return;
    }
    setLoading(true);
    const authCredObj = Object.fromEntries(authCredentials.filter(c => c.key).map(c => [c.key, c.value]));
    const paymentCredObj = Object.fromEntries(paymentCredentials.filter(c => c.key).map(c => [c.key, c.value]));
    try {
      await createProject({
        name: form.name,
        description: form.description,
        url: form.url,
        authCredentials: authCredObj,
        paymentCredentials: paymentCredObj,
      });
      toast.success("New project created!");
      setOpen(false);
      setForm({ name: "", description: "", url: "" });
      setAuthCredentials([]);
      setPaymentCredentials([]);
      setTimeout(() => {
        router.refresh();
      }, 300); // Wait for modal close animation
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create project");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="rounded-3xl">
        <DialogHeader>
          <DialogTitle>Create Project</DialogTitle>
          <DialogDescription>Fill in the details to create a new project.</DialogDescription>
        </DialogHeader>
        {error && <div className="text-destructive text-sm mb-2">{error}</div>}
        <ScrollArea className="max-h-[60vh] pr-2">
          <form 
            onSubmit={handleSubmit} 
            className="space-y-4" 
            id="create-project-form"
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
              <Input id="name" name="name" value={form.name} onChange={handleChange} disabled={loading} aria-invalid={!!fieldErrors.name} aria-describedby={fieldErrors.name ? 'name-error' : undefined} />
              {fieldErrors.name && <div id="name-error" className="text-destructive text-xs mt-1">{fieldErrors.name}</div>}
            </section>
            <section>
              <label htmlFor="url" className="block text-sm font-medium mb-1">URL</label>
              <Input id="url" name="url" value={form.url} onChange={handleChange} disabled={loading} aria-invalid={!!fieldErrors.url} aria-describedby={fieldErrors.url ? 'url-error' : undefined} />
              {fieldErrors.url && <div id="url-error" className="text-destructive text-xs mt-1">{fieldErrors.url}</div>}
            </section>
            <section>
              <label htmlFor="description" className="block text-sm font-medium mb-1">Description <span className="text-muted-foreground">(optional)</span></label>
              <Textarea id="description" name="description" value={form.description} onChange={handleChange} disabled={loading} />
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
          </form>
        </ScrollArea>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={loading}>Cancel</Button>
          </DialogClose>
          <Button variant="default" type="submit" form="create-project-form" disabled={loading}>
            {loading && <Loader2 className="animate-spin mr-2 h-5 w-5" />}
            {loading ? "Creating..." : "Create project"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 