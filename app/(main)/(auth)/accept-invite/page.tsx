"use client";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";

export const dynamic = "force-dynamic";

interface FieldErrors { firstName?: string; lastName?: string; password?: string; }

export default function AcceptInvitePage() {
  const router = useRouter();
  const { acceptInvite } = useAuth();

  const [token, setToken] = useState<string | null | undefined>(undefined);
  const [form, setForm] = useState({ firstName: "", lastName: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token");
    setToken(t);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setFieldErrors(prev => ({ ...prev, [e.target.name]: undefined }));
  };

  const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const errs: FieldErrors = {};
    if (!form.firstName) errs.firstName = "First name required";
    if (!form.lastName) errs.lastName = "Last name required";
    if (!form.password) errs.password = "Password required";
    else if (!PASSWORD_REGEX.test(form.password)) errs.password = "Password too weak";
    if (!token) setError("Invalid invite link");
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }
    setLoading(true);
    try {
      await acceptInvite({ token: token as string, firstName: form.firstName, lastName: form.lastName, password: form.password });
      router.push("/home?invited=1");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to accept invite");
    } finally { setLoading(false); }
  };

  if (token === undefined) {
    return null;
  }

  if (token === null) {
    return (
      <main className="w-full flex items-center justify-center p-4"><p className="text-destructive">Invalid or expired invite link.</p></main>
    );
  }

  return (
    <main className="bg-background w-full flex items-center justify-center px-4">
      <section className="w-full max-w-md">
        <header className="mb-6 text-center">
          <h1 className="text-2xl font-medium mb-1">Accept invitation</h1>
          <p className="text-sm">Complete your profile and set a password to join the workspace.</p>
        </header>
        {error && (
          <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription></Alert>
        )}
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <fieldset className="flex gap-4 w-full">
            <legend className="sr-only">Name</legend>
            <section className="flex-1 flex flex-col gap-2">
              <Label htmlFor="firstName">First name</Label>
              <Input id="firstName" name="firstName" value={form.firstName} onChange={handleChange} aria-invalid={!!fieldErrors.firstName} />
              {fieldErrors.firstName && <p className="text-destructive text-xs flex items-center gap-1"><AlertCircle className="size-4" />{fieldErrors.firstName}</p>}
            </section>
            <section className="flex-1 flex flex-col gap-2">
              <Label htmlFor="lastName">Last name</Label>
              <Input id="lastName" name="lastName" value={form.lastName} onChange={handleChange} aria-invalid={!!fieldErrors.lastName} />
              {fieldErrors.lastName && <p className="text-destructive text-xs flex items-center gap-1"><AlertCircle className="size-4" />{fieldErrors.lastName}</p>}
            </section>
          </fieldset>
          <section className="flex flex-col gap-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input id="password" name="password" type={showPw?"text":"password"} value={form.password} onChange={handleChange} className="pr-10" aria-invalid={!!fieldErrors.password} />
              <button type="button" tabIndex={-1} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground" aria-label="Toggle password" onClick={()=>setShowPw(v=>!v)}>
                {showPw? <EyeOff className="size-5"/>:<Eye className="size-5"/>}
              </button>
            </div>
            {fieldErrors.password && <p className="text-destructive text-xs flex items-center gap-1"><AlertCircle className="size-4" />{fieldErrors.password}</p>}
          </section>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="animate-spin mr-2 h-5 w-5"/>}
            {loading?"Joining…":"Join workspace"}
          </Button>
        </form>
      </section>
    </main>
  );
} 