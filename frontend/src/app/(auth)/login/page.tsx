'use client';

import { useRouter } from 'next/navigation';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Mail, Lock } from 'lucide-react';
import Link from 'next/link';

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

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Connexion
          </CardTitle>
          <CardDescription className="text-center">
            Connectez-vous à votre compte Task Manager
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Formik
            initialValues={{
              email: '',
              password: '',
            }}
            validationSchema={loginSchema}
            onSubmit={async (values, { setSubmitting, setFieldError }) => {
              try {
                await login(values.email, values.password);
                router.push('/tasks');
              } catch (error: any) {
                setFieldError('password', error.message || 'Erreur de connexion');
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {({ isSubmitting }) => (
              <Form className="space-y-4">
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

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Connexion...
                    </>
                  ) : (
                    'Se connecter'
                  )}
                </Button>
              </Form>
            )}
          </Formik>

          <div className="mt-4 text-center text-sm">
            <span className="text-slate-600 dark:text-slate-400">
              Pas encore de compte ?{' '}
            </span>
            <Link
              href="/register"
              className="font-medium text-primary hover:underline"
            >
              S'inscrire
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

