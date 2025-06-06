'use client';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth';

export default function HomePage() {
  const { user } = useAuth();

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('showLoggedInToast') === '1') {
      toast.success('You are logged in');
      localStorage.removeItem('showLoggedInToast');
    }
  }, []);

  return (
    <main className="flex flex-col items-center justify-center bg-background gap-4 min-h-screen">
      <header>
        <h1 className="text-2xl font-semibold text-center">Welcome to the home page</h1>
      </header>
      {user && (
        <section aria-label="User info" className="text-center text-base mt-2">
          <dl>
            <dt className="font-medium">Name:</dt>
            <dd>{user.firstName} {user.lastName}</dd>
            <dt className="font-medium">Role:</dt>
            <dd>{user.role}</dd>
          </dl>
        </section>
      )}
    </main>
  );
}
