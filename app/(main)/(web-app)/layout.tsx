"use client";
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './_components/sidebar';

export default function WebAppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <ProtectedRoute>
        <AppSidebar />
        <main className="min-h-screen">
          <SidebarTrigger />
          {children}
        </main>
      </ProtectedRoute>
    </SidebarProvider>
  );
} 