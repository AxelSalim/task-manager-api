'use client';

import { useRouter } from 'next/navigation';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Mail, Lock, User } from 'lucide-react';
import Link from 'next/link';

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

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Inscription
          </CardTitle>
          <CardDescription className="text-center">
            Créez votre compte Task Manager
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Formik
            initialValues={{
              name: '',
              email: '',
              password: '',
              confirmPassword: '',
              consentPrivacyPolicy: false,
              consentTermsOfService: false,
            }}
            validationSchema={registerSchema}
            onSubmit={async (values, { setSubmitting, setFieldError }) => {
              try {
                await register({
                  name: values.name,
                  email: values.email,
                  password: values.password,
                  consentPrivacyPolicy: values.consentPrivacyPolicy,
                  consentTermsOfService: values.consentTermsOfService,
                });
                router.push('/tasks');
              } catch (error: any) {
                setFieldError('email', error.message || 'Erreur lors de l\'inscription');
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {({ isSubmitting, values, setFieldValue }) => (
              <Form className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Field
                      as={Input}
                      id="name"
                      name="name"
                      type="text"
                      placeholder="Votre nom"
                      className="pl-10"
                    />
                  </div>
                  <ErrorMessage
                    name="name"
                    component="p"
                    className="text-sm text-red-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Field
                      as={Input}
                      id="email"
                      name="email"
                      type="email"
                      placeholder="votre@email.com"
                      className="pl-10"
                    />
                  </div>
                  <ErrorMessage
                    name="email"
                    component="p"
                    className="text-sm text-red-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Mot de passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Field
                      as={Input}
                      id="password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10"
                    />
                  </div>
                  <ErrorMessage
                    name="password"
                    component="p"
                    className="text-sm text-red-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Field
                      as={Input}
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10"
                    />
                  </div>
                  <ErrorMessage
                    name="confirmPassword"
                    component="p"
                    className="text-sm text-red-500"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="consentPrivacyPolicy"
                      checked={values.consentPrivacyPolicy}
                      onCheckedChange={(checked) =>
                        setFieldValue('consentPrivacyPolicy', checked)
                      }
                    />
                    <Label
                      htmlFor="consentPrivacyPolicy"
                      className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      J'accepte la{' '}
                      <Link href="/privacy" className="text-primary hover:underline">
                        politique de confidentialité
                      </Link>
                    </Label>
                  </div>
                  <ErrorMessage
                    name="consentPrivacyPolicy"
                    component="p"
                    className="text-sm text-red-500"
                  />

                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="consentTermsOfService"
                      checked={values.consentTermsOfService}
                      onCheckedChange={(checked) =>
                        setFieldValue('consentTermsOfService', checked)
                      }
                    />
                    <Label
                      htmlFor="consentTermsOfService"
                      className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      J'accepte les{' '}
                      <Link href="/terms" className="text-primary hover:underline">
                        conditions d'utilisation
                      </Link>
                    </Label>
                  </div>
                  <ErrorMessage
                    name="consentTermsOfService"
                    component="p"
                    className="text-sm text-red-500"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Inscription...
                    </>
                  ) : (
                    'S\'inscrire'
                  )}
                </Button>
              </Form>
            )}
          </Formik>

          <div className="mt-4 text-center text-sm">
            <span className="text-slate-600 dark:text-slate-400">
              Déjà un compte ?{' '}
            </span>
            <Link
              href="/login"
              className="font-medium text-primary hover:underline"
            >
              Se connecter
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

