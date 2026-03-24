'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  financeAPI,
  type FinanceCategoryDto,
  type FinanceCategoryRuleDto,
  type FinanceSavingsGoalDto,
  type FinanceSubscriptionDto,
  type FinanceTransactionType,
} from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { FileText, Loader2, PiggyBank, Repeat, Trash2, Wand2 } from 'lucide-react';

const TYPE_LABELS: Record<FinanceTransactionType, string> = {
  revenus: 'Revenus',
  factures: 'Factures',
  depenses: 'Dépenses',
  epargnes: 'Épargnes',
  credits: 'Crédits',
};

type Props = {
  categories: FinanceCategoryDto[];
  year: number;
  month: number;
  onDataChange: () => void;
};

export function FinanceAdvancedTabs({ categories, year, month, onDataChange }: Props) {
  const { toast } = useToast();
  const [subs, setSubs] = useState<FinanceSubscriptionDto[]>([]);
  const [goals, setGoals] = useState<FinanceSavingsGoalDto[]>([]);
  const [rules, setRules] = useState<FinanceCategoryRuleDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [summaryText, setSummaryText] = useState('');
  const [subName, setSubName] = useState('');
  const [subAmount, setSubAmount] = useState('');
  const [subDay, setSubDay] = useState('1');
  const [subRemind, setSubRemind] = useState('3');
  const [goalName, setGoalName] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [ruleMatch, setRuleMatch] = useState('');
  const [ruleCatId, setRuleCatId] = useState<string>('');
  const [contribByGoal, setContribByGoal] = useState<Record<number, { amount: string; date: string }>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, g, r] = await Promise.all([
        financeAPI.getSubscriptions(),
        financeAPI.getSavingsGoals(),
        financeAPI.getCategoryRules(),
      ]);
      setSubs(s);
      setGoals(g);
      setRules(r);
    } catch (e: unknown) {
      toast({
        title: 'Erreur',
        description: e instanceof Error ? e.message : 'Chargement',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const loadSummary = useCallback(async () => {
    try {
      const { text } = await financeAPI.getMonthlyReportSummary({ year, month });
      setSummaryText(text);
    } catch (e: unknown) {
      toast({
        title: 'Erreur',
        description: e instanceof Error ? e.message : 'Résumé',
        variant: 'destructive',
      });
    }
  }, [year, month, toast]);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  const refresh = () => {
    load();
    onDataChange();
  };

  const addSubscription = async () => {
    const amount = parseFloat(subAmount.replace(',', '.'));
    const day = parseInt(subDay, 10);
    if (!subName.trim() || Number.isNaN(amount) || day < 1 || day > 31) {
      toast({ title: 'Vérifiez nom, montant et jour (1–31)', variant: 'destructive' });
      return;
    }
    try {
      await financeAPI.createSubscription({
        name: subName.trim(),
        amount,
        billingDay: day,
        reminderDaysBefore: parseInt(subRemind, 10) || 3,
      });
      toast({ title: 'Abonnement ajouté' });
      setSubName('');
      setSubAmount('');
      refresh();
    } catch (e: unknown) {
      toast({
        title: 'Erreur',
        description: e instanceof Error ? e.message : '',
        variant: 'destructive',
      });
    }
  };

  const addGoal = async () => {
    const t = parseFloat(goalTarget.replace(',', '.'));
    if (!goalName.trim() || Number.isNaN(t) || t <= 0) {
      toast({ title: 'Nom et objectif requis', variant: 'destructive' });
      return;
    }
    try {
      await financeAPI.createSavingsGoal({ name: goalName.trim(), targetAmount: t });
      toast({ title: 'Objectif créé' });
      setGoalName('');
      setGoalTarget('');
      refresh();
    } catch (e: unknown) {
      toast({
        title: 'Erreur',
        description: e instanceof Error ? e.message : '',
        variant: 'destructive',
      });
    }
  };

  const addRule = async () => {
    if (!ruleMatch.trim() || !ruleCatId) {
      toast({ title: 'Texte et catégorie requis', variant: 'destructive' });
      return;
    }
    try {
      await financeAPI.createCategoryRule({
        matchSubstring: ruleMatch.trim(),
        categoryId: Number(ruleCatId),
      });
      toast({ title: 'Règle ajoutée' });
      setRuleMatch('');
      refresh();
    } catch (e: unknown) {
      toast({
        title: 'Erreur',
        description: e instanceof Error ? e.message : '',
        variant: 'destructive',
      });
    }
  };

  const printReport = () => {
    const w = window.open('', '_blank');
    if (!w) return;
    const esc = (s: string) =>
      s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Rapport</title>
      <style>body{font-family:sans-serif;padding:24px;max-width:720px}</style></head><body>
      <pre style="white-space:pre-wrap">${esc(summaryText)}</pre>
      <script>window.onload=function(){window.print()}</script>
      </body></html>`;
    w.document.write(html);
    w.document.close();
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Tabs defaultValue="subscriptions" className="w-full">
      <TabsList className="flex flex-wrap h-auto gap-1 rounded-sm bg-muted p-1">
        <TabsTrigger value="subscriptions" className="rounded-sm gap-1.5 text-xs sm:text-sm">
          <Repeat className="h-4 w-4 shrink-0" />
          Abonnements
        </TabsTrigger>
        <TabsTrigger value="savings" className="rounded-sm gap-1.5 text-xs sm:text-sm">
          <PiggyBank className="h-4 w-4 shrink-0" />
          Épargne
        </TabsTrigger>
        <TabsTrigger value="rules" className="rounded-sm gap-1.5 text-xs sm:text-sm">
          <Wand2 className="h-4 w-4 shrink-0" />
          Règles
        </TabsTrigger>
        <TabsTrigger value="reports" className="rounded-sm gap-1.5 text-xs sm:text-sm">
          <FileText className="h-4 w-4 shrink-0" />
          Rapports
        </TabsTrigger>
      </TabsList>

      <TabsContent value="subscriptions" className="mt-4 space-y-4">
        <Card className="rounded-sm border shadow-none">
          <CardHeader className="px-4 py-3 border-b">
            <CardTitle className="text-base">Nouvel abonnement</CardTitle>
          </CardHeader>
          <CardContent className="p-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="grid gap-2">
              <Label>Nom</Label>
              <Input className="rounded-sm" value={subName} onChange={(e) => setSubName(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Montant (CFA)</Label>
              <Input className="rounded-sm" value={subAmount} onChange={(e) => setSubAmount(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Jour du mois</Label>
              <Input
                className="rounded-sm"
                type="number"
                min={1}
                max={31}
                value={subDay}
                onChange={(e) => setSubDay(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Alerte (jours avant)</Label>
              <Input
                className="rounded-sm"
                type="number"
                min={0}
                value={subRemind}
                onChange={(e) => setSubRemind(e.target.value)}
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-4">
              <Button type="button" className="rounded-sm" onClick={addSubscription}>
                Ajouter
              </Button>
            </div>
          </CardContent>
        </Card>
        <div className="rounded-sm border divide-y">
          {subs.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground text-center">Aucun abonnement.</p>
          ) : (
            subs.map((s) => (
              <div key={s.id} className="flex flex-wrap items-center justify-between gap-2 p-4">
                <div>
                  <p className="font-medium">{s.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {s.amount.toLocaleString('fr-FR')} CFA — jour {s.billingDay} — prochain :{' '}
                    {s.nextDueDate} ({s.daysUntil} j.)
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive rounded-sm"
                  onClick={async () => {
                    if (!confirm('Supprimer cet abonnement ?')) return;
                    await financeAPI.deleteSubscription(s.id);
                    refresh();
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </TabsContent>

      <TabsContent value="savings" className="mt-4 space-y-4">
        <Card className="rounded-sm border shadow-none">
          <CardHeader className="px-4 py-3 border-b">
            <CardTitle className="text-base">Nouvel objectif</CardTitle>
          </CardHeader>
          <CardContent className="p-4 flex flex-wrap gap-3 items-end">
            <div className="grid gap-2 flex-1 min-w-[160px]">
              <Label>Nom</Label>
              <Input className="rounded-sm" value={goalName} onChange={(e) => setGoalName(e.target.value)} />
            </div>
            <div className="grid gap-2 w-40">
              <Label>Objectif (CFA)</Label>
              <Input className="rounded-sm" value={goalTarget} onChange={(e) => setGoalTarget(e.target.value)} />
            </div>
            <Button type="button" className="rounded-sm" onClick={addGoal}>
              Créer
            </Button>
          </CardContent>
        </Card>
        {goals.map((g) => (
          <Card key={g.id} className="rounded-sm border shadow-none">
            <CardHeader className="px-4 py-3 border-b flex flex-row items-center justify-between gap-2">
              <CardTitle className="text-base">{g.name}</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive rounded-sm"
                onClick={async () => {
                  if (!confirm('Supprimer cet objectif et ses versements ?')) return;
                  await financeAPI.deleteSavingsGoal(g.id);
                  refresh();
                }}
              >
                Supprimer
              </Button>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span>
                  {g.savedAmount.toLocaleString('fr-FR')} / {g.targetAmount.toLocaleString('fr-FR')} CFA
                </span>
                <span className="font-medium">{g.progressPercent} %</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary transition-all rounded-full"
                  style={{ width: `${g.progressPercent}%` }}
                />
              </div>
              <div className="flex flex-wrap gap-2 items-end">
                <div className="grid gap-1">
                  <Label className="text-xs">Versement (CFA)</Label>
                  <Input
                    className="rounded-sm w-32 h-9"
                    value={contribByGoal[g.id]?.amount ?? ''}
                    onChange={(e) =>
                      setContribByGoal((prev) => ({
                        ...prev,
                        [g.id]: { amount: e.target.value, date: prev[g.id]?.date ?? new Date().toISOString().slice(0, 10) },
                      }))
                    }
                  />
                </div>
                <div className="grid gap-1">
                  <Label className="text-xs">Date</Label>
                  <Input
                    type="date"
                    className="rounded-sm w-40 h-9"
                    value={contribByGoal[g.id]?.date ?? new Date().toISOString().slice(0, 10)}
                    onChange={(e) =>
                      setContribByGoal((prev) => ({
                        ...prev,
                        [g.id]: { amount: prev[g.id]?.amount ?? '', date: e.target.value },
                      }))
                    }
                  />
                </div>
                <Button
                  type="button"
                  size="sm"
                  className="rounded-sm"
                  onClick={async () => {
                    const raw = contribByGoal[g.id]?.amount ?? '';
                    const amt = parseFloat(raw.replace(',', '.'));
                    if (Number.isNaN(amt) || amt <= 0) return;
                    const d = contribByGoal[g.id]?.date ?? new Date().toISOString().slice(0, 10);
                    await financeAPI.addSavingsContribution(g.id, { amount: amt, date: d });
                    toast({ title: 'Versement enregistré' });
                    setContribByGoal((prev) => ({ ...prev, [g.id]: { amount: '', date: d } }));
                    refresh();
                  }}
                >
                  Ajouter versement
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </TabsContent>

      <TabsContent value="rules" className="mt-4 space-y-4">
        <Card className="rounded-sm border shadow-none">
          <CardHeader className="px-4 py-3 border-b">
            <CardTitle className="text-base">Si le libellé contient…</CardTitle>
            <p className="text-sm text-muted-foreground font-normal">
              Appliqué aux nouvelles transactions sans catégorie (correspondance insensible à la casse).
            </p>
          </CardHeader>
          <CardContent className="p-4 flex flex-wrap gap-3 items-end">
            <div className="grid gap-2 flex-1 min-w-[200px]">
              <Label>Texte à détecter</Label>
              <Input
                className="rounded-sm"
                placeholder="ex. Netflix"
                value={ruleMatch}
                onChange={(e) => setRuleMatch(e.target.value)}
              />
            </div>
            <div className="grid gap-2 min-w-[200px]">
              <Label>Catégorie</Label>
              <Select value={ruleCatId} onValueChange={setRuleCatId}>
                <SelectTrigger className="rounded-sm">
                  <SelectValue placeholder="Choisir" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name} ({TYPE_LABELS[c.type]})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="button" className="rounded-sm" onClick={addRule}>
              Ajouter la règle
            </Button>
          </CardContent>
        </Card>
        <div className="rounded-sm border divide-y">
          {rules.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground text-center">Aucune règle.</p>
          ) : (
            rules.map((r) => (
              <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 p-4">
                <div>
                  <p className="font-medium">
                    « {r.matchSubstring} » → {r.category?.name ?? r.categoryId}
                  </p>
                  <p className="text-xs text-muted-foreground">Priorité {r.priority}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive rounded-sm"
                  onClick={async () => {
                    await financeAPI.deleteCategoryRule(r.id);
                    refresh();
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </TabsContent>

      <TabsContent value="reports" className="mt-4 space-y-4">
        <Card className="rounded-sm border shadow-none">
          <CardHeader className="px-4 py-3 border-b flex flex-row flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-base">Résumé du mois sélectionné (en-tête)</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" className="rounded-sm" onClick={() => loadSummary()}>
                Actualiser
              </Button>
              <Button variant="outline" size="sm" className="rounded-sm" onClick={printReport}>
                Imprimer / PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-sm"
                onClick={() => {
                  void navigator.clipboard.writeText(summaryText);
                  toast({ title: 'Copié dans le presse-papiers' });
                }}
              >
                Copier (email)
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <pre className="text-sm whitespace-pre-wrap font-sans bg-muted/30 rounded-sm p-4 border">
              {summaryText || 'Chargement…'}
            </pre>
            <p className="text-xs text-muted-foreground mt-2">
              Pour un vrai envoi e-mail, collez le texte dans votre messagerie ou utilisez l’export JSON
              depuis le profil.
            </p>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
