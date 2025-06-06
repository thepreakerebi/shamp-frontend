'use client';
import { useEffect } from 'react';
import { toast } from 'sonner';
// import { useAuth } from '@/lib/auth';
import { TotalProjectsCard } from "./_components/total-projects-card";
import { TotalTestsCard } from "./_components/total-tests-card";
import { TotalSuccessfulTestRunsCard } from "./_components/total-successful-test-runs-card";
import { TotalFailedTestRunsCard } from "./_components/total-failed-test-runs-card";
import { TotalPersonasCard } from "./_components/total-personas-card";
import Link from "next/link";

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
        <Link href="/personas" className="focus:outline-none focus:ring-2 focus:ring-ring rounded-md hover:scale-[1.03] transition-transform">
          <TotalPersonasCard />
        </Link>
        <Link href="/tests" className="focus:outline-none focus:ring-2 focus:ring-ring rounded-md hover:scale-[1.03] transition-transform">
          <TotalTestsCard />
        </Link>
        <Link href="/test-runs" className="focus:outline-none focus:ring-2 focus:ring-ring rounded-md hover:scale-[1.03] transition-transform">
          <TotalSuccessfulTestRunsCard />
        </Link>
        <Link href="/test-runs" className="focus:outline-none focus:ring-2 focus:ring-ring rounded-md hover:scale-[1.03] transition-transform">
          <TotalFailedTestRunsCard />
        </Link>
      </section>
      <section className="w-full" />
    </main>
  );
}
