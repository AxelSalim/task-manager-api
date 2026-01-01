'use client';

import { useState, useEffect } from 'react';
import { Tag } from '@/types/tag';
import { tagsAPI } from '@/lib/api';
import { TagBadge } from '@/components/tags/TagBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Edit, Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [deleteTagId, setDeleteTagId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    color: '#3b82f6',
  });
  const { toast } = useToast();

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      setIsLoading(true);
      const tags = await tagsAPI.getAll();
      setTags(tags);
    } catch (error: unknown) {
      console.error('Erreur lors du chargement des tags:', error);
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Impossible de charger les tags',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingTag(null);
    setFormData({ name: '', color: '#3b82f6' });
    setIsDialogOpen(true);
  };

  const handleEdit = (tag: Tag) => {
    setEditingTag(tag);
    setFormData({ name: tag.name, color: tag.color });
    setIsDialogOpen(true);
  };

  const handleDelete = (tagId: number) => {
    setDeleteTagId(tagId);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast({
        title: 'Erreur',
        description: 'Le nom du tag est obligatoire',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (editingTag) {
        await tagsAPI.update(editingTag.id, {
          name: formData.name.trim(),
          color: formData.color,
        });
        toast({
          title: 'Succès',
          description: 'Tag modifié avec succès',
        });
        loadTags();
        setIsDialogOpen(false);
      } else {
        await tagsAPI.create({
          name: formData.name.trim(),
          color: formData.color,
        });
        toast({
          title: 'Succès',
          description: 'Tag créé avec succès',
        });
        loadTags();
        setIsDialogOpen(false);
      }
    } catch (error: unknown) {
      console.error('Erreur lors de la sauvegarde du tag:', error);
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Impossible de sauvegarder le tag',
        variant: 'destructive',
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTagId) return;

    try {
      await tagsAPI.delete(deleteTagId);
      toast({
        title: 'Succès',
        description: 'Tag supprimé avec succès',
      });
      loadTags();
      setIsDeleteDialogOpen(false);
      setDeleteTagId(null);
    } catch (error: unknown) {
      console.error('Erreur lors de la suppression du tag:', error);
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Impossible de supprimer le tag',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Gestion des Tags</h1>
          <p className="text-slate-600 mt-2">
            Créez et gérez vos tags pour organiser vos tâches
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau tag
        </Button>
      </div>

      {/* Tags List */}
      {tags.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-slate-600 mb-4">Aucun tag créé pour le moment</p>
            <Button onClick={handleCreate} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Créer votre premier tag
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tags.map((tag) => (
            <Card key={tag.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    <TagBadge tag={tag} size="md" />
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(tag)}
                      className="h-8 w-8"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(tag.id)}
                      className="h-8 w-8 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-slate-600">
                  <p>Créé le {new Date(tag.createdAt).toLocaleDateString('fr-FR')}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTag ? 'Modifier le tag' : 'Nouveau tag'}
            </DialogTitle>
            <DialogDescription>
              {editingTag
                ? 'Modifiez les informations du tag ci-dessous.'
                : 'Remplissez les informations pour créer un nouveau tag.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom du tag *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Urgent, Personnel, Travail..."
                maxLength={50}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="color">Couleur</Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  id="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="h-10 w-20 rounded-md border cursor-pointer"
                />
                <div className="flex-1">
                  <Input
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    placeholder="#3b82f6"
                    pattern="^#[0-9A-F]{6}$"
                    maxLength={7}
                  />
                </div>
                <div
                  className="h-10 w-10 rounded-md border"
                  style={{ backgroundColor: formData.color }}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button onClick={handleSubmit}>
              {editingTag ? 'Enregistrer' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le tag ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le tag sera supprimé de toutes les tâches qui l&apos;utilisent.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

