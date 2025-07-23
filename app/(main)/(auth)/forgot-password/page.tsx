"use client";
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { apiFetch } from '@/lib/api-client';

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    if (!email) {
      setError("Email is required.");
      setLoading(false);
      return;
    }
    try {
      const res = await apiFetch('/users/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to send reset email.");
      } else {
        setSuccess(
          "If an account with that email exists, a password reset link has been sent."
        );
      }
    } catch {
      setError("Failed to send reset email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="bg-background w-full flex items-center justify-center px-4">
      <section aria-label="Forgot password" className="w-full max-w-md">
        <header className="mb-6 w-full flex flex-col gap-2">
          <h1 className="text-2xl font-medium mb-1 w-full text-center">Forgot your password?</h1>
          <p className="text-sm w-full text-center">
            Enter your email address and we&apos;ll send you a link to reset your password.
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
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
              aria-invalid={!!error}
              aria-describedby={error ? "email-error" : undefined}
            />
          </section>
          <Button
            type="submit"
            className="w-full font-semibold text-base py-5 mt-2 hover:border-secondary/30 hover:border-1"
            disabled={loading}
          >
            {loading && <Loader2 className="animate-spin mr-2 h-5 w-5" />}
            {loading ? "Sending..." : "Send reset link"}
          </Button>
        </form>
        <footer className="text-xs text-muted-foreground mt-4 text-center">
          <Link href="/" className="text-secondary hover:underline">Back to login</Link>
        </footer>
      </section>
    </main>
  );
} 