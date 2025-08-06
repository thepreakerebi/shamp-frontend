"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth, EmailNotVerifiedError } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { CreateAccountWithGoogleButton } from './_components/google-button';

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic';

interface FieldErrors {
  email?: string;
  password?: string;
}

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showVerifiedAlert, setShowVerifiedAlert] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      // Use native URLSearchParams instead of useSearchParams hook
      const urlParams = new URLSearchParams(window.location.search);
      const verified = urlParams.get('verified') === '1';
      setShowVerifiedAlert(verified);
      
      if (verified) {
        const timeout = setTimeout(() => {
          const url = new URL(window.location.href);
          url.searchParams.delete('verified');
          router.replace(url.pathname, { scroll: false });
        }, 3000);
        return () => clearTimeout(timeout);
      }
    }
  }, [mounted, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setFieldErrors((prev) => ({ ...prev, [e.target.name]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setLoading(true);
    // Required field validation
    const newFieldErrors: FieldErrors = {};
    if (!form.email) newFieldErrors.email = 'Email is required.';
    if (!form.password) newFieldErrors.password = 'Password is required.';
    if (Object.keys(newFieldErrors).length > 0) {
      setFieldErrors(newFieldErrors);
      setLoading(false);
      return;
    }
    try {
      await login(form.email, form.password);
      if (typeof window !== 'undefined') {
        localStorage.setItem('showLoggedInToast', '1');
      }
      router.push('/home');
    } catch (err: unknown) {
      let message = 'Login failed. Please try again.';
      const fieldErrs: FieldErrors = {};
      if (err instanceof EmailNotVerifiedError) {
        message = err.message || 'Please verify your email address before logging in.';
      } else if (err instanceof Error) {
        message = err.message;
        if (message === 'Incorrect password. Please try again.') {
          fieldErrs.password = message;
        } else if (message.toLowerCase().includes('email')) {
          fieldErrs.email = 'No account found with this email.';
        }
      }
      setFieldErrors(fieldErrs);
      if (Object.keys(fieldErrs).length === 0 || err instanceof EmailNotVerifiedError) {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="bg-background w-full flex items-center justify-center px-4">
      <section aria-label="Login" className="w-full max-w-md">
        {showVerifiedAlert && (
          <Alert variant="default" className="mb-4">
            <AlertDescription>Your email is verified</AlertDescription>
          </Alert>
        )}
        <header className="mb-6 w-full flex flex-col gap-2">
          <section className="w-full flex flex-col gap-1">
            <h1 className="text-2xl font-medium mb-1 w-full text-center">Welcome back</h1>
            <p className="text-sm w-full text-center">
              Log in to your account to continue.
            </p>
          </section>
          {/* <p className="text-sm w-full text-center">
            Don&apos;t have an account?{' '}
            <Link href="/create-account" className="text-secondary font-medium hover:underline">Create one</Link>
          </p> */}
        </header>
        <nav aria-label="Login options" className="mb-4">
          <CreateAccountWithGoogleButton mode="login" />
        </nav>
        <section className="flex items-center gap-2 mb-4" role="presentation">
          <Separator className="flex-1" />
          <p className="text-xs text-muted-foreground">or with email</p>
          <Separator className="flex-1" />
        </section>
        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="on" noValidate>
          <section className="w-full flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
              aria-invalid={!!fieldErrors.email}
              aria-describedby={fieldErrors.email ? 'email-error' : undefined}
            />
            {fieldErrors.email && (
              <div className="flex items-center gap-2 text-destructive text-xs mt-1" id="email-error">
                <AlertCircle className="size-4" />
                <span>{fieldErrors.email}</span>
              </div>
            )}
          </section>
          <section className="w-full flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Button asChild variant="link" size="sm" className="px-0 h-auto text-secondary">
                <Link href="/forgot-password">Forgot password?</Link>
              </Button>
            </div>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={handleChange}
                autoComplete="current-password"
                className="pr-10"
                aria-invalid={!!fieldErrors.password}
                aria-describedby={fieldErrors.password ? 'password-error' : undefined}
              />
              <button
                type="button"
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
              </button>
            </div>
            {fieldErrors.password && (
              <div className="flex items-center gap-2 text-destructive text-xs mt-1" id="password-error">
                <AlertCircle className="size-4" />
                <span>{fieldErrors.password}</span>
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
            {loading ? 'Logging in...' : 'Log in'}
          </Button>
        </form>
        <footer className="text-xs text-muted-foreground mt-4 text-center">
          By logging in you agree to our{' '}
          <Link href="https://www.shamp.io/terms" target="_blank" className="text-secondary hover:underline">Terms of Service</Link> and{' '}
          <Link href="https://www.shamp.io/privacy" target="_blank" className="text-secondary hover:underline">Privacy Policy</Link>.
        </footer>
      </section>
    </main>
  );
}