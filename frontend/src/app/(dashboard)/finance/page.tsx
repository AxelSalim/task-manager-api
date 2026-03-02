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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { NewFinanceCategorySheet } from '@/components/finance/NewFinanceCategorySheet';
import { NewFinanceTransactionSheet } from '@/components/finance/NewFinanceTransactionSheet';
import { FinanceMonthChart } from '@/components/finance/FinanceMonthChart';
import { RealVsBudgetDataTable } from '@/components/finance/RealVsBudgetDataTable';
import { TransactionsDataTable } from '@/components/finance/TransactionsDataTable';
import {
  financeAPI,
  type FinanceBudgetEntryDto,
  type FinanceCategoryDto,
  type FinanceDashboardDto,
  type FinanceTransactionDto,
  type FinanceTransactionType,
} from '@/lib/api';
import { Download, Loader2, LayoutDashboard, List, PiggyBank } from 'lucide-react';
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
  const [budgetEntries, setBudgetEntries] = useState<FinanceBudgetEntryDto[]>([]);
  const [dashboard, setDashboard] = useState<FinanceDashboardDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [budgetLoading, setBudgetLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<FinanceTransactionDto | null>(null);
  const [categorySheetOpen, setCategorySheetOpen] = useState(false);
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth() + 1);
  const [budgetSaving, setBudgetSaving] = useState<Record<string, boolean>>({});

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

  const loadDashboard = useCallback(async () => {
    setDashboardLoading(true);
    try {
      const data = await financeAPI.getDashboard({ year, month });
      setDashboard(data);
    } catch (error: unknown) {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Impossible de charger le dashboard',
        variant: 'destructive',
      });
    } finally {
      setDashboardLoading(false);
    }
  }, [month, toast, year]);

  const loadBudget = useCallback(async () => {
    setBudgetLoading(true);
    try {
      const data = await financeAPI.getBudget({ year, month });
      setBudgetEntries(data);
    } catch (error: unknown) {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Impossible de charger le budget',
        variant: 'destructive',
      });
    } finally {
      setBudgetLoading(false);
    }
  }, [month, toast, year]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    loadBudget();
  }, [loadBudget]);

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer cette transaction ?')) return;
    try {
      await financeAPI.deleteTransaction(id);
      toast({ title: 'Transaction supprimée' });
      loadData();
      loadDashboard();
    } catch (error: unknown) {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Échec de la suppression',
        variant: 'destructive',
      });
    }
  };

  const handleBudgetChange = async (categoryId: number, amount: number) => {
    const key = `${categoryId}-${year}-${month}`;
    setBudgetSaving((s) => ({ ...s, [key]: true }));
    try {
      await financeAPI.putBudget([{ categoryId, year, month, amount }]);
      toast({ title: 'Budget enregistré' });
      loadBudget();
      loadDashboard();
    } catch (error: unknown) {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Échec de l\'enregistrement',
        variant: 'destructive',
      });
    } finally {
      setBudgetSaving((s) => ({ ...s, [key]: false }));
    }
  };

  const totalIn = transactions
    .filter((t) => t.type === 'revenus')
    .reduce((s, t) => s + t.amount, 0);
  const totalOut = transactions
    .filter((t) => t.type !== 'revenus')
    .reduce((s, t) => s + t.amount, 0);

  const monthLabel = format(new Date(year, month - 1), 'MMMM yyyy', { locale: fr });

  const exportToCsv = () => {
    const headers = ['Date', 'Type', 'Catégorie', 'Montant', 'Commentaire'];
    const rows = transactions.map((t) => [
      t.date,
      TYPE_LABELS[t.type],
      t.category?.name ?? '',
      String(t.amount),
      (t.comment ?? '').replace(/"/g, '""'),
    ]);
    const csvContent = [
      headers.join(';'),
      ...rows.map((r) => r.map((c) => `"${c}"`).join(';')),
    ].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${year}-${String(month).padStart(2, '0')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const monthOptions = (() => {
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
  })();

  const budgetByCategory = new Map<number, FinanceBudgetEntryDto>();
  for (const e of budgetEntries) {
    budgetByCategory.set(e.categoryId, e);
  }
  const categoriesForBudget = categories;

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
            <SelectContent position="popper" sideOffset={4}>
              {monthOptions}
            </SelectContent>
          </Select>
          <NewFinanceCategorySheet
            open={categorySheetOpen}
            onOpenChange={setCategorySheetOpen}
            typeLabels={TYPE_LABELS}
            onCreated={() => {
              loadData();
              loadBudget();
            }}
          />
          <NewFinanceTransactionSheet
            open={sheetOpen}
            onOpenChange={setSheetOpen}
            categories={categories}
            typeLabels={TYPE_LABELS}
            onCreated={() => {
              loadData();
              loadDashboard();
            }}
          />
          <NewFinanceTransactionSheet
            open={editSheetOpen}
            onOpenChange={(open) => {
              setEditSheetOpen(open);
              if (!open) setTransactionToEdit(null);
            }}
            transaction={transactionToEdit}
            categories={categories}
            typeLabels={TYPE_LABELS}
            onUpdated={() => {
              loadData();
              loadDashboard();
              setEditSheetOpen(false);
              setTransactionToEdit(null);
            }}
          />
        </div>
      </div>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="rounded-sm bg-muted/60">
          <TabsTrigger value="dashboard" className="rounded-sm gap-1.5">
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="transactions" className="rounded-sm gap-1.5">
            <List className="h-4 w-4" />
            Transactions
          </TabsTrigger>
          <TabsTrigger value="budget" className="rounded-sm gap-1.5">
            <PiggyBank className="h-4 w-4" />
            Budget
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-4 space-y-4">
          {dashboardLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : dashboard ? (
            <>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                <Card className="rounded-sm border shadow-none">
                  <CardHeader className="pb-1 pt-4 px-4">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Revenus (réel)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    <span className="text-xl font-semibold text-green-600">
                      {dashboard.totalRevenus.toLocaleString('fr-FR')} CFA
                    </span>
                  </CardContent>
                </Card>
                <Card className="rounded-sm border shadow-none">
                  <CardHeader className="pb-1 pt-4 px-4">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Dépenses (réel)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    <span className="text-xl font-semibold text-red-600">
                      {dashboard.totalDepenses.toLocaleString('fr-FR')} CFA
                    </span>
                  </CardContent>
                </Card>
                <Card className="rounded-sm border shadow-none">
                  <CardHeader className="pb-1 pt-4 px-4">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Solde (réel)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    <span
                      className={`text-xl font-semibold ${dashboard.solde >= 0 ? 'text-green-600' : 'text-red-600'}`}
                    >
                      {dashboard.solde.toLocaleString('fr-FR')} CFA
                    </span>
                  </CardContent>
                </Card>
                <Card className="rounded-sm border shadow-none">
                  <CardHeader className="pb-1 pt-4 px-4">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Budget prévu
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    <span className="text-xl font-semibold text-muted-foreground">
                      Revenus: {dashboard.budgetRevenus.toLocaleString('fr-FR')} · Dépenses:{' '}
                      {dashboard.budgetDepenses.toLocaleString('fr-FR')} CFA
                    </span>
                  </CardContent>
                </Card>
              </div>
              <FinanceMonthChart
                totalRevenus={dashboard.totalRevenus}
                totalDepenses={dashboard.totalDepenses}
                monthLabel={monthLabel}
              />
              {dashboard.realVsBudget.length > 0 && (
                <Card className="rounded-sm border shadow-none">
                  <CardHeader className="py-3 px-4 border-b">
                    <CardTitle className="text-base font-semibold">
                      Réel vs Budget — {monthLabel}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <RealVsBudgetDataTable data={dashboard.realVsBudget} />
                  </CardContent>
                </Card>
              )}
            </>
          ) : null}
        </TabsContent>

        <TabsContent value="transactions" className="mt-4 space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <Card className="rounded-sm border shadow-none">
              <CardHeader className="pb-1 pt-4 px-4">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Revenus (mois)
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <span className="text-xl font-semibold text-green-600">
                  {totalIn.toLocaleString('fr-FR')} CFA
                </span>
              </CardContent>
            </Card>
            <Card className="rounded-sm border shadow-none">
              <CardHeader className="pb-1 pt-4 px-4">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Dépenses (mois)
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <span className="text-xl font-semibold text-red-600">
                  {totalOut.toLocaleString('fr-FR')} CFA
                </span>
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-sm border shadow-none">
            <CardHeader className="py-3 px-4 border-b flex flex-row items-center justify-between gap-2">
              <CardTitle className="text-base font-semibold">
                Transactions — {monthLabel}
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                className="rounded-sm shrink-0"
                onClick={exportToCsv}
                disabled={transactions.length === 0}
              >
                <Download className="h-4 w-4 mr-1.5" />
                Exporter CSV
              </Button>
            </CardHeader>
            <CardContent className="p-4">
              {loading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <TransactionsDataTable
                  data={transactions}
                  typeLabels={TYPE_LABELS}
                  onDelete={handleDelete}
                  onEdit={(tx) => {
                    setTransactionToEdit(tx);
                    setEditSheetOpen(true);
                  }}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="budget" className="mt-4">
          {budgetLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Card className="rounded-sm border shadow-none">
              <CardHeader className="py-3 px-4 border-b">
                <CardTitle className="text-base font-semibold">
                  Budget par catégorie — {monthLabel}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {categoriesForBudget.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    Créez des catégories pour définir un budget.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {categoriesForBudget.map((cat) => {
                      const entry = budgetByCategory.get(cat.id);
                      const key = `${cat.id}-${year}-${month}`;
                      const saving = budgetSaving[key];
                      return (
                        <BudgetRow
                          key={cat.id}
                          category={cat}
                          entry={entry}
                          typeLabels={TYPE_LABELS}
                          onSave={(amount) => handleBudgetChange(cat.id, amount)}
                          saving={!!saving}
                        />
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function BudgetRow({
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
  const [dirtyValue, setDirtyValue] = useState<string | null>(null);
  const displayValue =
    dirtyValue !== null ? dirtyValue : String(entry?.amount ?? 0);

  const handleBlur = () => {
    if (dirtyValue === null) return;
    const num = parseFloat(dirtyValue.replace(/\s/g, '').replace(',', '.'));
    if (!Number.isNaN(num) && num >= 0) {
      onSave(num);
      setDirtyValue(null);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-sm border bg-muted/20 p-3">
      <div className="min-w-[140px]">
        <span className="font-medium">{category.name}</span>
        <span className="ml-1.5 text-xs text-muted-foreground">
          ({typeLabels[category.type as FinanceTransactionType]})
        </span>
      </div>
      <div className="flex flex-1 items-center gap-2">
        <Input
          type="text"
          inputMode="decimal"
          className="max-w-[140px] rounded-sm"
          value={displayValue}
          onChange={(e) => setDirtyValue(e.target.value)}
          onBlur={handleBlur}
          placeholder="0"
          disabled={saving}
        />
        <span className="text-sm text-muted-foreground">CFA</span>
        {saving && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      </div>
    </div>
  );
}

export default FinancePage;
