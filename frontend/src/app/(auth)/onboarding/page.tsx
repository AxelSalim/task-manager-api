'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';

export default function OnboardingPage() {
  const router = useRouter();
  const { completeOnboarding, status } = useAuth();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (status !== 'onboarding') {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmed = name.trim();
    if (!trimmed || trimmed.length < 2) {
      setError('Entrez au moins 2 caractères');
      return;
    }
    setLoading(true);
    try {
      await completeOnboarding(trimmed);
      router.push('/kanban');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:flex lg:w-1/2 bg-primary items-center justify-center p-8">
        <div className="text-center space-y-4">
          <div className="flex flex-col items-center justify-center gap-0">
            <div className="relative w-24 h-24">
              <Image
                src="/logo_SPARK.png"
                alt="Spark Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <h1 className="text-7xl font-bold text-white">Spark</h1>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center bg-white p-4 lg:p-8">
        <div className="w-full max-w-md space-y-6">
          <div className="lg:hidden text-center">
            <div className="relative w-20 h-20 mx-auto">
              <Image src="/logo_SPARK.png" alt="Spark" fill className="object-contain" priority />
            </div>
            <h1 className="text-6xl font-bold text-primary mt-2">Spark</h1>
          </div>

          <div className="text-center">
            <h2 className="text-4xl font-bold text-slate-900">Bienvenue</h2>
            <p className="text-slate-600 mt-2">Comment vous appelez-vous ?</p>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Votre prénom ou nom</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex"
                className="h-11"
                autoFocus
                autoComplete="given-name"
              />
            </div>
            <Button type="submit" className="w-full h-11" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Commencer'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
