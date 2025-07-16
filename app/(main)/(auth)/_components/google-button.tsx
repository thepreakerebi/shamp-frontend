"use client";
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

export function CreateAccountWithGoogleButton({ mode = 'signup' }: { mode?: 'signup' | 'login' }) {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const buttonText = mode === 'login' ? 'Log in with Google' : 'Create account with Google';

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      // Use native URLSearchParams instead of useSearchParams hook
      const urlParams = new URLSearchParams(window.location.search);
      setInviteToken(urlParams.get('token'));
    }
  }, [mounted]);

  const handleGoogle = () => {
    if (loading) return;
    setLoading(true);
    let url = `${API_BASE}/users/auth/google`;
    if (inviteToken) {
      url += `?inviteToken=${encodeURIComponent(inviteToken)}`;
    }
    // Set flag before redirecting to Google
    if (typeof window !== 'undefined') {
      localStorage.setItem('showLoggedInToast', '1');
    }
    window.location.href = url;
  };

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full flex items-center justify-center gap-2 font-medium text-base border-muted-foreground/30 py-5"
      onClick={handleGoogle}
      disabled={loading}
      data-testid={mode === 'login' ? 'google-login' : 'google-signup'}
    >
      {loading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <span className="inline-block align-middle">
          <Image src="/google-icon-logo.svg" alt="Google Logo" width={24} height={24} />
        </span>
      )}
      {loading ? 'Redirecting…' : buttonText}
    </Button>
  );
}

// Note: signIn.social is used for both signup and login with Google. Better Auth will create an account if one does not exist. 