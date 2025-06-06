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
import { Plus, Trash2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.name || !form.url) {
      setError("Name and URL are required.");
      return;
    }
    setLoading(true);
    // Convert credentials arrays to objects
    const authCredObj = Object.fromEntries(authCredentials.filter(c => c.key).map(c => [c.key, c.value]));
    const paymentCredObj = Object.fromEntries(paymentCredentials.filter(c => c.key).map(c => [c.key, c.value]));
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, authCredentials: authCredObj, paymentCredentials: paymentCredObj }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create project");
      } else {
        setOpen(false);
        setForm({ name: "", description: "", url: "" });
        setAuthCredentials([]);
        setPaymentCredentials([]);
        router.refresh();
      }
    } catch {
      setError("Failed to create project");
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
        <ScrollArea className="max-h-[60vh] pr-2">
          <form onSubmit={handleSubmit} className="space-y-4">
            <section>
              <label htmlFor="name" className="block text-sm font-medium mb-1">Name</label>
              <Input id="name" name="name" value={form.name} onChange={handleChange} required disabled={loading} />
            </section>
            <section>
              <label htmlFor="url" className="block text-sm font-medium mb-1">URL</label>
              <Input id="url" name="url" value={form.url} onChange={handleChange} required disabled={loading} />
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
            {error && <div className="text-destructive text-sm">{error}</div>}
          </form>
        </ScrollArea>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={loading}>Cancel</Button>
          </DialogClose>
          <Button variant="secondary" type="submit" form="create-project-form" disabled={loading}>
            {loading ? "Creating..." : "Create Project"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 