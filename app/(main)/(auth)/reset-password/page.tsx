"use client";
import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import zxcvbn from 'zxcvbn';
import { apiFetch } from '@/lib/api-client';

// Force dynamic rendering to prevent static generation issues with useSearchParams
export const dynamic = 'force-dynamic';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pwStrength, setPwStrength] = useState<{score:number;feedback:string}>({score:0,feedback:''});
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    // Get token from URL once component mounts on client
    const urlParams = new URLSearchParams(window.location.search);
    setToken(urlParams.get("token"));
  }, []);

  const validatePassword = (pw: string) => {
    // At least 8 chars, lowercase, uppercase, number, special char
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/.test(pw);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!token) {
      setError("Invalid or expired reset link.");
      return;
    }
    if (!validatePassword(password)) {
      setError(
        "Password must be at least 8 characters and include lowercase, uppercase, number, and special character."
      );
      return;
    }
    setLoading(true);
    try {
      const res = await apiFetch('/users/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to reset password.");
      } else {
        setSuccess("Password has been reset successfully. You can now log in.");
        setTimeout(() => {
          router.push("/");
        }, 2500);
      }
    } catch {
      setError("Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Prevent rendering until client-side mount to avoid hydration issues
  if (!mounted) {
    return null;
  }

  return (
    <main className="bg-background w-full flex items-center justify-center px-4">
      <section aria-label="Reset password" className="w-full max-w-md">
        <header className="mb-6 w-full flex flex-col gap-2">
          <h1 className="text-2xl font-medium mb-1 w-full text-center">Reset your password</h1>
          <p className="text-sm w-full text-center">
            Enter your new password below. Make sure it is strong and unique.
          </p>
        </header>
        {success && (
          <Alert variant="default" className="mb-4">
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="on" noValidate>
          <section className="w-full flex flex-col gap-2">
            <Label htmlFor="password">New password</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={passwordVisible ? "text" : "password"}
                value={password}
                onChange={e => {
                  setPassword(e.target.value);
                  const res = zxcvbn(e.target.value);
                  setPwStrength({ score: res.score, feedback: res.feedback.warning || res.feedback.suggestions.join(' ') || '' });
                }}
                autoComplete="new-password"
                aria-invalid={!!error}
                aria-describedby={error ? "password-error" : undefined}
                className="pr-10"
              />
              <button
                type="button"
                tabIndex={-1}
                aria-label={passwordVisible ? "Hide password" : "Show password"}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                onClick={() => setPasswordVisible(v => !v)}
              >
                {passwordVisible ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
              </button>
            </div>
          </section>
          {/* Password strength meter */}
          {password && (
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
            </div>)}
          {password && (
            <p className="text-[10px] text-muted-foreground mt-1">Password must be at least 8 characters and include uppercase, lowercase, number, and special character.</p>
          )}

          <Button
            type="submit"
            className="w-full font-semibold text-base py-5 mt-2 hover:border-secondary/30 hover:border-1"
            disabled={loading}
          >
            {loading && <Loader2 className="animate-spin mr-2 h-5 w-5" />}
            {loading ? "Resetting..." : "Reset password"}
          </Button>
        </form>
        <footer className="text-xs text-muted-foreground mt-4 text-center">
          <Link href="/" className="text-secondary hover:underline">Back to login</Link>
        </footer>
      </section>
    </main>
  );
} 