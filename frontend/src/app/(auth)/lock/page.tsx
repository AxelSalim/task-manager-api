'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Lock } from 'lucide-react';
import Image from 'next/image';

export default function LockPage() {
  const router = useRouter();
  const { unlock, userName, status } = useAuth();
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (status !== 'locked') {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const digits = pin.replace(/\D/g, '');
    if (digits.length < 4 || digits.length > 8) {
      setError('Le PIN doit contenir entre 4 et 8 chiffres');
      return;
    }
    setLoading(true);
    try {
      await unlock(digits);
      router.push('/kanban');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Code PIN incorrect');
      setPin('');
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
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 text-primary mb-4">
              <Lock className="h-7 w-7" />
            </div>
            <h2 className="text-4xl font-bold text-slate-900">Verrouillé</h2>
            <p className="text-slate-600 mt-2">
              {userName ? `Bonjour ${userName}, entrez votre code PIN.` : 'Entrez votre code PIN pour continuer.'}
            </p>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pin">Code PIN</Label>
              <Input
                id="pin"
                type="password"
                inputMode="numeric"
                maxLength={8}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
                className="h-12 text-center text-lg tracking-[0.5em]"
                autoFocus
                autoComplete="off"
              />
            </div>
            <Button type="submit" className="w-full h-11" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Déverrouiller'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
