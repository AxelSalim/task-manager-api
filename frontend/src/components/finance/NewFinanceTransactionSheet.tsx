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
  SheetTrigger,
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
import { Loader2, Plus } from 'lucide-react';
import { format } from 'date-fns';

type NewFinanceTransactionSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: FinanceCategoryDto[];
  typeLabels: Record<FinanceTransactionType, string>;
  /** En mode édition : transaction à modifier (pas de trigger affiché) */
  transaction?: FinanceTransactionDto | null;
  /** Afficher le bouton "Ajouter une transaction" (false pour l'instance édition) */
  showTrigger?: boolean;
  onCreated?: () => void;
  onUpdated?: () => void;
};

export function NewFinanceTransactionSheet({
  open,
  onOpenChange,
  categories,
  typeLabels,
  transaction,
  showTrigger = true,
  onCreated,
  onUpdated,
}: NewFinanceTransactionSheetProps) {
  const { toast } = useToast();
  const typeOptions = useMemo(
    () => Object.keys(typeLabels) as FinanceTransactionType[],
    [typeLabels]
  );
  const isEdit = Boolean(transaction);

  const [saving, setSaving] = useState(false);
  const [date, setDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [type, setType] = useState<FinanceTransactionType>(typeOptions[0] ?? 'depenses');
  const [categoryId, setCategoryId] = useState<string>('none');
  const [amount, setAmount] = useState('');
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (!open) {
      setSaving(false);
      if (!transaction) {
        setDate(format(new Date(), 'yyyy-MM-dd'));
        setType(typeOptions[0] ?? 'depenses');
        setCategoryId('none');
        setAmount('');
        setComment('');
      }
    }
  }, [open, typeOptions, transaction]);

  useEffect(() => {
    if (open && transaction) {
      setDate(transaction.date);
      setType(transaction.type);
      setCategoryId(transaction.categoryId ? String(transaction.categoryId) : 'none');
      setAmount(String(transaction.amount));
      setComment(transaction.comment ?? '');
    }
  }, [open, transaction]);

  const categoriesByType = useMemo(
    () => categories.filter((c) => c.type === type),
    [categories, type]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount.replace(',', '.'));
    if (Number.isNaN(num)) {
      toast({ title: 'Montant invalide', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        date,
        type,
        categoryId: categoryId === 'none' ? null : parseInt(categoryId, 10),
        amount: num,
        comment: comment.trim() ? comment.trim() : null,
      };
      if (transaction) {
        await financeAPI.updateTransaction(transaction.id, payload);
        toast({ title: 'Transaction modifiée' });
        onUpdated?.();
      } else {
        await financeAPI.createTransaction(payload);
        toast({ title: 'Transaction ajoutée' });
        onCreated?.();
      }
      onOpenChange(false);
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
      {showTrigger && !transaction && (
        <SheetTrigger asChild>
          <Button className="rounded-sm">
            <Plus className="h-4 w-4 mr-2" />
            Ajouter une transaction
          </Button>
        </SheetTrigger>
      )}

      <SheetContent side="right" className="flex flex-col sm:max-w-lg rounded-none border-l p-0 gap-0">
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <SheetHeader className="shrink-0 border-b px-5 py-4 pr-12">
            <SheetTitle className="text-lg">
              {isEdit ? 'Modifier la transaction' : 'Nouvelle transaction'}
            </SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-5 py-5">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="tx-date">Date</Label>
                <Input
                  id="tx-date"
                  type="date"
                  className="rounded-sm"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="tx-type">Type</Label>
                <Select
                  value={type}
                  onValueChange={(v) => {
                    setType(v as FinanceTransactionType);
                    setCategoryId('none');
                  }}
                >
                  <SelectTrigger id="tx-type" className="rounded-sm w-full">
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
                <Label htmlFor="tx-category">Catégorie</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger id="tx-category" className="rounded-sm w-full">
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
                <Label htmlFor="tx-amount">Montant (CFA)</Label>
                <Input
                  id="tx-amount"
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
                <Label htmlFor="tx-comment">Commentaire</Label>
                <Input
                  id="tx-comment"
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

