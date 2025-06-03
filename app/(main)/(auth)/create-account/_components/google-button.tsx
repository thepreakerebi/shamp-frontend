"use client";
import { Button } from '@/components/ui/button';

export function CreateAccountWithGoogleButton({ onClick }: { onClick?: () => void }) {
  return (
    <Button
      type="button"
      variant="outline"
      className="w-full flex items-center justify-center gap-2 font-medium text-base border-muted-foreground/30 py-5"
      onClick={onClick}
      data-testid="google-signup"
    >
      <span className="inline-block align-middle">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g clipPath="url(#clip0_993_771)">
            <path d="M23.04 12.2618C23.04 11.4445 22.9655 10.6618 22.8273 9.90909H12V14.091H18.2045C17.9367 15.4091 17.1636 16.5227 16.0455 17.2618V19.7727H19.36C21.2364 18.0455 23.04 15.4091 23.04 12.2618Z" fill="#4285F4"/>
            <path d="M12 24C15.24 24 17.9636 22.9545 19.36 19.7727L16.0455 17.2618C15.3091 17.7455 14.3091 18.0455 13.0909 18.0455C10.0091 18.0455 7.41818 15.9545 6.50909 13.1818H3.09091V15.7727C4.48182 18.4091 7.01818 20.4545 10.0909 20.9545C10.9636 21.0909 11.9636 21.1818 12 21.1818V24Z" fill="#34A853"/>
            <path d="M6.50909 13.1818C6.27273 12.6364 6.13636 12.0455 6.13636 11.4091C6.13636 10.7727 6.27273 10.1818 6.50909 9.63636V7.04545H3.09091C2.4 8.40909 2 9.95455 2 11.4091C2 12.8636 2.4 14.4091 3.09091 15.7727L6.50909 13.1818Z" fill="#FBBC05"/>
            <path d="M12 6.81818C13.2364 6.81818 14.3091 7.22727 15.0909 7.95455L19.4182 4.36364C17.9636 2.95455 15.24 1.90909 12 1.90909C7.01818 1.90909 3.09091 5.40909 3.09091 11.4091C3.09091 12.0455 3.22727 12.6364 3.45455 13.1818L6.87273 10.5909C7.78182 7.81818 10.3727 6.81818 12 6.81818Z" fill="#EA4335"/>
          </g>
          <defs>
            <clipPath id="clip0_993_771">
              <rect width="24" height="24" fill="white"/>
            </clipPath>
          </defs>
        </svg>
      </span>
      Create account with Google
    </Button>
  );
} 