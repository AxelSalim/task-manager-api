'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Lock, Loader2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { authAPI } from '@/lib/api';

type Step = 'email' | 'otp' | 'password';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!email.trim()) {
      setError("L'email est obligatoire");
      return;
    }
    setLoading(true);
    try {
      await authAPI.forgotPassword(email.trim());
      setSuccess('Si cet email existe, vous recevrez un code à 6 chiffres par email.');
      setStep('otp');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!otp.trim() || otp.trim().length !== 6) {
      setError('Le code doit contenir exactement 6 chiffres');
      return;
    }
    setLoading(true);
    try {
      const res = await authAPI.verifyOTP(email.trim(), otp.trim());
      setResetToken(res.reset_token);
      setStep('password');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Code invalide ou expiré');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (newPassword.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Les deux mots de passe ne correspondent pas');
      return;
    }
    setLoading(true);
    try {
      await authAPI.resetPassword(resetToken, newPassword);
      setSuccess('Mot de passe réinitialisé. Vous pouvez vous connecter.');
      setTimeout(() => router.push('/login'), 2000);
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
          <div className="lg:hidden text-center space-y-2">
            <div className="relative w-20 h-20 mx-auto">
              <Image
                src="/logo_SPARK.png"
                alt="Spark Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <h1 className="text-6xl font-bold text-primary">Spark</h1>
          </div>

          <div className="text-center">
            <h2 className="text-4xl font-bold text-slate-900">Mot de passe oublié</h2>
            <p className="text-slate-600 mt-2">
              {step === 'email' && "Saisissez votre email pour recevoir un code de réinitialisation."}
              {step === 'otp' && "Entrez le code à 6 chiffres reçu par email."}
              {step === 'password' && "Choisissez un nouveau mot de passe."}
            </p>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
              {success}
            </div>
          )}

          {step === 'email' && (
            <form onSubmit={handleSendOTP} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="vous@exemple.com"
                    className="pl-10"
                    autoComplete="email"
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Envoyer le code'}
              </Button>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">Code à 6 chiffres</Label>
                <Input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="text-center text-lg tracking-widest"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Vérifier le code'}
              </Button>
              <button
                type="button"
                onClick={() => setStep('email')}
                className="w-full text-sm text-slate-500 hover:text-slate-700"
              >
                Changer d&apos;email
              </button>
            </form>
          )}

          {step === 'password' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 caractères"
                    className="pl-10"
                    minLength={6}
                    autoComplete="new-password"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirmer"
                    className="pl-10"
                    autoComplete="new-password"
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Réinitialiser le mot de passe'}
              </Button>
            </form>
          )}

          <p className="text-center text-sm text-slate-600">
            <Link href="/login" className="text-primary hover:underline">
              Retour à la connexion
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
