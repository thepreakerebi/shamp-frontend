"use client";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { apiFetch } from '@/lib/api-client';
import { Loader2, Eye, EyeOff } from "lucide-react";
import zxcvbn from "zxcvbn";

export function SecuritySection() {
  const { user } = useAuth();
  const [hasPassword, setHasPassword] = useState<boolean | null>(null);
  const [form, setForm] = useState({ current: "", newPw: "", confirm: "" });
  const [show, setShow] = useState({ current: false, newPw: false, confirm: false });
  const [saving, setSaving] = useState(false);
  const [pwStrength, setPwStrength] = useState<{score:number;feedback:string}>({score:0,feedback:''});
  const [errors, setErrors] = useState<{current?:string; newPw?:string; confirm?:string}>({});

  const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

  useEffect(() => {
    (async () => {
      try {
        const resPw = await apiFetch('/users/me/has-password');
        if (resPw.ok) {
          const data = await resPw.json();
          setHasPassword(!!data.hasPassword);
        } else {
          setHasPassword(false);
        }
      } catch {
        setHasPassword(false);
      }
    })();
  }, []);

  // Fallback: if hasPassword is still null but user.provider === 'email', assume true
  const derivedHasPw = hasPassword === null ? (user?.provider === 'email') : hasPassword;

  const disableSubmit = () => {
    if (saving || derivedHasPw === null) return true;
    if (form.newPw.trim() === "" || form.confirm.trim() === "") return true;
    if (form.newPw !== form.confirm) return true;
    if (derivedHasPw && form.current.trim() === "") return true;
    return false;
  };

  const handleNewPwChange = (val: string) => {
    setForm(prev => ({ ...prev, newPw: val }));
    const res = zxcvbn(val);
    setPwStrength({ score: res.score, feedback: res.feedback.warning || res.feedback.suggestions.join(' ') || '' });
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
      const body: any = { newPassword: form.newPw, currentPassword: derivedHasPw ? form.current : "" };
      const resChange = await apiFetch('/users/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!resChange.ok) {
        const errData = await resChange.json();
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
        <>
          <p className="text-sm text-muted-foreground">
            {derivedHasPw
              ? "You already have a password set. Fill in your current password below to change it."
              : "You haven't set a password yet. Enter one below so you can sign in with email/password."}
          </p>
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
                onChange={e => handleNewPwChange(e.target.value)}
                disabled={saving}
                aria-invalid={!!errors.newPw}
              />
              <button type="button" className="absolute inset-y-0 right-3 flex items-center" onClick={()=>setShow(prev=>({...prev,newPw:!prev.newPw}))} aria-label="Toggle password visibility">
                {show.newPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
              {errors.newPw && <p className="text-destructive text-xs mt-1">{errors.newPw}</p>}
            </div>
          </div>
          {/* Password strength indicator (for new password) */}
          {form.newPw && (
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 h-2 rounded bg-muted/50 overflow-hidden">
                <div
                  className={`h-full transition-all ${pwStrength.score<=1?'bg-destructive':pwStrength.score===2?'bg-yellow-500':pwStrength.score===3?'bg-amber-500':'bg-emerald-500'}`}
                  style={{ width: `${(pwStrength.score+1)*20}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground w-20 text-right">
                {['Very weak','Weak','Fair','Good','Strong'][pwStrength.score]}
              </span>
            </div>) }
          {form.newPw && !errors.newPw && (
            <p className="text-[10px] text-muted-foreground mt-1">Password must be at least 8 characters and include uppercase, lowercase, number, and special character.</p>
          )}
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
        </>
      )}
    </section>
  );
} 