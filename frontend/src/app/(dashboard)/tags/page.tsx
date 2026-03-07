'use client';

import { useState, useEffect } from 'react';
import { Tag } from '@/types/tag';
import { tagsAPI } from '@/lib/api';
import { TagBadge } from '@/components/tags/TagBadge';
import { CreateTagDialog } from '@/components/tags/CreateTagDialog';
import { EditTagDialog } from '@/components/tags/EditTagDialog';
import { DeleteTagDialog } from '@/components/tags/DeleteTagDialog';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTagId, setDeleteTagId] = useState<number | null>(null);
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

  const handleCreate = () => setCreateDialogOpen(true);

  const handleEdit = (tag: Tag) => {
    setEditingTag(tag);
    setEditDialogOpen(true);
  };

  const handleDelete = (tagId: number) => {
    setDeleteTagId(tagId);
    setDeleteDialogOpen(true);
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

      <CreateTagDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreated={loadTags}
      />
      <EditTagDialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) setEditingTag(null);
        }}
        tag={editingTag}
        onSaved={loadTags}
      />
      <DeleteTagDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        tagId={deleteTagId}
        onDeleted={loadTags}
      />
    </div>
  );
}

