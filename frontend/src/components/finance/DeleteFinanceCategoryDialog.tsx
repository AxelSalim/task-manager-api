'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { financeAPI, type FinanceCategoryDto } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export interface DeleteFinanceCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: FinanceCategoryDto | null;
  onDeleted: () => void;
}

export function DeleteFinanceCategoryDialog({
  open,
  onOpenChange,
  category,
  onDeleted,
}: DeleteFinanceCategoryDialogProps) {
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  const handleConfirm = async () => {
    if (!category) return;
    setDeleting(true);
    try {
      await financeAPI.deleteCategory(category.id);
      toast({ title: 'Catégorie supprimée' });
      onOpenChange(false);
      onDeleted();
    } catch (error: unknown) {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Impossible de supprimer la catégorie',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm rounded-sm">
        <DialogHeader>
          <DialogTitle>Supprimer la catégorie</DialogTitle>
          <DialogDescription>
            {category
              ? `« ${category.name} » sera supprimée. Cette action est irréversible.`
              : 'Cette action est irréversible.'}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-between">
          <DialogClose asChild>
            <Button variant="outline" className="rounded-sm" disabled={deleting}>
              Annuler
            </Button>
          </DialogClose>
          {category && (
            <Button
              variant="destructive"
              className="rounded-sm"
              disabled={deleting}
              onClick={(e) => {
                e.preventDefault();
                handleConfirm();
              }}
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Supprimer
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
