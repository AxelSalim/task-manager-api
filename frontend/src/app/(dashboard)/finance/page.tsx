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
import { NewFinanceCategorySheet } from '@/components/finance/NewFinanceCategorySheet';
import { NewFinanceTransactionSheet } from '@/components/finance/NewFinanceTransactionSheet';
import { FinanceByTypeChart } from '@/components/finance/FinanceByTypeChart';
import { FinanceDailyChart } from '@/components/finance/FinanceDailyChart';
import { FinanceDailyCumulativeChart } from '@/components/finance/FinanceDailyCumulativeChart';
import { FinanceEvolutionLineChart } from '@/components/finance/FinanceEvolutionLineChart';
import { FinanceMonthChart } from '@/components/finance/FinanceMonthChart';
import { FinanceTypePieChart } from '@/components/finance/FinanceTypePieChart';
import { BudgetTable } from '@/components/finance/BudgetTable';
import { RealVsBudgetDataTable } from '@/components/finance/RealVsBudgetDataTable';
import { TransactionsDataTable } from '@/components/finance/TransactionsDataTable';
import {
  financeAPI,
  type FinanceBudgetEntryDto,
  type FinanceCategoryDto,
  type FinanceDashboardDto,
  type FinanceDashboardYearDto,
  type FinanceEvolutionMonthDto,
  type FinanceTransactionDto,
  type FinanceTransactionType,
} from '@/lib/api';
import { Download, Loader2, LayoutDashboard, List, PiggyBank, Plus } from 'lucide-react';
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

const DEFAULT_DASHBOARD: FinanceDashboardDto = {
  year: 0,
  month: 0,
  totalsByType: { revenus: 0, factures: 0, depenses: 0, epargnes: 0, credits: 0 },
  budgetByType: { revenus: 0, factures: 0, depenses: 0, epargnes: 0, credits: 0 },
  totalRevenus: 0,
  totalDepenses: 0,
  solde: 0,
  budgetRevenus: 0,
  budgetDepenses: 0,
  budgetSolde: 0,
  realVsBudget: [],
  daily: [],
};

function FinancePage() {
  const [transactions, setTransactions] = useState<FinanceTransactionDto[]>([]);
  const [categories, setCategories] = useState<FinanceCategoryDto[]>([]);
  const [budgetEntries, setBudgetEntries] = useState<FinanceBudgetEntryDto[]>([]);
  const [dashboard, setDashboard] = useState<FinanceDashboardDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [evolutionData, setEvolutionData] = useState<FinanceEvolutionMonthDto[]>([]);
  const [evolutionLoading, setEvolutionLoading] = useState(false);
  const [budgetLoading, setBudgetLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<FinanceTransactionDto | null>(null);
  const [categorySheetOpen, setCategorySheetOpen] = useState(false);
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth() + 1);
  const [transactionFilterType, setTransactionFilterType] = useState<'' | FinanceTransactionType>('');
  const [transactionFilterCategoryId, setTransactionFilterCategoryId] = useState<number | null>(null);
  const [transactionFilterDateFrom, setTransactionFilterDateFrom] = useState<string>('');
  const [transactionFilterDateTo, setTransactionFilterDateTo] = useState<string>('');
  const [yearSummary, setYearSummary] = useState<FinanceDashboardYearDto | null>(null);
  const [budgetFilterType, setBudgetFilterType] = useState<'' | FinanceTransactionType>('');
  const [budgetFilterCategoryId, setBudgetFilterCategoryId] = useState<number | null>(null);
  const [budgetSaving, setBudgetSaving] = useState<Record<string, boolean>>({});

  const { toast } = useToast();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [txList, catList] = await Promise.all([
        financeAPI.getTransactions({
          year,
          month,
          type: transactionFilterType || undefined,
          categoryId: transactionFilterCategoryId ?? undefined,
        }),
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
  }, [
    month,
    toast,
    year,
    transactionFilterType,
    transactionFilterCategoryId,
    transactionFilterDateFrom,
    transactionFilterDateTo,
  ]);

  const loadDashboard = useCallback(async () => {
    try {
      const data = await financeAPI.getDashboard({ year, month });
      setDashboard(data);
    } catch (error: unknown) {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Impossible de charger le dashboard',
        variant: 'destructive',
      });
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

  const loadEvolution = useCallback(async () => {
    setEvolutionLoading(true);
    try {
      const data = await financeAPI.getDashboardEvolution({
        count: 6,
        year,
        month,
      });
      setEvolutionData(data);
    } catch (error: unknown) {
      toast({
        title: 'Erreur',
        description:
          error instanceof Error ? error.message : 'Impossible de charger l\'évolution',
        variant: 'destructive',
      });
    } finally {
      setEvolutionLoading(false);
    }
  }, [month, toast, year]);

  const loadYearSummary = useCallback(async () => {
    try {
      const data = await financeAPI.getDashboardYear({ year });
      setYearSummary(data);
    } catch (error: unknown) {
      toast({
        title: 'Erreur',
        description:
          error instanceof Error ? error.message : 'Impossible de charger le résumé annuel',
        variant: 'destructive',
      });
      setYearSummary(null);
    }
  }, [toast, year]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    loadBudget();
  }, [loadBudget]);

  useEffect(() => {
    loadEvolution();
  }, [loadEvolution]);

  useEffect(() => {
    loadYearSummary();
  }, [loadYearSummary]);

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer cette transaction ?')) return;
    try {
      await financeAPI.deleteTransaction(id);
      toast({ title: 'Transaction supprimée' });
      loadData();
      loadDashboard();
      loadYearSummary();
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

  const monthLabel = format(new Date(year, month - 1), 'MMMM yyyy', { locale: fr });
  const lastDayOfMonth = new Date(year, month, 0).getDate();
  const periodLabel = `1er au ${lastDayOfMonth} ${format(new Date(year, month - 1), 'MMMM yyyy', { locale: fr })}`;

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
            <SelectTrigger className="w-[200px] rounded-sm bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper" sideOffset={4}>
              {monthOptions}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            className="rounded-sm"
            onClick={() => setCategorySheetOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle catégorie
          </Button>
          <NewFinanceCategorySheet
            open={categorySheetOpen}
            onOpenChange={setCategorySheetOpen}
            typeLabels={TYPE_LABELS}
            onCreated={() => {
              loadData();
              loadBudget();
            }}
          />
          <Button
            variant="outline"
            className="rounded-sm"
            onClick={() => setSheetOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Ajouter une transaction
          </Button>
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
              loadYearSummary();
              setEditSheetOpen(false);
              setTransactionToEdit(null);
            }}
          />
        </div>
      </div>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="rounded-sm bg-muted/100">
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
          {(() => {
            const displayDashboard = dashboard ?? DEFAULT_DASHBOARD;
            const effectiveDaily =
              displayDashboard.daily.length > 0
                ? displayDashboard.daily
                : Array.from({ length: lastDayOfMonth }, (_, i) => ({
                    date: `${year}-${String(month).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`,
                    day: i + 1,
                    totalRevenus: 0,
                    totalDepenses: 0,
                    solde: 0,
                  }));
            return (
              <>
                {/* Mois sélectionné : réel puis budget */}
                <div className="grid gap-1 md:grid-cols-2 lg:grid-cols-5">
                  <Card className="rounded-sm border shadow-none">
                    <CardHeader className="px-4">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Revenus réels
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4">
                      <span className="text-xl font-semibold text-green-600">
                        {displayDashboard.totalRevenus.toLocaleString('fr-FR')} CFA
                      </span>
                    </CardContent>
                  </Card>
                  <Card className="rounded-sm border shadow-none">
                    <CardHeader className="px-4">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Dépenses réelles
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4">
                      <span className="text-xl font-semibold text-red-600">
                        {displayDashboard.totalDepenses.toLocaleString('fr-FR')} CFA
                      </span>
                    </CardContent>
                  </Card>
                  <Card className="rounded-sm border shadow-none">
                    <CardHeader className="px-4">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Solde réel
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4">
                      <span
                        className={`text-xl font-semibold ${displayDashboard.solde >= 0 ? 'text-green-600' : 'text-red-600'}`}
                      >
                        {displayDashboard.solde.toLocaleString('fr-FR')} CFA
                      </span>
                    </CardContent>
                  </Card>
                  <Card className="rounded-sm border shadow-none">
                    <CardHeader className="px-4">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Budget prévu Revenus
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4">
                      <span className="text-xl font-semibold text-muted-foreground">
                        {displayDashboard.budgetRevenus.toLocaleString('fr-FR')} CFA
                      </span>
                    </CardContent>
                  </Card>
                  <Card className="rounded-sm border shadow-none">
                    <CardHeader className="px-4">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Budget prévu Dépenses
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4">
                      <span className="text-xl font-semibold text-muted-foreground">
                        {displayDashboard.budgetDepenses.toLocaleString('fr-FR')} CFA
                      </span>
                    </CardContent>
                  </Card>
                </div>
                {/* Année : cumul */}
                <div className="grid gap-1 md:grid-cols-3">
                  <Card className="rounded-sm border shadow-none">
                    <CardHeader className="px-4">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Revenus de l&apos;année {year}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4">
                      <span className="text-xl font-semibold text-green-600">
                        {(yearSummary?.totalRevenus ?? 0).toLocaleString('fr-FR')} CFA
                      </span>
                    </CardContent>
                  </Card>
                  <Card className="rounded-sm border shadow-none">
                    <CardHeader className="px-4">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Dépenses de l&apos;année {year}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4">
                      <span className="text-xl font-semibold text-red-600">
                        {(yearSummary?.totalDepenses ?? 0).toLocaleString('fr-FR')} CFA
                      </span>
                    </CardContent>
                  </Card>
                  <Card className="rounded-sm border shadow-none">
                    <CardHeader className="px-4">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Solde de l&apos;année {year}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4">
                      <span
                        className={`text-xl font-semibold ${(yearSummary?.solde ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}
                      >
                        {(yearSummary?.solde ?? 0).toLocaleString('fr-FR')} CFA
                      </span>
                    </CardContent>
                  </Card>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <FinanceMonthChart
                    totalRevenus={displayDashboard.totalRevenus}
                    totalDepenses={displayDashboard.totalDepenses}
                    monthLabel={monthLabel}
                  />
                  <FinanceByTypeChart
                    totalsByType={displayDashboard.totalsByType}
                    monthLabel={monthLabel}
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <FinanceDailyChart
                    daily={effectiveDaily}
                    monthLabel={monthLabel}
                  />
                  <FinanceDailyCumulativeChart
                    daily={effectiveDaily}
                    monthLabel={monthLabel}
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {evolutionLoading ? (
                    <Card className="rounded-sm border shadow-none flex items-center justify-center min-h-[280px]">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </Card>
                  ) : (
                    <div className="space-y-1">
                      <FinanceEvolutionLineChart data={evolutionData} />
                    </div>
                  )}
                  <FinanceTypePieChart
                    totalsByType={displayDashboard.totalsByType}
                    monthLabel={monthLabel}
                  />
                </div>
                {displayDashboard.realVsBudget.length > 0 && (
                  <Card className="rounded-sm border shadow-none">
                    <CardHeader className="py-3 px-4 border-b">
                      <CardTitle className="text-base font-semibold">
                        Réel vs Budget
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      <RealVsBudgetDataTable data={displayDashboard.realVsBudget} />
                    </CardContent>
                  </Card>
                )}
              </>
            );
          })()}
        </TabsContent>

        <TabsContent value="transactions" className="mt-4 space-y-4">
          <Card className="rounded-sm border shadow-none">
            <CardHeader className="px-4 border-b flex flex-row items-center justify-between gap-2">
              <CardTitle className="text-base font-semibold">
                Liste des transactions
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
              <TransactionsDataTable
                key={`${transactionFilterType}-${transactionFilterCategoryId}-${transactionFilterDateFrom}-${transactionFilterDateTo}`}
                data={transactions}
                loading={loading}
                typeLabels={TYPE_LABELS}
                categories={categories}
                filterType={transactionFilterType}
                filterCategoryId={transactionFilterCategoryId}
                filterDateFrom={transactionFilterDateFrom}
                filterDateTo={transactionFilterDateTo}
                onFilterChange={({ type, categoryId, dateFrom, dateTo }) => {
                  if (type !== undefined) setTransactionFilterType(type);
                  if (categoryId !== undefined) setTransactionFilterCategoryId(categoryId);
                  if (dateFrom !== undefined) setTransactionFilterDateFrom(dateFrom);
                  if (dateTo !== undefined) setTransactionFilterDateTo(dateTo);
                }}
                onDelete={handleDelete}
                onEdit={(tx) => {
                  setTransactionToEdit(tx);
                  setEditSheetOpen(true);
                }}
              />
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
              <CardHeader className="px-4 border-b flex flex-row items-center justify-between gap-2">
                <CardTitle className="text-base font-semibold">
                  Budget prévu
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {categoriesForBudget.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-8">
                    Créez des catégories pour définir un budget.
                  </p>
                ) : (
                  <BudgetTable
                    key={`${budgetFilterType}-${budgetFilterCategoryId}`}
                    categories={categoriesForBudget}
                    budgetByCategory={budgetByCategory}
                    typeLabels={TYPE_LABELS}
                    filterType={budgetFilterType}
                    filterCategoryId={budgetFilterCategoryId}
                    onFilterChange={({ type, categoryId }) => {
                      if (type !== undefined) setBudgetFilterType(type);
                      if (categoryId !== undefined) setBudgetFilterCategoryId(categoryId);
                    }}
                    onSave={handleBudgetChange}
                    getSaving={(categoryId) =>
                      !!budgetSaving[`${categoryId}-${year}-${month}`]
                    }
                  />
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default FinancePage;
