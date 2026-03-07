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
import { tagsAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export type CreateTagDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
};

export function CreateTagDialog({ open, onOpenChange, onCreated }: CreateTagDialogProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setName('');
      setColor('#3b82f6');
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast({
        title: 'Erreur',
        description: 'Le nom du tag est obligatoire',
        variant: 'destructive',
      });
      return;
    }
    setSaving(true);
    try {
      await tagsAPI.create({ name: name.trim(), color });
      toast({ title: 'Succès', description: 'Tag créé avec succès' });
      onOpenChange(false);
      onCreated?.();
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
          <DialogTitle>Create tag</DialogTitle>
          <DialogDescription>
            Remplissez les informations pour créer un nouveau tag.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="create-tag-name">Nom du tag *</Label>
            <Input
              id="create-tag-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Urgent, Personnel, Travail..."
              maxLength={50}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-tag-color">Couleur</Label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                id="create-tag-color"
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
            Créer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
