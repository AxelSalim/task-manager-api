'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Loader2 } from 'lucide-react';
import { habitsAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export interface CreateHabitSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export function CreateHabitSheet({ open, onOpenChange, onSaved }: CreateHabitSheetProps) {
  const [habitName, setHabitName] = useState('');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) setHabitName('');
  }, [open]);

  const handleSave = async () => {
    const name = habitName.trim();
    if (!name) return;
    setSaving(true);
    try {
      await habitsAPI.create({ name });
      toast({ title: 'Habitude créée' });
      onOpenChange(false);
      setHabitName('');
      onSaved();
    } catch (error: unknown) {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Impossible de sauvegarder',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex flex-col sm:max-w-lg rounded-none border-l p-0 gap-0"
      >
        <SheetHeader className="shrink-0 border-b px-5 py-3">
          <SheetTitle className="text-lg">Ajouter une habitude</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-5 py-5">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="create-habit-name">Nom</Label>
              <Input
                id="create-habit-name"
                className="rounded-sm"
                value={habitName}
                onChange={(e) => setHabitName(e.target.value)}
                placeholder="Ex. 10 min de lecture"
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              />
            </div>
          </div>
        </div>
        <SheetFooter className="shrink-0 flex flex-col gap-2 border-t bg-muted/30 px-5 py-4 rounded-sm">
          <Button
            className="rounded-sm w-full"
            onClick={handleSave}
            disabled={!habitName.trim() || saving}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Enregistrer
          </Button>
          <Button
            type="button"
            variant="outline"
            className="rounded-sm w-full"
            onClick={() => onOpenChange(false)}
          >
            Annuler
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
