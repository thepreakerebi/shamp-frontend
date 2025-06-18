"use client";
import React from "react";
import { TokenGate } from "@/components/TokenHandler";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { AuthProvider } from "@/lib/auth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Toaster } from "@/components/ui/sonner";
import { useTestRuns } from "@/hooks/use-testruns";

function SocketProvider({ children }: { children: React.ReactNode }) {
  // establish socket after auth is available
  useTestRuns();
  return <>{children}</>;
}

export default function FullscreenLayout({ children }: { children: React.ReactNode }) {
  return (
    <TokenGate>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem
        disableTransitionOnChange
      >
        <AuthProvider>
          <SocketProvider>
            <ProtectedRoute>
              <Toaster position="top-center" />
              <main className="min-h-screen w-full">{children}</main>
            </ProtectedRoute>
          </SocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </TokenGate>
  );
} 