'use client';

import { useState, useEffect } from 'react';
import { Tag } from '@/types/tag';
import { TagBadge } from './TagBadge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { tagsAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface TagSelectorProps {
  selectedTagIds: number[];
  onSelectionChange: (tagIds: number[]) => void;
  className?: string;
}

export function TagSelector({ selectedTagIds, onSelectionChange, className }: TagSelectorProps) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#3b82f6');
  const { toast } = useToast();

  // Charger les tags
  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      setIsLoading(true);
      const tags = await tagsAPI.getAll();
      setTags(tags);
    } catch (error) {
      console.error('Erreur lors du chargement des tags:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les tags',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTagToggle = (tagId: number) => {
    if (selectedTagIds.includes(tagId)) {
      onSelectionChange(selectedTagIds.filter(id => id !== tagId));
    } else {
      onSelectionChange([...selectedTagIds, tagId]);
    }
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) {
      toast({
        title: 'Erreur',
        description: 'Le nom du tag est obligatoire',
        variant: 'destructive',
      });
      return;
    }

    try {
      const newTag = await tagsAPI.create({
        name: newTagName.trim(),
        color: newTagColor,
      });

      setTags([...tags, newTag]);
      setNewTagName('');
      setNewTagColor('#3b82f6');
      toast({
        title: 'Succès',
        description: 'Tag créé avec succès',
      });
    } catch (error) {
      console.error('Erreur lors de la création du tag:', error);
      const errorMessage = error instanceof Error ? error.message : 'Impossible de créer le tag';
      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const selectedTags = tags.filter(tag => selectedTagIds.includes(tag.id));

  return (
    <div className={cn('space-y-2', className)}>
      {/* Tags sélectionnés */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTags.map(tag => (
            <TagBadge
              key={tag.id}
              tag={tag}
              onRemove={() => handleTagToggle(tag.id)}
            />
          ))}
        </div>
      )}

      {/* Sélecteur de tags */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="w-full justify-start">
            <Plus className="mr-2 h-4 w-4" />
            {selectedTags.length > 0 
              ? `${selectedTags.length} tag${selectedTags.length > 1 ? 's' : ''} sélectionné${selectedTags.length > 1 ? 's' : ''}`
              : 'Ajouter des tags'
            }
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <div className="p-4 space-y-4">
            {/* Liste des tags existants */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Tags disponibles</Label>
              {isLoading ? (
                <div className="text-sm text-muted-foreground">Chargement...</div>
              ) : tags.length === 0 ? (
                <div className="text-sm text-muted-foreground">Aucun tag disponible</div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {tags.map(tag => (
                    <div
                      key={tag.id}
                      className="flex items-center space-x-2 p-2 rounded-md hover:bg-accent cursor-pointer"
                      onClick={() => handleTagToggle(tag.id)}
                    >
                      <Checkbox
                        checked={selectedTagIds.includes(tag.id)}
                        onCheckedChange={() => handleTagToggle(tag.id)}
                      />
                      <TagBadge tag={tag} variant="outline" size="sm" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Créer un nouveau tag */}
            <div className="space-y-2 border-t pt-4">
              <Label className="text-sm font-medium">Créer un nouveau tag</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Nom du tag"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  className="flex-1"
                />
                <input
                  type="color"
                  value={newTagColor}
                  onChange={(e) => setNewTagColor(e.target.value)}
                  className="h-10 w-16 rounded-md border cursor-pointer"
                />
                <Button
                  size="sm"
                  onClick={handleCreateTag}
                  disabled={!newTagName.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}



