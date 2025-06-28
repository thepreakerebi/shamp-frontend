"use client";
import { TokenGate } from "@/components/TokenHandler";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { AuthProvider } from "@/lib/auth";

// Force dynamic rendering to prevent static generation issues with useSearchParams in TokenGate
export const dynamic = 'force-dynamic';

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
        </AuthProvider>
      </ThemeProvider>
    </TokenGate>
  );
} 