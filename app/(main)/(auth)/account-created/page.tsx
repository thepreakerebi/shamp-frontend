'use client';

import { Mail } from 'lucide-react';
import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

export default function AccountCreatedPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (searchParams.get('created') === '1') {
      toast.success('Your account is created');
      // Remove the query param for a clean URL
      const url = new URL(window.location.href);
      url.searchParams.delete('created');
      router.replace(url.pathname, { scroll: false });
    }
  }, [searchParams, router]);

  return (
    <main className="flex items-center justify-center bg-background px-4">
      <section className="w-full max-w-md text-center py-10 px-6 flex flex-col items-center gap-4 bg-background">
        <span aria-hidden="true" className="flex items-center justify-center bg-neutral-100 rounded-full w-16 h-16 mb-2">
          <Mail className="text-neutral-400 w-8 h-8" />
        </span>
        <h1 className="text-2xl font-medium">Verify your email</h1>
        <section className="p-0">
          <p className="text-muted-foreground text-base mb-6">
            Your account was created successfully!<br />
            Please check your email for a verification link to activate your account.
          </p>
          <Button
            asChild
            className="w-full max-w-xs mx-auto"
            variant="default"
          >
            <a
              href="https://mail.google.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Open Gmail app
            </a>
          </Button>
        </section>
      </section>
    </main>
  );
}
