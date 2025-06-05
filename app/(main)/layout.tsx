"use client";
import { TokenGate } from "@/components/TokenHandler";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { AuthProvider } from "@/lib/auth";
import { Toaster } from "sonner";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <TokenGate>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem
        disableTransitionOnChange
      >
        <AuthProvider>
          {children}
          <Toaster position="top-center" />
        </AuthProvider>
      </ThemeProvider>
    </TokenGate>
  );
} 