import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
} 