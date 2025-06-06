"use client";
import React from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './_components/sidebar';
import { Breadcrumbs } from './_components/breadcrumbs';

export default function WebAppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <ProtectedRoute>
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
  );
} 