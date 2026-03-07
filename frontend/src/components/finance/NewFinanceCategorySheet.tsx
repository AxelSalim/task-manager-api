'use client';

import { useEffect, useMemo, useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { financeAPI, type FinanceTransactionType } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus } from 'lucide-react';

type NewFinanceCategorySheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  typeLabels: Record<FinanceTransactionType, string>;
  onCreated?: () => void;
};

export function NewFinanceCategorySheet({
  open,
  onOpenChange,
  typeLabels,
  onCreated,
}: NewFinanceCategorySheetProps) {
  const { toast } = useToast();
  const typeOptions = useMemo(
    () => Object.keys(typeLabels) as FinanceTransactionType[],
    [typeLabels]
  );

  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<FinanceTransactionType>(typeOptions[0] ?? 'depenses');

  useEffect(() => {
    if (!open) {
      setSaving(false);
      setName('');
      setType(typeOptions[0] ?? 'depenses');
    }
  }, [open, typeOptions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      toast({ title: 'Nom requis', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      await financeAPI.createCategory({ name: trimmed, type });
      toast({ title: 'Catégorie créée' });
      onOpenChange(false);
      onCreated?.();
    } catch (error: unknown) {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : "Échec de l’enregistrement",
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex flex-col sm:max-w-lg rounded-none border-l p-0 gap-0">
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <SheetHeader className="shrink-0 border-b px-5 py-3">
            <SheetTitle className="text-lg">Nouvelle catégorie</SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-5 py-5">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="new-cat-name">Nom</Label>
                <Input
                  id="new-cat-name"
                  className="rounded-sm"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ex. Salaire net"
                  required
                />
              </div>

              <div className="grid gap-2 w-full">
                <Label htmlFor="new-cat-type">Type</Label>
                <Select value={type} onValueChange={(v) => setType(v as FinanceTransactionType)}>
                  <SelectTrigger id="new-cat-type" className="rounded-sm w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {typeOptions.map((t) => (
                      <SelectItem key={t} value={t}>
                        {typeLabels[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <SheetFooter className="shrink-0 flex flex-col gap-2 border-t bg-muted/30 px-5 py-4 rounded-sm">
            <Button type="submit" className="rounded-sm w-full" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enregistrer'}
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
        </form>
      </SheetContent>
    </Sheet>
  );
}
