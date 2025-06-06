"use client";
import React from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './_components/sidebar';
import { Breadcrumbs } from './_components/breadcrumbs';
import { CreateProjectModalProvider } from './_components/create-project-modal';
import { Toaster } from '@/components/ui/sonner';
import { CreateProjectButton } from './_components/create-project-button';
import { usePathname } from 'next/navigation';

export default function WebAppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <CreateProjectModalProvider>
      <SidebarProvider>
        <ProtectedRoute>
          <Toaster position="top-center" />
          <AppSidebar />
          <main className="min-h-screen w-full">
            <section className="flex flex-row items-center justify-between p-4 w-full">
              <section className="flex flex-row items-center gap-4">
                <SidebarTrigger />
                <Breadcrumbs />
              </section>
              <section className="flex flex-row items-center gap-4">
                {pathname === '/home' && <CreateProjectButton />}
                {/* Add more buttons for other pages here as needed */}
              </section>
            </section>
            {children}
          </main>
        </ProtectedRoute>
      </SidebarProvider>
    </CreateProjectModalProvider>
  );
} 