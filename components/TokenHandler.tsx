"use client";
import { useEffect, useState, Suspense } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";

// Force dynamic rendering to prevent static generation issues with useSearchParams
export const dynamic = 'force-dynamic';

function TokenGateContent({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
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
  }, [searchParams, pathname, router]);

  if (!ready) return null;
  return <>{children}</>;
}

export function TokenGate({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<>{children}</>}>
      <TokenGateContent>{children}</TokenGateContent>
    </Suspense>
  );
} 