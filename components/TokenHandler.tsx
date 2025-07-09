"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic';

export function TokenGate({ children }: { children: React.ReactNode }) {
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
    
    // Use native URLSearchParams instead of useSearchParams hook
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");
    if (token) {
      localStorage.setItem("authToken", token);
      // Dispatch custom event to notify auth context of token change
      window.dispatchEvent(new CustomEvent('authTokenChanged', { detail: { token } }));
      // Remove token from URL but preserve other params
      const params = new URLSearchParams(window.location.search);
      params.delete("token");
      const newUrl = `${pathname}${params.toString() ? "?" + params.toString() : ""}`;
      router.replace(newUrl, { scroll: false });
      setReady(true);
    } else {
      setReady(true);
    }
  }, [mounted, pathname, router]);

  // During SSR and before mount, just render children
  if (!mounted || !ready) return <>{children}</>;
  
  return <>{children}</>;
} 