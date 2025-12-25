'use client';

import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, Save, X } from 'lucide-react';
import { authAPI, getAvatarUrl } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const profileSchema = Yup.object().shape({
  name: Yup.string()
    .required('Le nom est requis')
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères'),
  email: Yup.string()
    .email('Email invalide')
    .required('L\'email est requis'),
});

export default function ProfilePage() {
  const { user, updateUser, refreshUser } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const formik = useFormik({
    initialValues: {
      name: user?.name || '',
      email: user?.email || '',
    },
    validationSchema: profileSchema,
    enableReinitialize: true,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        // Mettre à jour le nom via l'API
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/me`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({ name: values.name }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Erreur lors de la mise à jour');
        }

        const data = await response.json();
        
        // Mettre à jour le contexte avec les données du serveur
        updateUser(data.data);
        
        toast({
          title: 'Profil mis à jour',
          description: 'Vos informations ont été mises à jour avec succès.',
        });
      } catch (error: any) {
        toast({
          title: 'Erreur',
          description: error.message || 'Impossible de mettre à jour le profil.',
          variant: 'destructive',
        });
      } finally {
        setSubmitting(false);
      }
    },
  });

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner une image.',
        variant: 'destructive',
      });
      return;
    }

    // Vérifier la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Erreur',
        description: 'L\'image ne doit pas dépasser 5MB.',
        variant: 'destructive',
      });
      return;
    }

    // Prévisualisation
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/updateavatar`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Erreur lors de l\'upload');
      }

      const data = await response.json();
      console.log('✅ Response data:', data); // Debug
      
      // La réponse backend retourne { code: 200, data: { avatar: url }, message: "..." }
      const avatarUrl = data.data?.avatar || data.avatar;
      
      if (!avatarUrl) {
        console.error('❌ URL d\'avatar manquante:', data);
        throw new Error('URL d\'avatar manquante dans la réponse');
      }
      
      console.log('✅ Avatar URL reçue:', avatarUrl);
      
      // Mettre à jour le contexte avec l'URL relative (comme stockée en base)
      // Le contexte utilisera getAvatarUrl pour construire l'URL complète
      updateUser({ ...user!, avatar: avatarUrl });
      
      // Rafraîchir les données utilisateur depuis le serveur pour s'assurer de la synchronisation
      await refreshUser();
      
      console.log('✅ Utilisateur mis à jour, avatar:', avatarUrl);
      
      toast({
        title: 'Avatar mis à jour',
        description: 'Votre avatar a été mis à jour avec succès.',
      });
      
      setAvatarPreview(null);
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour l\'avatar.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Mon Profil</h1>
        <p className="text-slate-600 mt-2">
          Gérez vos informations personnelles et votre avatar
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Avatar Section */}
        <Card>
          <CardHeader>
            <CardTitle>Photo de profil</CardTitle>
            <CardDescription>
              Cliquez sur l'avatar pour le modifier
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <div className="relative">
              <Avatar className="h-32 w-32">
                <AvatarImage
                  src={avatarPreview || getAvatarUrl(user?.avatar) || undefined}
                  alt={user?.name || 'User'}
                />
                <AvatarFallback className="text-2xl">
                  {user?.name ? getInitials(user.name) : 'U'}
                </AvatarFallback>
              </Avatar>
              <Button
                size="icon"
                className="absolute bottom-0 right-0 rounded-full"
                onClick={handleAvatarClick}
                disabled={isUploading}
              >
                <Camera className="h-4 w-4" />
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
            {isUploading && (
              <p className="text-sm text-slate-600">Upload en cours...</p>
            )}
          </CardContent>
        </Card>

        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle>Informations personnelles</CardTitle>
            <CardDescription>
              Mettez à jour vos informations de profil
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={formik.handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formik.values.name}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={cn(
                    formik.touched.name && formik.errors.name && 'border-red-500'
                  )}
                />
                {formik.touched.name && formik.errors.name && (
                  <p className="text-sm text-red-500">{formik.errors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  disabled
                  className="bg-slate-50"
                />
                <p className="text-xs text-slate-500">
                  L'email ne peut pas être modifié
                </p>
              </div>

              <Button type="submit" disabled={formik.isSubmitting}>
                <Save className="h-4 w-4 mr-2" />
                {formik.isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

