"use client";
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function WebAppLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
} 