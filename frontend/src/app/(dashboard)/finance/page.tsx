'use client';

import { type ReactNode, useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NewFinanceCategorySheet } from '@/components/finance/NewFinanceCategorySheet';
import { NewFinanceTransactionSheet } from '@/components/finance/NewFinanceTransactionSheet';
import {
  financeAPI,
  type FinanceCategoryDto,
  type FinanceTransactionDto,
  type FinanceTransactionType,
} from '@/lib/api';
import { Loader2, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

const TYPE_LABELS: Record<FinanceTransactionType, string> = {
  revenus: 'Revenus',
  factures: 'Factures',
  depenses: 'Dépenses',
  epargnes: 'Épargnes',
  credits: 'Crédits',
};

function FinancePage() {
  const [transactions, setTransactions] = useState<FinanceTransactionDto[]>([]);
  const [categories, setCategories] = useState<FinanceCategoryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [categorySheetOpen, setCategorySheetOpen] = useState(false);
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth() + 1);

  const { toast } = useToast();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [txList, catList] = await Promise.all([
        financeAPI.getTransactions({ year, month }),
        financeAPI.getCategories(),
      ]);
      setTransactions(txList);
      setCategories(catList);
    } catch (error: unknown) {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Impossible de charger les données',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [month, toast, year]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer cette transaction ?')) return;
    try {
      await financeAPI.deleteTransaction(id);
      toast({ title: 'Transaction supprimée' });
      loadData();
    } catch (error: unknown) {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Échec de la suppression',
        variant: 'destructive',
      });
    }
  };

  const totalIn = transactions
    .filter((t) => t.type === 'revenus')
    .reduce((s, t) => s + t.amount, 0);
  const totalOut = transactions
    .filter((t) => t.type !== 'revenus')
    .reduce((s, t) => s + t.amount, 0);

  const monthLabel = format(new Date(year, month - 1), 'MMMM yyyy', { locale: fr });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-xl font-semibold">Mon Suivi Financier</h1>
        <div className="flex items-center gap-2">
          <Select
            value={`${year}-${month}`}
            onValueChange={(v) => {
              const [y, m] = v.split('-').map(Number);
              setYear(y);
              setMonth(m);
            }}
          >
            <SelectTrigger className="w-[200px] rounded-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(() => {
                const items: ReactNode[] = [];
                const now = new Date();
                for (let y = now.getFullYear() - 1; y <= now.getFullYear() + 1; y++) {
                  for (let m = 1; m <= 12; m++) {
                    items.push(
                      <SelectItem key={`${y}-${m}`} value={`${y}-${m}`}>
                        {format(new Date(y, m - 1), 'MMMM yyyy', { locale: fr })}
                      </SelectItem>
                    );
                  }
                }
                return items;
              })()}
            </SelectContent>
          </Select>
          <NewFinanceCategorySheet
            open={categorySheetOpen}
            onOpenChange={setCategorySheetOpen}
            typeLabels={TYPE_LABELS}
            onCreated={loadData}
          />
          <NewFinanceTransactionSheet
            open={sheetOpen}
            onOpenChange={setSheetOpen}
            categories={categories}
            typeLabels={TYPE_LABELS}
            onCreated={loadData}
          />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Card className="rounded-sm border shadow-none">
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">Revenus (mois)</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <span className="text-xl font-semibold text-green-600">
              {totalIn.toLocaleString('fr-FR')} CFA
            </span>
          </CardContent>
        </Card>
        <Card className="rounded-sm border shadow-none">
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">Dépenses (mois)</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <span className="text-xl font-semibold text-red-600">
              {totalOut.toLocaleString('fr-FR')} CFA
            </span>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-sm border shadow-none">
        <CardHeader className="py-3 px-4 border-b">
          <CardTitle className="text-base font-semibold">Transactions — {monthLabel}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : transactions.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-6 px-4">Aucune transaction ce mois-ci.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="text-left py-2.5 px-4 font-medium">Date</th>
                    <th className="text-left py-2.5 px-4 font-medium">Type</th>
                    <th className="text-left py-2.5 px-4 font-medium">Catégorie</th>
                    <th className="text-right py-2.5 px-4 font-medium">Montant</th>
                    <th className="text-left py-2.5 px-4 font-medium">Commentaire</th>
                    <th className="w-10 px-2" />
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t) => (
                    <tr key={t.id} className="border-b last:border-0 hover:bg-muted/20">
                      <td className="py-2 px-4">{format(new Date(t.date), 'd MMM yyyy', { locale: fr })}</td>
                      <td className="py-2 px-4">{TYPE_LABELS[t.type]}</td>
                      <td className="py-2 px-4">{t.category?.name ?? '—'}</td>
                      <td className={`py-2 px-4 text-right font-medium ${t.type === 'revenus' ? 'text-green-600' : 'text-red-600'}`}>
                        {t.type === 'revenus' ? '+' : '-'}{Math.abs(t.amount).toLocaleString('fr-FR')} CFA
                      </td>
                      <td className="py-2 px-4 text-muted-foreground">{t.comment || '—'}</td>
                      <td className="py-2 px-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-sm" onClick={() => handleDelete(t.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default FinancePage;
