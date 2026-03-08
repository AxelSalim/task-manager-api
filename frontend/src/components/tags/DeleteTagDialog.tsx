'use client';

import { useState } from 'react';
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
import { tagsAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export type DeleteTagDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tagId: number | null;
  onDeleted?: () => void;
};

export function DeleteTagDialog({ open, onOpenChange, tagId, onDeleted }: DeleteTagDialogProps) {
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  const handleConfirm = async () => {
    if (tagId == null) return;
    setDeleting(true);
    try {
      await tagsAPI.delete(tagId);
      toast({ title: 'Succès', description: 'Tag supprimé avec succès' });
      onOpenChange(false);
      onDeleted?.();
    } catch (error: unknown) {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Impossible de supprimer le tag',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer le tag</AlertDialogTitle>
          <AlertDialogDescription>
            Cette action est irréversible. Le tag sera supprimé de toutes les tâches qui l&apos;utilisent.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleConfirm();
            }}
            disabled={deleting}
            className="bg-red-600 hover:bg-red-700"
          >
            {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Supprimer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
