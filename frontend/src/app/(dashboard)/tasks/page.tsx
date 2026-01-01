'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** Redirection : la vue principale est le Kanban. */
export default function TasksPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/kanban');
  }, [router]);
  return null;
}
