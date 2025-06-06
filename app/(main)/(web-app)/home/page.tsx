'use client';
import { useEffect } from 'react';
import { toast } from 'sonner';
// import { useAuth } from '@/lib/auth';
import { TotalProjectsCard } from "./_components/total-projects-card";

export default function HomePage() {
  // const { user } = useAuth();

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('showLoggedInToast') === '1') {
      toast.success('You are logged in');
      localStorage.removeItem('showLoggedInToast');
    }
  }, []);

  return (
    <main className="flex flex-col bg-background p-4 gap-4 h-screen w-full">
      <section className="flex gap-4 w-full">
        <TotalProjectsCard />
      </section>
      <section className="w-full" />
    </main>
  );
}
