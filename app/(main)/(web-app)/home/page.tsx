'use client';
import { useEffect } from 'react';
import { useBilling } from '@/hooks/use-billing';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import { TotalProjectsCard } from "./_components/total-projects-card";
import { TotalTestsCard } from "./_components/total-tests-card";
import { TotalSuccessfulTestRunsCard } from "./_components/total-successful-test-runs-card";
import { TotalFailedTestRunsCard } from "./_components/total-failed-test-runs-card";
import { TotalPersonasCard } from "./_components/total-personas-card";
import { ProjectsList } from '@/app/(main)/(web-app)/home/_components/projects-list';
import { OnboardingChecklist } from "./_components/onboarding-checklist";
import { WorkspaceGreetingHeader } from "./_components/workspace-greeting-header";

export default function HomePage() {
  const { summary, loading } = useBilling();
  const { user, currentWorkspaceId } = useAuth();
  const currentWs = user?.workspaces?.find((w) => w._id === currentWorkspaceId);
  const isOwner = !!currentWs?.isOwner;

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('showLoggedInToast') === '1') {
      toast.success('You are logged in');
      localStorage.removeItem('showLoggedInToast');
    }
    if (typeof window !== 'undefined' && currentWorkspaceId) {
      const toastKey = `showPlanToast:${currentWorkspaceId}`;
      const shouldShow = localStorage.getItem(toastKey) === '1';
      if (shouldShow && isOwner) {
        toast.success('Your subscription was updated successfully!');
      }
      if (shouldShow) localStorage.removeItem(toastKey);
    }
  }, [currentWorkspaceId, isOwner]);

  // Detect plan change and set toast flag
  useEffect(() => {
    if (loading || !summary || !currentWorkspaceId) return;
    const currentProductId = Array.isArray(summary.products) && summary.products.length > 0 ? (summary.products[0] as { id?: string }).id ?? 'free' : 'free';
    if (typeof window !== 'undefined') {
      const planKey = `planId:${currentWorkspaceId}`;
      const toastKey = `showPlanToast:${currentWorkspaceId}`;
      const prevPlanId = localStorage.getItem(planKey);
      if (prevPlanId && prevPlanId !== currentProductId) {
        // Only owners should see subscription change toast
        if (isOwner) localStorage.setItem(toastKey, '1');
      }
      // Always store latest plan id for this workspace
      localStorage.setItem(planKey, currentProductId);
    }
  }, [loading, summary, currentWorkspaceId, isOwner]);

  return (
    <main className="flex flex-col bg-background p-4 gap-4 h-screen w-full">
      <WorkspaceGreetingHeader />

      <section className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 w-full">
        <TotalProjectsCard />
        <TotalPersonasCard href="/personas" />
        <TotalTestsCard href="/tests" />
        <TotalSuccessfulTestRunsCard href="/test-runs" />
        <TotalFailedTestRunsCard href="/test-runs" />
      </section>
      <section className="w-full flex items-center gap-2">
        <section className="flex-1 border-b border-zinc-200 dark:border-zinc-800" />
        <h2 className="text-lg font-medium">Projects</h2>
        <section className="flex-1 border-b border-zinc-200 dark:border-zinc-800" />
      </section>
      <section className="w-full">
        <ProjectsList />
      </section>

      {/* Floating onboarding checklist */}
      <OnboardingChecklist />
    </main>
  );
}
