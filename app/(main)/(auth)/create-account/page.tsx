"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CreateAccountWithGoogleButton } from '../_components/google-button';
import { Separator } from '@/components/ui/separator';
import { Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import zxcvbn from 'zxcvbn';

// Force dynamic rendering to prevent static generation issues with useSearchParams
export const dynamic = 'force-dynamic';

interface FieldErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
}

export default function CreateAccountPage() {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [pwStrength, setPwStrength] = useState<{score:number;feedback:string}>({score:0,feedback:''});
  const { signup } = useAuth();
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setFieldErrors((prev) => ({ ...prev, [e.target.name]: undefined }));

    // If password field changes, compute strength
    if (e.target.name === 'password') {
      const res = zxcvbn(e.target.value);
      setPwStrength({ score: res.score, feedback: res.feedback.warning || res.feedback.suggestions.join(' ') || ''});
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setFieldErrors({});
    setLoading(true);
    // Custom required field + format validation
    const newFieldErrors: FieldErrors = {};
    if (!form.firstName) newFieldErrors.firstName = 'First name is required.';
    if (!form.lastName) newFieldErrors.lastName = 'Last name is required.';
    if (!form.email) newFieldErrors.email = 'Email is required.';
    else {
      const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
      if (!emailRegex.test(form.email)) {
        newFieldErrors.email = 'Please enter a valid email address. (e.g. name@example.com)';
      }
    }
    if (!form.password) newFieldErrors.password = 'Password is required.';
    else {
      const s = zxcvbn(form.password).score;
      if (s < 3) newFieldErrors.password = 'Password too weak. Use a mix of upper, lower, numbers and special characters.';
    }
    if (Object.keys(newFieldErrors).length > 0) {
      setFieldErrors(newFieldErrors);
      setLoading(false);
      return;
    }
    try {
      const checkoutUrl = await signup(form);
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
        return;
      }
      router.push('/account-created?created=1');
    } catch (err: unknown) {
      let message = 'Signup failed. Please try again.';
      const fieldErrs: FieldErrors = {};
      if (err instanceof Error) {
        message = err.message;
        // Only set password field error for the exact backend password validation error
        if (message === 'Password must be at least 8 characters and include lowercase, uppercase, number, and special character.') {
          fieldErrs.password = message;
        } else if (message.toLowerCase().includes('email') && message.toLowerCase().includes('exist')) {
          fieldErrs.email = 'An account with this email already exists.';
        } else if (message === "You already created an account with Google for this email. Please log in with Google or use the 'Forgot password' flow to set a password for this account.") {
          fieldErrs.email = message;
        } else if (message.toLowerCase().includes('first') && message.toLowerCase().includes('required')) {
          fieldErrs.firstName = 'First name is required.';
        } else if (message.toLowerCase().includes('last') && message.toLowerCase().includes('required')) {
          fieldErrs.lastName = 'Last name is required.';
        } else if (message.toLowerCase().includes('email') && message.toLowerCase().includes('required')) {
          fieldErrs.email = 'Email is required.';
        } else if (message.toLowerCase().includes('password') && message.toLowerCase().includes('required')) {
          fieldErrs.password = 'Password is required.';
        }
      }
      setFieldErrors(fieldErrs);
      // Only show general error if not a field error
      if (Object.keys(fieldErrs).length === 0) {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="bg-background w-full flex items-center justify-center px-4">
      <section aria-label="Create account" className="w-full max-w-md">
        <header className="mb-6 w-full flex flex-col gap-2">
          <section className="w-full flex flex-col gap-1">
            <h1 className="text-2xl font-medium mb-1 w-full text-center">Transform usability testing with AI</h1>
            <p className="text-sm w-full text-center">
              Create and deploy AI agents with your user personas to test your web applications at scale.
            </p>
          </section>
          <p className="text-sm w-full text-center">
            Already have an account?{' '}
            <Link href="/" className="text-secondary font-medium hover:underline">Log In</Link>
          </p>
        </header>
        <nav aria-label="Sign up options" className="mb-4">
          <CreateAccountWithGoogleButton />
        </nav>
        <section className="flex items-center gap-2 mb-4" role="presentation">
          <Separator className="flex-1" />
          <p className="text-xs text-muted-foreground">or with email</p>
          <Separator className="flex-1" />
        </section>
        {success && (
          <Alert variant="default" className="mb-4">
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}
        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="on" noValidate>
          <fieldset className="flex gap-4 w-full">
            <legend className="sr-only">Name</legend>
            <section className="flex-1 w-full flex flex-col gap-2">
              <Label htmlFor="firstName">First name</Label>
              <Input
                id="firstName"
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                autoComplete="given-name"
                aria-invalid={!!fieldErrors.firstName}
                aria-describedby={fieldErrors.firstName ? 'firstName-error' : undefined}
              />
              {fieldErrors.firstName && (
                <div className="flex items-center gap-2 text-destructive text-xs mt-1" id="firstName-error">
                  <AlertCircle className="size-4" />
                  <span>{fieldErrors.firstName}</span>
                </div>
              )}
            </section>
            <section className="flex-1 w-full flex flex-col gap-2">
              <Label htmlFor="lastName">Last name</Label>
              <Input
                id="lastName"
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                autoComplete="family-name"
                aria-invalid={!!fieldErrors.lastName}
                aria-describedby={fieldErrors.lastName ? 'lastName-error' : undefined}
              />
              {fieldErrors.lastName && (
                <div className="flex items-center gap-2 text-destructive text-xs mt-1" id="lastName-error">
                  <AlertCircle className="size-4" />
                  <span>{fieldErrors.lastName}</span>
                </div>
              )}
            </section>
          </fieldset>
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
            </div>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={handleChange}
                autoComplete="new-password"
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
          {/* Password strength indicator */}
          {form.password && (
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
          {form.password && !fieldErrors.password && (
            <p className="text-[10px] text-muted-foreground mt-1">Password must be at least 8 characters and include uppercase, lowercase, number, and special character.</p>
          )}
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
            {loading ? 'Creating account...' : 'Create account'}
          </Button>
        </form>
        <footer className="text-xs text-muted-foreground mt-4 text-center">
          By creating an account you agree to our{' '}
          <Link href="https://www.shamp.io/terms" target="_blank" className="text-secondary hover:underline">Terms of Service</Link> and{' '}
          <Link href="https://www.shamp.io/privacy" target="_blank" className="text-secondary hover:underline">Privacy Policy</Link>.
        </footer>
      </section>
    </main>
  );
}
