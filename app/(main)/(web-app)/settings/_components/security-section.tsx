"use client";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { Loader2, Eye, EyeOff } from "lucide-react";

export function SecuritySection() {
  const { token } = useAuth();
  const [hasPassword, setHasPassword] = useState<boolean | null>(null);
  const [form, setForm] = useState({ current: "", newPw: "", confirm: "" });
  const [show, setShow] = useState({ current: false, newPw: false, confirm: false });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{current?:string; newPw?:string; confirm?:string}>({});

  const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/users/me/has-password`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setHasPassword(!!data.hasPassword);
        } else {
          setHasPassword(false);
        }
      } catch {
        setHasPassword(false);
      }
    })();
  }, [token]);

  // Fallback: if hasPassword is still null but user.provider === 'email', assume true
  const auth = useAuth();
  const derivedHasPw = hasPassword === null ? (auth.user?.provider === 'email') : hasPassword;

  const disableSubmit = () => {
    if (saving || derivedHasPw === null) return true;
    if (form.newPw.trim() === "" || form.confirm.trim() === "") return true;
    if (form.newPw !== form.confirm) return true;
    if (derivedHasPw && form.current.trim() === "") return true;
    return false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (disableSubmit()) return;
    setSaving(true);
    try {
      // Reset previous errors
      setErrors({});

      // Client-side validation
      const newErr: typeof errors = {};
      if (derivedHasPw && form.current.trim() === "") newErr.current = "Current password is required";
      if (!PASSWORD_REGEX.test(form.newPw)) newErr.newPw = "Password must be at least 8 characters, include lowercase, uppercase, number, and special character.";
      if (form.newPw !== form.confirm) newErr.confirm = "Passwords do not match";
      if (Object.keys(newErr).length) { setErrors(newErr); return; }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const body: any = { newPassword: form.newPw };
      if (derivedHasPw) body.currentPassword = form.current;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/users/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errData = await res.json();
        const msg = errData.error || "Failed to change password";
        if (msg.toLowerCase().includes("current password")) {
          setErrors(prev => ({ ...prev, current: msg }));
        } else if (msg.toLowerCase().includes("password")) {
          setErrors(prev => ({ ...prev, newPw: msg }));
        } else {
          toast.error(msg);
        }
        return;
      }
      toast.success("Password updated");
      setForm({ current: "", newPw: "", confirm: "" });
      setShow({ current: false, newPw: false, confirm: false });
      setHasPassword(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to change password";
      if (msg.toLowerCase().includes("current password")) {
        setErrors(prev => ({ ...prev, current: msg }));
      } else if (msg.toLowerCase().includes("password")) {
        setErrors(prev => ({ ...prev, newPw: msg }));
      } else {
        toast.error(msg);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="p-4 space-y-6 max-w-md">
      <h2 className="text-xl font-semibold">Security</h2>
      {derivedHasPw === null && <p className="text-sm text-muted-foreground">Loading…</p>}
      {derivedHasPw !== null && (
        <form onSubmit={handleSubmit} className="space-y-4">
          {derivedHasPw && (
            <div className="space-y-2">
              <label htmlFor="current" className="text-sm font-medium">Current password</label>
              <div className="relative">
                <Input
                  id="current"
                  type={show.current ? "text" : "password"}
                  value={form.current}
                  onChange={e => setForm({ ...form, current: e.target.value })}
                  disabled={saving}
                  aria-invalid={!!errors.current}
                />
                <button type="button" className="absolute inset-y-0 right-3 flex items-center" onClick={()=>setShow(prev=>({...prev,current:!prev.current}))} aria-label="Toggle password visibility">
                  {show.current ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
                {errors.current && <p className="text-destructive text-xs mt-1">{errors.current}</p>}
              </div>
            </div>
          )}
          <div className="space-y-2">
            <label htmlFor="newPw" className="text-sm font-medium">New password</label>
            <div className="relative">
              <Input
                id="newPw"
                type={show.newPw ? "text" : "password"}
                value={form.newPw}
                onChange={e => setForm({ ...form, newPw: e.target.value })}
                disabled={saving}
                aria-invalid={!!errors.newPw}
              />
              <button type="button" className="absolute inset-y-0 right-3 flex items-center" onClick={()=>setShow(prev=>({...prev,newPw:!prev.newPw}))} aria-label="Toggle password visibility">
                {show.newPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
              {errors.newPw && <p className="text-destructive text-xs mt-1">{errors.newPw}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor="confirm" className="text-sm font-medium">Confirm password</label>
            <div className="relative">
              <Input
                id="confirm"
                type={show.confirm ? "text" : "password"}
                value={form.confirm}
                onChange={e => setForm({ ...form, confirm: e.target.value })}
                disabled={saving}
                aria-invalid={!!errors.confirm}
              />
              <button type="button" className="absolute inset-y-0 right-3 flex items-center" onClick={()=>setShow(prev=>({...prev,confirm:!prev.confirm}))} aria-label="Toggle password visibility">
                {show.confirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
              {errors.confirm && <p className="text-destructive text-xs mt-1">{errors.confirm}</p>}
            </div>
          </div>
          <Button type="submit" disabled={disableSubmit()} className="flex items-center gap-2">
            {saving && <Loader2 className="size-4 animate-spin" />}
            {saving ? "Saving…" : derivedHasPw ? "Change password" : "Set password"}
          </Button>
        </form>
      )}
    </section>
  );
} 