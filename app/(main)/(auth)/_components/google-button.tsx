"use client";
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { useAuthActions } from "@convex-dev/auth/react";

export function CreateAccountWithGoogleButton({ mode = 'signup' }: { mode?: 'signup' | 'login' }) {
  const buttonText = mode === 'login' ? 'Log in with Google' : 'Create account with Google';
  const { signIn } = useAuthActions();
  const frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL;

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full flex items-center justify-center gap-2 font-medium text-base border-muted-foreground/30 py-5"
      onClick={() => void signIn("google", {
        redirectTo: frontendUrl + "/home",
      })}
      data-testid={mode === 'login' ? 'google-login' : 'google-signup'}
    >
      <span className="inline-block align-middle mr-4">
        <Image src="/google-icon-logo.svg" alt="Google Logo" width={24} height={24} />
      </span>
      {buttonText}
    </Button>
  );
}

// Note: signIn.social is used for both signup and login with Google. Better Auth will create an account if one does not exist. 