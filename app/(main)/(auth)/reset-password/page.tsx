"use client";
import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

// Force dynamic rendering to prevent static generation issues with useSearchParams
export const dynamic = 'force-dynamic';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
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
      const res = await fetch(`${API_BASE}/users/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
                onChange={e => setPassword(e.target.value)}
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
                {passwordVisible ? (
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.94 17.94A10.06 10.06 0 0 1 12 20c-5 0-9.27-3.11-10-7.5a9.96 9.96 0 0 1 4.24-6.19m3.13-1.32A9.93 9.93 0 0 1 12 4c5 0 9.27 3.11 10 7.5a9.97 9.97 0 0 1-4.21 6.17M9.88 9.88A3 3 0 0 1 12 9c1.66 0 3 1.34 3 3 0 .42-.09.82-.24 1.18m-1.06 1.06A3 3 0 0 1 12 15a3 3 0 0 1-3-3c0-.42.09-.82.24-1.18m7.06 7.06L4 4"/></svg>
                ) : (
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 1l22 22M17.94 17.94A10.06 10.06 0 0 1 12 20c-5 0-9.27-3.11-10-7.5a9.96 9.96 0 0 1 4.24-6.19m3.13-1.32A9.93 9.93 0 0 1 12 4c5 0 9.27 3.11 10 7.5a9.97 9.97 0 0 1-4.21 6.17"/></svg>
                )}
              </button>
            </div>
          </section>
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