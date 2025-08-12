"use client";
import React from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { SidebarProvider } from '@/components/ui/sidebar';
import { BillingProvider } from '@/components/providers/billing-provider';
import { AppSidebar } from './_components/sidebar';
import { Toaster } from '@/components/ui/sonner';
import { Topbar } from './_components/topbar';
import { Bottombar } from './_components/bottombar';
import { CreateProjectModalProvider } from './_components/create-project-modal';
import { CreatePersonaModalProvider } from '@/app/(main)/(web-app)/personas/_components/create-persona-modal';
import { CreateBatchPersonasModalProvider } from '@/app/(main)/(web-app)/personas/_components/create-batch-personas-modal';
import { ImportPersonasModalProvider } from '@/app/(main)/(web-app)/personas/_components/import-personas-modal';
import { useTestRuns } from '@/hooks/use-testruns';

// Force dynamic rendering since this layout includes components that use useSearchParams
export const dynamic = 'force-dynamic';

export default function WebAppLayout({ children }: { children: React.ReactNode }) {
  // Establish socket connection for test-run real-time updates exactly once per web-app tab
  useTestRuns();
  return (
    <CreateProjectModalProvider>
      <CreatePersonaModalProvider>
        <CreateBatchPersonasModalProvider>
          <ImportPersonasModalProvider>
            <SidebarProvider>
              <ProtectedRoute>
                <BillingProvider>
                  <Toaster position="top-center" />
                  <AppSidebar />
                  <main className="min-h-screen w-full">
                    <Topbar />
                    <section className="flex flex-col w-full h-full pt-16">
                      {children}
                    </section>
                    <Bottombar />
                  </main>
                </BillingProvider>
              </ProtectedRoute>
            </SidebarProvider>
          </ImportPersonasModalProvider>
        </CreateBatchPersonasModalProvider>
      </CreatePersonaModalProvider>
    </CreateProjectModalProvider>
  );
} 