"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CreateAccountWithGoogleButton } from './_components/google-button';
import { Separator } from '@/components/ui/separator';
import { Eye, EyeOff } from 'lucide-react';

export default function CreateAccountPage() {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    // TODO: Implement API call
    setTimeout(() => {
      setLoading(false);
      setError('This is a demo. API not implemented.');
    }, 1000);
  };

  return (
    <main className="bg-background w-full flex items-center justify-center">
      <section aria-label="Create account" className="w-full max-w-md">
        <header className="mb-6 w-full">
          <h1 className="text-2xl font-medium mb-1 w-full text-center">Create your account</h1>
          <p className="text-sm w-full text-center">
            Already have an account?{' '}
            <Link href="/login" className="text-secondary font-medium hover:underline">Sign In</Link>
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
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="on">
          <fieldset className="flex gap-4 w-full">
            <legend className="sr-only">Name</legend>
            <section className="flex-1 w-full flex flex-col gap-2">
              <Label htmlFor="firstName">First name</Label>
              <Input
                id="firstName"
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                required
                autoComplete="given-name"
              />
            </section>
            <section className="flex-1 w-full flex flex-col gap-2">
              <Label htmlFor="lastName">Last name</Label>
              <Input
                id="lastName"
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                required
                autoComplete="family-name"
              />
            </section>
          </fieldset>
          <section className="w-full flex flex-col gap-2">
            <Label htmlFor="email">Work email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
              autoComplete="email"
            />
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
                required
                autoComplete="new-password"
                className="pr-10"
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
          </section>
          <Button
            type="submit"
            className="w-full font-semibold text-base py-5 mt-2 hover:border-secondary/30 hover:border-1"
            disabled={loading}
          >
            {loading ? 'Creating account...' : 'Create account'}
          </Button>
        </form>
        <footer className="text-xs text-muted-foreground mt-4 text-center">
          By creating an account you agree to our{' '}
          <Link href="/terms" className="text-secondary hover:underline">Terms of Service</Link> and{' '}
          <Link href="/privacy" className="text-secondary hover:underline">Privacy Policy</Link>.
        </footer>
      </section>
    </main>
  );
}
