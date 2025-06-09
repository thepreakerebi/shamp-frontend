"use client";
import React from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from './_components/sidebar';
import { Toaster } from '@/components/ui/sonner';
import { Navbar } from './_components/navbar';
import { CreateProjectModalProvider } from './_components/create-project-modal';

export default function WebAppLayout({ children }: { children: React.ReactNode }) {
  return (
    <CreateProjectModalProvider>
      <SidebarProvider>
        <ProtectedRoute>
          <Toaster position="top-center" />
          <AppSidebar />
          <main className="min-h-screen w-full">
            <Navbar />
            {children}
          </main>
        </ProtectedRoute>
      </SidebarProvider>
    </CreateProjectModalProvider>
  );
} 