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
import { habitsAPI, type HabitDto } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export interface DeleteHabitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  habit: HabitDto | null;
  onDeleted: () => void;
}

export function DeleteHabitDialog({
  open,
  onOpenChange,
  habit,
  onDeleted,
}: DeleteHabitDialogProps) {
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  const handleConfirm = async () => {
    if (!habit) return;
    setDeleting(true);
    try {
      await habitsAPI.delete(habit.id);
      toast({ title: 'Habitude supprimée' });
      onOpenChange(false);
      onDeleted();
    } catch (error: unknown) {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Impossible de supprimer',
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
          <DialogTitle>Supprimer l&apos;habitude</DialogTitle>
          <DialogDescription>
            {habit
              ? `« ${habit.name} » et toutes ses complétions seront supprimées. Cette action est irréversible.`
              : 'Cette action est irréversible.'}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
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
