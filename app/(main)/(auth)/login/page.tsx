"use client";
import React, { useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CreateAccountWithGoogleButton } from "../_components/google-button";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, Loader2 } from "lucide-react";
import { useAuthActions } from "@convex-dev/auth/react";

interface FieldErrors {
  email?: string;
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuthActions();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setFieldErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setFieldErrors({});
    setLoading(true);
    // Required field validation
    if (!email) {
      setFieldErrors({ email: "Email is required." });
      setLoading(false);
      return;
    }
    try {
      await signIn("resend", { email, redirectTo: window.location.origin + "/home" });
      setSuccess("Check your email for a magic sign-in link!");
      setEmail("");
    } catch (err: unknown) {
      let message = "Failed to send magic link. Please try again.";
      if (err instanceof Error) {
        message = err.message;
        if (message.toLowerCase().includes("invalid email")) {
          setFieldErrors({ email: "Please enter a valid email address (e.g. name@example.com)." });
        }
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="bg-background w-full flex items-center justify-center px-4">
      <section aria-label="Sign in" className="w-full max-w-md">
        <header className="mb-6 w-full flex flex-col gap-2">
          <section className="w-full flex flex-col gap-1">
            <h1 className="text-2xl font-medium mb-1 w-full text-center">Welcome, Shamp 😉!</h1>
            <p className="text-sm w-full text-center">
              Create and deploy AI agents with your user personas to test your web applications at scale.
            </p>
          </section>
        </header>
        <nav aria-label="Sign in options" className="mb-4">
          <CreateAccountWithGoogleButton mode="login" />
        </nav>
        <section className="flex items-center gap-2 mb-4" role="presentation">
          <Separator className="flex-1" />
          <p className="text-xs text-muted-foreground">or with magic link</p>
          <Separator className="flex-1" />
        </section>
        {success && (
          <Alert variant="default" className="mb-4">
            <AlertDescription>{success}</AlertDescription>
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
              onChange={handleChange}
              autoComplete="email"
              aria-invalid={!!fieldErrors.email}
              aria-describedby={fieldErrors.email ? "email-error" : undefined}
            />
            {fieldErrors.email && (
              <div className="flex items-center gap-2 text-destructive text-xs mt-1" id="email-error">
                <AlertCircle className="size-4" />
                <span>{fieldErrors.email}</span>
              </div>
            )}
          </section>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Button
            type="submit"
            className="w-full font-semibold text-base py-5 mt-2 hover:border-secondary/30 hover:border-1"
            disabled={loading}
          >
            {loading && <Loader2 className="animate-spin mr-2 h-5 w-5" />}
            {loading ? "Sending magic link..." : "Send magic link"}
          </Button>
        </form>
        <footer className="text-xs text-muted-foreground mt-4 text-center">
          By signing in you agree to our{" "}
          <Link href="/terms" className="text-secondary hover:underline">Terms of Service</Link> and{" "}
          <Link href="/privacy" className="text-secondary hover:underline">Privacy Policy</Link>.
        </footer>
      </section>
    </main>
  );
}
