"use client";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { ConvexClientProvider } from "@/components/providers/convex-provider";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem
        disableTransitionOnChange
      >
        <ConvexClientProvider>
            {children}
        </ConvexClientProvider>
      </ThemeProvider>
  );
} 