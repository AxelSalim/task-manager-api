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
import {
  financeAPI,
  type FinanceCategoryDto,
  type FinanceTransactionDto,
  type FinanceTransactionType,
} from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export type EditFinanceTransactionSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: FinanceTransactionDto | null;
  categories: FinanceCategoryDto[];
  typeLabels: Record<FinanceTransactionType, string>;
  onUpdated?: () => void;
};

export function EditFinanceTransactionSheet({
  open,
  onOpenChange,
  transaction,
  categories,
  typeLabels,
  onUpdated,
}: EditFinanceTransactionSheetProps) {
  const { toast } = useToast();
  const typeOptions = useMemo(
    () => Object.keys(typeLabels) as FinanceTransactionType[],
    [typeLabels]
  );

  const [saving, setSaving] = useState(false);
  const [date, setDate] = useState('');
  const [type, setType] = useState<FinanceTransactionType>(typeOptions[0] ?? 'depenses');
  const [categoryId, setCategoryId] = useState<string>('none');
  const [amount, setAmount] = useState('');
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (open && transaction) {
      setDate(transaction.date);
      setType(transaction.type);
      setCategoryId(transaction.categoryId ? String(transaction.categoryId) : 'none');
      setAmount(String(transaction.amount));
      setComment(transaction.comment ?? '');
    }
  }, [open, transaction]);

  useEffect(() => {
    if (!open) setSaving(false);
  }, [open]);

  const categoriesByType = useMemo(
    () => categories.filter((c) => c.type === type),
    [categories, type]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transaction) return;
    const num = parseFloat(amount.replace(',', '.'));
    if (Number.isNaN(num)) {
      toast({ title: 'Montant invalide', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      await financeAPI.updateTransaction(transaction.id, {
        date,
        type,
        categoryId: categoryId === 'none' ? null : parseInt(categoryId, 10),
        amount: num,
        comment: comment.trim() ? comment.trim() : null,
      });
      toast({ title: 'Transaction modifiée' });
      onOpenChange(false);
      onUpdated?.();
    } catch (error: unknown) {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : "Échec de l'enregistrement",
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (!transaction) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex flex-col sm:max-w-lg rounded-none border-l p-0 gap-0">
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <SheetHeader className="shrink-0 border-b px-5 py-3 pr-12">
            <SheetTitle className="text-lg">Modifier une transaction</SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-5 py-5">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-tx-date">Date</Label>
                <Input
                  id="edit-tx-date"
                  type="date"
                  className="rounded-sm"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-tx-type">Type</Label>
                <Select
                  value={type}
                  onValueChange={(v) => {
                    setType(v as FinanceTransactionType);
                    setCategoryId('none');
                  }}
                >
                  <SelectTrigger id="edit-tx-type" className="rounded-sm w-full">
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
              <div className="grid gap-2">
                <Label htmlFor="edit-tx-category">Catégorie</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger id="edit-tx-category" className="rounded-sm w-full">
                    <SelectValue placeholder="Aucune" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucune</SelectItem>
                    {categoriesByType.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-tx-amount">Montant (CFA)</Label>
                <Input
                  id="edit-tx-amount"
                  type="text"
                  inputMode="decimal"
                  className="rounded-sm"
                  placeholder="0"
                  value={amount}
                  onChange={(e) => {
                    const raw = e.target.value;
                    if (raw === '') {
                      setAmount('');
                      return;
                    }
                    const filtered = raw.replace(/[^\d,.]/g, '');
                    const parts = filtered.split(/[,.]/);
                    if (parts.length <= 2) setAmount(filtered);
                  }}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-tx-comment">Commentaire</Label>
                <Input
                  id="edit-tx-comment"
                  className="rounded-sm"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Optionnel"
                />
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
