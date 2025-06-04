import { useEffect } from 'react';
import { toast } from 'sonner';

export default function HomePage() {
  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('showLoggedInToast') === '1') {
      toast.success('You are logged in');
      localStorage.removeItem('showLoggedInToast');
    }
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center bg-background">
      <h1 className="text-2xl font-semibold text-center">Welcome to the home page</h1>
    </main>
  );
}
