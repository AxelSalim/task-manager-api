'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tag } from '@/types/tag';
import { tagsAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export type EditTagDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tag: Tag | null;
  onSaved?: () => void;
};

export function EditTagDialog({ open, onOpenChange, tag, onSaved }: EditTagDialogProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && tag) {
      setName(tag.name);
      setColor(tag.color);
    }
  }, [open, tag]);

  const handleSubmit = async () => {
    if (!tag || !name.trim()) {
      toast({
        title: 'Erreur',
        description: 'Le nom du tag est obligatoire',
        variant: 'destructive',
      });
      return;
    }
    setSaving(true);
    try {
      await tagsAPI.update(tag.id, { name: name.trim(), color });
      toast({ title: 'Succès', description: 'Tag modifié avec succès' });
      onOpenChange(false);
      onSaved?.();
    } catch (error: unknown) {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Impossible de sauvegarder le tag',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit tag</DialogTitle>
          <DialogDescription>
            Modifiez les informations du tag ci-dessous.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-tag-name">Nom du tag *</Label>
            <Input
              id="edit-tag-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Urgent, Personnel, Travail..."
              maxLength={50}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-tag-color">Couleur</Label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                id="edit-tag-color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-10 w-20 rounded-md border cursor-pointer"
              />
              <div className="flex-1">
                <Input
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="#3b82f6"
                  maxLength={7}
                />
              </div>
              <div className="h-10 w-10 rounded-md border" style={{ backgroundColor: color }} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
