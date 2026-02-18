'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

const registerSchema = Yup.object().shape({
  name: Yup.string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .required('Le nom est obligatoire'),
  email: Yup.string()
    .email('Email invalide')
    .required('L\'email est obligatoire'),
  password: Yup.string()
    .min(6, 'Le mot de passe doit contenir au moins 6 caractères')
    .required('Le mot de passe est obligatoire'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Les mots de passe ne correspondent pas')
    .required('La confirmation du mot de passe est obligatoire'),
  consentPrivacyPolicy: Yup.boolean()
    .oneOf([true], 'Vous devez accepter la politique de confidentialité')
    .required(),
  consentTermsOfService: Yup.boolean()
    .oneOf([true], 'Vous devez accepter les conditions d\'utilisation')
    .required(),
});

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);

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
            <h1 className="text-7xl font-bold text-white">
              Spark
            </h1>
          </div>
        </div>
      </div>

      {/* Partie droite - Formulaire */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-white p-4 lg:p-8">
        <div className="w-full max-w-md space-y-4">
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
            <h2 className="text-3xl font-bold text-slate-900">Inscription</h2>
            <p className="text-slate-600 mt-2">Créez votre compte Spark</p>
          </div>

          {/* Formulaire */}
          <Formik
            initialValues={{
              name: '',
              email: '',
              password: '',
              confirmPassword: '',
              consentPrivacyPolicy: true,
              consentTermsOfService: true,
            }}
            validationSchema={registerSchema}
            onSubmit={async (values, { setSubmitting, setFieldError }) => {
              try {
                setRegisterError(null);
                await register({
                  name: values.name,
                  email: values.email,
                  password: values.password,
                  consentPrivacyPolicy: values.consentPrivacyPolicy,
                  consentTermsOfService: values.consentTermsOfService,
                });
                router.push('/tasks');
              } catch (error: unknown) {
                const errorMessage = error instanceof Error ? error.message : 'Erreur lors de l\'inscription';
                setRegisterError(errorMessage);
                if (errorMessage.includes('email') || errorMessage.includes('Email')) {
                  setFieldError('email', errorMessage);
                } else {
                  setFieldError('email', errorMessage);
                }
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {({ isSubmitting, values, setFieldValue }) => (
              <Form className="space-y-3">
                {/* Champ nom */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium text-slate-700">
                    Nom
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Field
                      as={Input}
                      id="name"
                      name="name"
                      type="text"
                      className="h-11 border-slate-200 text-slate-900 pl-10 pr-4 rounded-sm focus:bg-white focus:border-primary focus:outline-none focus-visible:ring-0 focus-visible:ring-transparent transition-all text-sm"
                      autoComplete="off"
                    />
                  </div>
                  <ErrorMessage
                    name="name"
                    component="p"
                    className="text-sm text-red-500 ml-1"
                  />
                </div>

                {/* Champ email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Field
                      as={Input}
                      id="email"
                      name="email"
                      type="email"
                      className="h-11 border-slate-200 text-slate-900 pl-10 pr-4 rounded-sm focus:bg-white focus:border-primary focus:outline-none focus-visible:ring-0 focus-visible:ring-transparent transition-all text-sm"
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
                  <Label htmlFor="password" className="text-sm font-medium text-slate-700">
                    Mot de passe
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Field
                      as={Input}
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      className="h-11 border-slate-200 text-slate-900 pl-10 pr-10 rounded-sm focus:bg-white focus:border-primary focus:outline-none focus-visible:ring-0 focus-visible:ring-transparent transition-all text-sm"
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

                {/* Champ confirmation mot de passe */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700">
                    Confirmer le mot de passe
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Field
                      as={Input}
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      className="h-11 border-slate-200 text-slate-900 pl-10 pr-10 rounded-sm focus:bg-white focus:border-primary focus:outline-none focus-visible:ring-0 focus-visible:ring-transparent transition-all text-sm"
                      autoComplete="off"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <ErrorMessage
                    name="confirmPassword"
                    component="p"
                    className="text-sm text-red-500 ml-1"
                  />
                </div>

                {/* Message d'erreur général */}
                {registerError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
                    {registerError}
                  </div>
                )}

                {/* Checkboxes de consentement (cachées mais toujours à true) */}
                <div className="hidden">
                  <Checkbox
                    id="consentPrivacyPolicy"
                    checked={values.consentPrivacyPolicy}
                    onCheckedChange={(checked) =>
                      setFieldValue('consentPrivacyPolicy', checked)
                    }
                  />
                  <Checkbox
                    id="consentTermsOfService"
                    checked={values.consentTermsOfService}
                    onCheckedChange={(checked) =>
                      setFieldValue('consentTermsOfService', checked)
                    }
                  />
                </div>

                {/* Bouton d'inscription */}
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
                    'S\'inscrire'
                  )}
                </Button>
              </Form>
            )}
          </Formik>

          {/* Lien vers la connexion */}
          <div className="text-center">
            <span className="text-sm text-slate-600">
              Déjà un compte ?&nbsp;
            </span>
            <Link
              href="/login"
              className="text-sm text-primary font-medium hover:text-primary/80 transition-colors underline"
            >
              Se connecter
            </Link>
          </div>

          {/* Texte légal */}
          <div className="text-center text-xs text-slate-500 px-4">
            En vous inscrivant, vous acceptez les{' '}
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
