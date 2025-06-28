"use client";
import { useEffect, useState } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";

// Force dynamic rendering to prevent static generation issues with useSearchParams
export const dynamic = 'force-dynamic';

export function TokenGate({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [ready, setReady] = useState(false);

  // Prevent hydration mismatch by only running client-side logic after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    // Skip TokenHandler logic on /reset-password route
    if (pathname === "/reset-password") {
      setReady(true);
      return;
    }
    
    const token = searchParams.get("token");
    if (token) {
      localStorage.setItem("authToken", token);
      // Remove token from URL but preserve other params
      const params = new URLSearchParams(window.location.search);
      params.delete("token");
      const newUrl = `${pathname}${params.toString() ? "?" + params.toString() : ""}`;
      router.replace(newUrl, { scroll: false });
      setReady(true);
    } else {
      setReady(true);
    }
  }, [mounted, searchParams, pathname, router]);

  // During SSR and before mount, just render children
  if (!mounted || !ready) return <>{children}</>;
  
  return <>{children}</>;
} 