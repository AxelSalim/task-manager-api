'use client';

import { type ReactNode, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  financeAPI,
  type FinanceCategoryDto,
  type FinanceTransactionDto,
  type FinanceTransactionType,
} from '@/lib/api';
import { Plus, Loader2, Trash2 } from 'lucide-react';
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
  const [saving, setSaving] = useState(false);
  const [savingCategory, setSavingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState<FinanceTransactionType>('depenses');
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth() + 1);

  const [formDate, setFormDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [formType, setFormType] = useState<FinanceTransactionType>('depenses');
  const [formCategoryId, setFormCategoryId] = useState<string>('');
  const [formAmount, setFormAmount] = useState('');
  const [formComment, setFormComment] = useState('');
  const { toast } = useToast();

  const loadData = async () => {
    setLoading(true);
    try {
      const [txList, catList] = await Promise.all([
        financeAPI.getTransactions({ year, month }),
        financeAPI.getCategories(),
      ]);
      setTransactions(txList);
      setCategories(catList);
    } catch (e) {
      toast({
        title: 'Erreur',
        description: e instanceof Error ? e.message : 'Impossible de charger les données',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [year, month]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(formAmount.replace(',', '.'));
    if (isNaN(amount)) {
      toast({ title: 'Montant invalide', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      await financeAPI.createTransaction({
        date: formDate,
        type: formType,
        categoryId: formCategoryId ? parseInt(formCategoryId, 10) : null,
        amount,
        comment: formComment || null,
      });
      toast({ title: 'Transaction ajoutée' });
      setSheetOpen(false);
      resetForm();
      loadData();
    } catch (err) {
      toast({
        title: 'Erreur',
        description: err instanceof Error ? err.message : 'Échec de l\'enregistrement',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormDate(format(new Date(), 'yyyy-MM-dd'));
    setFormType('depenses');
    setFormCategoryId('');
    setFormAmount('');
    setFormComment('');
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newCatName.trim();
    if (!name) {
      toast({ title: 'Nom requis', variant: 'destructive' });
      return;
    }
    setSavingCategory(true);
    try {
      await financeAPI.createCategory({ name, type: newCatType });
      toast({ title: 'Catégorie créée' });
      setCategorySheetOpen(false);
      setNewCatName('');
      setNewCatType('depenses');
      loadData();
    } catch (err) {
      toast({
        title: 'Erreur',
        description: err instanceof Error ? err.message : 'Échec de l\'enregistrement',
        variant: 'destructive',
      });
    } finally {
      setSavingCategory(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer cette transaction ?')) return;
    try {
      await financeAPI.deleteTransaction(id);
      toast({ title: 'Transaction supprimée' });
      loadData();
    } catch (err) {
      toast({
        title: 'Erreur',
        description: err instanceof Error ? err.message : 'Échec de la suppression',
        variant: 'destructive',
      });
    }
  };

  const categoriesByType = categories.filter((c) => c.type === formType);
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
          <Sheet open={categorySheetOpen} onOpenChange={setCategorySheetOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="rounded-sm">
                Nouvelle catégorie
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="sm:max-w-sm rounded-none border-l">
              <form onSubmit={handleCreateCategory}>
                <SheetHeader>
                  <SheetTitle>Nouvelle catégorie</SheetTitle>
                </SheetHeader>
                <div className="grid gap-4 py-6">
                  <div className="grid gap-2">
                    <Label>Nom</Label>
                    <Input
                      className="rounded-sm"
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      placeholder="ex. Salaire net"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Type</Label>
                    <Select value={newCatType} onValueChange={(v) => setNewCatType(v as FinanceTransactionType)}>
                      <SelectTrigger className="rounded-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(TYPE_LABELS) as FinanceTransactionType[]).map((t) => (
                          <SelectItem key={t} value={t}>{TYPE_LABELS[t]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <SheetFooter className="gap-2 rounded-sm">
                  <Button type="button" variant="outline" className="rounded-sm" onClick={() => setCategorySheetOpen(false)}>Annuler</Button>
                  <Button type="submit" className="rounded-sm" disabled={savingCategory}>
                    {savingCategory ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Créer'}
                  </Button>
                </SheetFooter>
              </form>
            </SheetContent>
          </Sheet>
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button className="rounded-sm">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter une transaction
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="sm:max-w-md rounded-none border-l">
              <form onSubmit={handleSubmit}>
                <SheetHeader>
                  <SheetTitle>Nouvelle transaction</SheetTitle>
                </SheetHeader>
                <div className="grid gap-4 py-6">
                  <div className="grid gap-2">
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      className="rounded-sm"
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="type">Type</Label>
                    <Select value={formType} onValueChange={(v) => { setFormType(v as FinanceTransactionType); setFormCategoryId(''); }}>
                      <SelectTrigger id="type" className="rounded-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(TYPE_LABELS) as FinanceTransactionType[]).map((t) => (
                          <SelectItem key={t} value={t}>
                            {TYPE_LABELS[t]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="category">Catégorie (optionnel)</Label>
                    <Select value={formCategoryId || 'none'} onValueChange={(v) => setFormCategoryId(v === 'none' ? '' : v)}>
                      <SelectTrigger id="category" className="rounded-sm">
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
                    <Label htmlFor="amount">Montant (CFA)</Label>
                    <Input
                      id="amount"
                      type="text"
                      inputMode="decimal"
                      className="rounded-sm"
                      placeholder="0"
                      value={formAmount}
                      onChange={(e) => setFormAmount(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="comment">Commentaire</Label>
                    <Input
                      id="comment"
                      className="rounded-sm"
                      value={formComment}
                      onChange={(e) => setFormComment(e.target.value)}
                      placeholder="Optionnel"
                    />
                  </div>
                </div>
                <SheetFooter className="gap-2 rounded-sm">
                  <Button type="button" variant="outline" className="rounded-sm" onClick={() => setSheetOpen(false)}>
                    Annuler
                  </Button>
                  <Button type="submit" className="rounded-sm" disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enregistrer'}
                  </Button>
                </SheetFooter>
              </form>
            </SheetContent>
          </Sheet>
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
