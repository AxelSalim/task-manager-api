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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm rounded-sm">
        <DialogHeader>
          <DialogTitle>Supprimer le tag</DialogTitle>
          <DialogDescription>
            Cette action est irréversible. Le tag sera supprimé de toutes les tâches qui l&apos;utilisent.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-between">
          <DialogClose asChild>
            <Button variant="outline" className="rounded-sm" disabled={deleting}>
              Annuler
            </Button>
          </DialogClose>
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
