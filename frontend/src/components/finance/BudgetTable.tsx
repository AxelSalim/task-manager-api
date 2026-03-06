'use client';

import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { FinanceBudgetEntryDto, FinanceCategoryDto, FinanceTransactionType } from '@/lib/api';
import { cn } from '@/lib/utils';

const TYPE_ORDER: FinanceTransactionType[] = [
  'revenus',
  'factures',
  'depenses',
  'epargnes',
  'credits',
];

export function BudgetTable({
  categories,
  budgetByCategory,
  typeLabels,
  onSave,
  getSaving,
}: {
  categories: FinanceCategoryDto[];
  budgetByCategory: Map<number, FinanceBudgetEntryDto>;
  typeLabels: Record<FinanceTransactionType, string>;
  onSave: (categoryId: number, amount: number) => void;
  getSaving: (categoryId: number) => boolean;
}) {
  const sortedCategories = React.useMemo(() => {
    return [...categories].sort((a, b) => {
      const orderA = TYPE_ORDER.indexOf(a.type as FinanceTransactionType);
      const orderB = TYPE_ORDER.indexOf(b.type as FinanceTransactionType);
      if (orderA !== orderB) return orderA - orderB;
      return a.name.localeCompare(b.name);
    });
  }, [categories]);

  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-muted/40 hover:bg-muted/40 border-b">
          <TableHead className="rounded-none font-medium w-[40%]">Catégorie</TableHead>
          <TableHead className="rounded-none font-medium w-[20%]">Type</TableHead>
          <TableHead className="rounded-none font-medium text-right w-[40%]">
            Montant budgété (CFA)
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedCategories.map((cat) => (
          <BudgetTableRow
            key={cat.id}
            category={cat}
            entry={budgetByCategory.get(cat.id)}
            typeLabels={typeLabels}
            onSave={(amount) => onSave(cat.id, amount)}
            saving={getSaving(cat.id)}
          />
        ))}
      </TableBody>
    </Table>
  );
}

function BudgetTableRow({
  category,
  entry,
  typeLabels,
  onSave,
  saving,
}: {
  category: FinanceCategoryDto;
  entry?: FinanceBudgetEntryDto;
  typeLabels: Record<FinanceTransactionType, string>;
  onSave: (amount: number) => void;
  saving: boolean;
}) {
  const [localValue, setLocalValue] = React.useState<string | null>(null);
  const displayValue =
    localValue !== null ? localValue : String(entry?.amount ?? 0);

  const handleBlur = () => {
    if (localValue === null) return;
    const parsed = parseFloat(localValue.replace(/\s/g, '').replace(',', '.'));
    if (!Number.isNaN(parsed) && parsed >= 0) {
      onSave(parsed);
      setLocalValue(null);
    } else {
      setLocalValue(null);
    }
  };

  /** N'autorise que les chiffres et un séparateur décimal (virgule ou point) */
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === '') {
      setLocalValue('');
      return;
    }
    const filtered = raw.replace(/[^\d,.]/g, '');
    const parts = filtered.split(/[,.]/);
    if (parts.length > 2) return;
    setLocalValue(filtered);
  };

  const typeLabel = typeLabels[category.type as FinanceTransactionType] ?? category.type;
  const isRevenus = category.type === 'revenus';

  return (
    <TableRow className={cn('align-middle', isRevenus && 'bg-primary/5')}>
      <TableCell className="font-medium">
        <span className="text-foreground">{category.name}</span>
      </TableCell>
      <TableCell>
        <span
          className={cn(
            'text-sm',
            isRevenus ? 'text-green-700 dark:text-green-400' : 'text-muted-foreground'
          )}
        >
          {typeLabel}
        </span>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-2">
          <Input
            type="text"
            inputMode="decimal"
            className="max-w-[160px] rounded-sm text-right h-9"
            value={displayValue}
            onChange={handleAmountChange}
            onBlur={handleBlur}
            placeholder="0"
            disabled={saving}
          />
          <span className="text-sm text-muted-foreground shrink-0 w-8">CFA</span>
          {saving && (
            <Loader2
              className="h-4 w-4 animate-spin text-muted-foreground shrink-0"
              aria-hidden
            />
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}
