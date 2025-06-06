"use client";
import React from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './_components/sidebar';
import { Breadcrumbs } from './_components/breadcrumbs';
import { CreateProjectModalProvider } from './_components/create-project-modal';
import { Toaster } from '@/components/ui/sonner';

export default function WebAppLayout({ children }: { children: React.ReactNode }) {
  return (
    <CreateProjectModalProvider>
      <SidebarProvider>
        <ProtectedRoute>
          <Toaster />
          <AppSidebar />
          <main className="min-h-screen p-4 w-full">
            <section className="flex flex-row items-center gap-4 mb-4">
              <SidebarTrigger />
              <Breadcrumbs />
            </section>
            {children}
          </main>
        </ProtectedRoute>
      </SidebarProvider>
    </CreateProjectModalProvider>
  );
} 