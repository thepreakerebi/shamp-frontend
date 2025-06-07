'use client';
import { useEffect } from 'react';
import { toast } from 'sonner';
// import { useAuth } from '@/lib/auth';
import { TotalProjectsCard } from "./_components/total-projects-card";
import { TotalTestsCard } from "./_components/total-tests-card";
import { TotalSuccessfulTestRunsCard } from "./_components/total-successful-test-runs-card";
import { TotalFailedTestRunsCard } from "./_components/total-failed-test-runs-card";
import { TotalPersonasCard } from "./_components/total-personas-card";

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
      <section className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 w-full">
        <TotalProjectsCard />
        <TotalPersonasCard href="/personas" />
        <TotalTestsCard href="/tests" />
        <TotalSuccessfulTestRunsCard href="/test-runs" />
        <TotalFailedTestRunsCard href="/test-runs" />
      </section>
      <section className="w-full" />
    </main>
  );
}
