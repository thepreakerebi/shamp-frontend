"use client";

import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { PageSkeleton } from '@/components/ui/page-skeleton';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, switchingWorkspace } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/');
    }
  }, [user, loading, router]);

  if (loading || switchingWorkspace || !user) {
    return <PageSkeleton variant={switchingWorkspace ? "workspace-switching" : "default"} />;
  }

  return <>{children}</>;
} 