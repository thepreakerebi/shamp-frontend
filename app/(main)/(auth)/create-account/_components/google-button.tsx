"use client";
import { Button } from '@/components/ui/button';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

export function CreateAccountWithGoogleButton({ mode = 'signup' }: { mode?: 'signup' | 'login' }) {
  const buttonText = mode === 'login' ? 'Log in with Google' : 'Create account with Google';
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get('token');

  const handleGoogle = () => {
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
      data-testid={mode === 'login' ? 'google-login' : 'google-signup'}
    >
      <span className="inline-block align-middle">
        <Image src="/google-icon-logo.svg" alt="Google Logo" width={24} height={24} />
      </span>
      {buttonText}
    </Button>
  );
}

// Note: signIn.social is used for both signup and login with Google. Better Auth will create an account if one does not exist. 