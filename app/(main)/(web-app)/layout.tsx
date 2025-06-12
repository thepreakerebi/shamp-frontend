"use client";
import React from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from './_components/sidebar';
import { Toaster } from '@/components/ui/sonner';
import { Topbar } from './_components/topbar';
import { CreateProjectModalProvider } from './_components/create-project-modal';
import { CreatePersonaModalProvider } from '@/app/(main)/(web-app)/personas/_components/create-persona-modal';
import { CreateBatchPersonasModalProvider } from '@/app/(main)/(web-app)/personas/_components/create-batch-personas-modal';
import { ImportPersonasModalProvider } from '@/app/(main)/(web-app)/personas/_components/import-personas-modal';

export default function WebAppLayout({ children }: { children: React.ReactNode }) {
  return (
    <CreateProjectModalProvider>
      <CreatePersonaModalProvider>
        <CreateBatchPersonasModalProvider>
          <ImportPersonasModalProvider>
            <SidebarProvider>
              <ProtectedRoute>
                <Toaster position="top-center" />
                <AppSidebar />
                <main className="min-h-screen w-full">
                  <Topbar />
                  <section className="flex flex-col w-full h-full pt-16">
                    {children}
                  </section>
                </main>
              </ProtectedRoute>
            </SidebarProvider>
          </ImportPersonasModalProvider>
        </CreateBatchPersonasModalProvider>
      </CreatePersonaModalProvider>
    </CreateProjectModalProvider>
  );
} 