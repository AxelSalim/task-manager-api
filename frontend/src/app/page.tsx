'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { status, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    switch (status) {
      case 'onboarding':
        router.push('/onboarding');
        break;
      case 'locked':
        router.push('/lock');
        break;
      case 'authenticated':
        router.push('/kanban');
        break;
      default:
        break;
    }
  }, [status, loading, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
