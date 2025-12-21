'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';

const loginSchema = Yup.object().shape({
  email: Yup.string()
    .email('Email invalide')
    .required('L\'email est obligatoire'),
  password: Yup.string()
    .min(6, 'Le mot de passe doit contenir au moins 6 caractères')
    .required('Le mot de passe est obligatoire'),
});

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  return (
    <div className="flex min-h-screen">
      {/* Partie gauche - Logo et nom avec fond primaire */}
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

      {/* Partie droite - Formulaire */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-white p-4 lg:p-8">
        <div className="w-full max-w-md space-y-6">
          {/* Logo et titre pour mobile */}
          <div className="lg:hidden text-center space-y-2">
            <div className="flex flex-col items-center justify-center gap-0">
              <div className="relative w-20 h-20">
                <Image
                  src="/logo_SPARK.png"
                  alt="Spark Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <h1 className="text-6xl font-bold text-primary">
                Spark
              </h1>
            </div>
          </div>

          {/* Titre */}
          <div className="text-center">
            <h2 className="text-3xl font-bold text-slate-900">Connexion</h2>
            <p className="text-slate-600 mt-2">Connectez-vous à votre compte Spark</p>
          </div>

          {/* Formulaire */}
        <Formik
          initialValues={{
            email: '',
            password: '',
          }}
          validationSchema={loginSchema}
          onSubmit={async (values, { setSubmitting, setFieldError }) => {
            try {
              setLoginError(null);
              await login(values.email, values.password);
              router.push('/tasks');
            } catch (error: unknown) {
              const errorMessage = error instanceof Error ? error.message : 'Erreur de connexion';
              setLoginError(errorMessage);
              // Définir l'erreur sur le champ approprié
              if (errorMessage.includes('email') || errorMessage.includes('Email')) {
                setFieldError('email', errorMessage);
              } else if (errorMessage.includes('mot de passe') || errorMessage.includes('password')) {
                setFieldError('password', errorMessage);
              } else {
                setFieldError('email', errorMessage);
              }
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {({ isSubmitting }) => (
            <Form className="space-y-4">
              {/* Champ email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700 text-sm font-medium">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Field
                    as={Input}
                    id="email"
                    name="email"
                    type="email"
                    className="h-11 bg-slate-50 border-slate-200 text-slate-900 pl-10 pr-4 rounded-sm focus:bg-white focus:border-primary focus:outline-none focus-visible:ring-0 focus-visible:ring-transparent transition-all text-sm"
                    autoComplete="off"
                  />
                </div>
                <ErrorMessage
                  name="email"
                  component="p"
                  className="text-sm text-red-500 ml-1"
                />
              </div>

              {/* Champ mot de passe */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-700 text-sm font-medium">
                  Mot de passe
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Field
                    as={Input}
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    className="h-11 bg-slate-50 border-slate-200 text-slate-900 pl-10 pr-10 rounded-sm focus:bg-white focus:border-primary focus:outline-none focus-visible:ring-0 focus-visible:ring-transparent transition-all text-sm"
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <ErrorMessage
                  name="password"
                  component="p"
                  className="text-sm text-red-500 ml-1"
                />
              </div>

              {/* Message d'erreur général */}
              {loginError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
                  {loginError}
                </div>
              )}

              {/* Bouton de connexion */}
              <Button
                type="submit"
                className="w-full h-11 mt-2 bg-primary text-white hover:bg-primary/90 font-semibold text-md rounded-sm shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  </>
                ) : (
                  'Se connecter'
                )}
              </Button>
            </Form>
          )}
        </Formik>

          {/* Lien vers l'inscription */}
          <div className="text-center">
            {/* Lien mot de passe oublié */}
            <div className="text-center mb-2">
              <Link
                href="/forgot-password"
                className="text-sm text-slate-600 hover:text-slate-800 transition-colors"
              >
                Mot de passe oublié ?
              </Link>
            </div>
            <span className="text-sm text-slate-600">
              Pas encore de compte ?&nbsp;
            </span>
            <Link
              href="/register"
              className="text-sm text-primary font-medium hover:text-primary/80 transition-colors underline"
            >
              S&apos;inscrire
            </Link>
          </div>

          {/* Texte légal */}
          <div className="text-center text-xs text-slate-500 px-4">
            En vous connectant, vous acceptez les{' '}
            <Link href="/terms" className="underline hover:text-slate-700 transition-colors">
              Conditions Générales
            </Link>
            {' '}et la{' '}
            <Link href="/privacy" className="underline hover:text-slate-700 transition-colors">
              Politique de Confidentialité
            </Link>
            {' '}de Spark.
          </div>
        </div>
      </div>
    </div>
  );
}
