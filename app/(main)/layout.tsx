"use client";
import { TokenGate } from "@/components/TokenHandler";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { AuthProvider } from "@/lib/auth";
import { ConvexProvider } from "@/components/providers/convex-provider";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <TokenGate>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem
        disableTransitionOnChange
      >
        <ConvexProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ConvexProvider>
      </ThemeProvider>
    </TokenGate>
  );
} 