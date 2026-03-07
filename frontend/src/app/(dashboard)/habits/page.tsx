'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Loader2 } from 'lucide-react';
import { addDays, startOfWeek, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { habitsAPI, type HabitDto } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

const DAY_LABELS: [string, string][] = [
  ['Lun', 'Lundi'],
  ['Mar', 'Mardi'],
  ['Mer', 'Mercredi'],
  ['Jeu', 'Jeudi'],
  ['Ven', 'Vendredi'],
  ['Sam', 'Samedi'],
  ['Dim', 'Dimanche'],
];

/** Génère les 7 jours de la semaine (lundi = début) */
function getWeekDays(reference: Date): Date[] {
  const start = startOfWeek(reference, { weekStartsOn: 1 });
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export default function HabitsPage() {
  const [habits, setHabits] = useState<HabitDto[]>([]);
  const [completions, setCompletions] = useState<Set<string>>(new Set());
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [loading, setLoading] = useState(true);
  const [completionPending, setCompletionPending] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [savingHabit, setSavingHabit] = useState(false);
  const { toast } = useToast();

  const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart]);
  const fromTo = useMemo(() => {
    const from = format(weekStart, 'yyyy-MM-dd');
    const to = format(addDays(weekStart, 6), 'yyyy-MM-dd');
    return { from, to };
  }, [weekStart]);

  const loadHabits = useCallback(async () => {
    try {
      const list = await habitsAPI.getAll();
      setHabits(list);
    } catch (error: unknown) {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Impossible de charger les habitudes',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const loadCompletions = useCallback(async () => {
    try {
      const list = await habitsAPI.getCompletions(fromTo);
      setCompletions(new Set(list.map((c) => `${c.habitId}_${c.date}`)));
    } catch (error: unknown) {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Impossible de charger les complétions',
        variant: 'destructive',
      });
    }
  }, [fromTo, toast]);

  useEffect(() => {
    setLoading(true);
    loadHabits().finally(() => setLoading(false));
  }, [loadHabits]);

  useEffect(() => {
    loadCompletions();
  }, [loadCompletions]);

  const toggleCompletion = async (habitId: number, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const key = `${habitId}_${dateStr}`;
    const nextCompleted = !completions.has(key);
    setCompletionPending(key);
    try {
      await habitsAPI.setCompletion(habitId, dateStr, nextCompleted);
      setCompletions((prev) => {
        const next = new Set(prev);
        if (nextCompleted) next.add(key);
        else next.delete(key);
        return next;
      });
    } catch (error: unknown) {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Impossible d\'enregistrer',
        variant: 'destructive',
      });
    } finally {
      setCompletionPending(null);
    }
  };

  const isCompleted = (habitId: number, date: Date) =>
    completions.has(`${habitId}_${format(date, 'yyyy-MM-dd')}`);

  const totalHabits = habits.length;
  const completedByDay = useMemo(() => {
    return weekDays.map((day) =>
      habits.filter((h) => isCompleted(h.id, day)).length
    );
  }, [habits, weekDays, completions]);
  const percentByDay = totalHabits
    ? completedByDay.map((n) => Math.round((n / totalHabits) * 100))
    : weekDays.map(() => 0);
  const totalCompleted = useMemo(
    () => weekDays.reduce((sum, day) => sum + habits.filter((h) => isCompleted(h.id, day)).length, 0),
    [habits, weekDays, completions]
  );

  const goPrevWeek = () => setWeekStart((d) => addDays(d, -7));
  const goNextWeek = () => setWeekStart((d) => addDays(d, 7));
  const goToday = () => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));

  const weekLabel = useMemo(() => {
    const end = addDays(weekStart, 6);
    return `${format(weekStart, 'd MMM', { locale: fr })} – ${format(end, 'd MMM yyyy', { locale: fr })}`;
  }, [weekStart]);

  const handleCreateHabit = async () => {
    const name = newHabitName.trim();
    if (!name) return;
    setSavingHabit(true);
    try {
      await habitsAPI.create({ name });
      toast({ title: 'Habitude créée' });
      setNewHabitName('');
      setDialogOpen(false);
      loadHabits();
    } catch (error: unknown) {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Impossible de créer l\'habitude',
        variant: 'destructive',
      });
    } finally {
      setSavingHabit(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-xl font-semibold">Mes Habits</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="rounded-sm" onClick={goPrevWeek}>
            Semaine précédente
          </Button>
          <Button variant="outline" size="sm" className="rounded-sm" onClick={goToday}>
            Cette semaine
          </Button>
          <Button variant="outline" size="sm" className="rounded-sm" onClick={goNextWeek}>
            Semaine suivante
          </Button>
          <Button className="rounded-sm" size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle habitude
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-sm border shadow-none">
          <CardHeader className="pb-1 pt-2 px-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Nombre d&apos;habitudes
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4">
            <span className="text-xl font-semibold">{totalHabits}</span>
          </CardContent>
        </Card>
        <Card className="rounded-sm border shadow-none">
          <CardHeader className="pb-1 pt-2 px-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Complétées (cette semaine)
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4">
            <span className="text-xl font-semibold">{totalCompleted}</span>
          </CardContent>
        </Card>
        <Card className="rounded-sm border shadow-none">
          <CardHeader className="pb-1 pt-2 px-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Progression
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4">
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{
                    width: totalHabits
                      ? `${Math.min(100, (totalCompleted / (totalHabits * 7)) * 100)}%`
                      : '0%',
                  }}
                />
              </div>
              <span className="text-sm font-medium tabular-nums">
                {totalHabits
                  ? `${Math.min(100, Math.round((totalCompleted / (totalHabits * 7)) * 100))}%`
                  : '0%'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-sm border shadow-none">
        <CardHeader className="px-4 border-b flex flex-row items-center justify-between gap-2">
          <CardTitle className="text-base font-semibold">Semaine — {weekLabel}</CardTitle>
        </CardHeader>
        <CardContent className="p-4 overflow-x-auto">
          <div className="min-w-[400px]">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-4 font-medium text-muted-foreground w-[200px]">
                    Habitude
                  </th>
                  {weekDays.map((day) => (
                    <th
                      key={day.toISOString()}
                      className="text-center py-2 px-1 font-medium text-muted-foreground"
                    >
                      <div>{DAY_LABELS[day.getDay() === 0 ? 6 : day.getDay() - 1]?.[0]}</div>
                      <div className="text-xs font-normal">{format(day, 'd')}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {habits.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="py-12 text-center text-muted-foreground text-sm"
                    >
                      Aucune habitude. Ajoutez une habitude pour commencer.
                    </td>
                  </tr>
                ) : (
                  habits.map((habit) => (
                    <tr key={habit.id} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-medium">{habit.name}</td>
                      {weekDays.map((day) => {
                        const key = `${habit.id}_${format(day, 'yyyy-MM-dd')}`;
                        const pending = completionPending === key;
                        return (
                          <td key={day.toISOString()} className="py-1 px-1 text-center">
                            <div className="flex justify-center">
                              {pending ? (
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                              ) : (
                                <Checkbox
                                  checked={isCompleted(habit.id, day)}
                                  onCheckedChange={() => toggleCompletion(habit.id, day)}
                                  aria-label={`${habit.name} – ${format(day, 'd MMM', { locale: fr })}`}
                                />
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
              {habits.length > 0 && (
                <tfoot>
                  <tr className="border-t bg-muted/30">
                    <td className="py-2 pr-4 text-sm text-muted-foreground">% du jour</td>
                    {percentByDay.map((p, i) => (
                      <td key={i} className="py-1 px-1 text-center text-sm text-muted-foreground">
                        {p}%
                      </td>
                    ))}
                  </tr>
                  <tr className="bg-muted/30">
                    <td className="py-1 pr-4 text-sm text-muted-foreground">Complétées</td>
                    {completedByDay.map((n, i) => (
                      <td key={i} className="py-1 px-1 text-center text-sm text-muted-foreground">
                        {n}
                      </td>
                    ))}
                  </tr>
                  <tr className="bg-muted/30">
                    <td className="py-1 pr-4 text-sm text-muted-foreground">Total</td>
                    {weekDays.map((_, i) => (
                      <td key={i} className="py-1 px-1 text-center text-sm text-muted-foreground">
                        {totalHabits}
                      </td>
                    ))}
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-sm">
          <DialogHeader>
            <DialogTitle>Nouvelle habitude</DialogTitle>
            <DialogDescription>
              Donnez un nom à l&apos;habitude que vous souhaitez suivre.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="habit-name">Nom</Label>
              <Input
                id="habit-name"
                className="rounded-sm"
                value={newHabitName}
                onChange={(e) => setNewHabitName(e.target.value)}
                placeholder="Ex. 10 min de lecture"
                onKeyDown={(e) => e.key === 'Enter' && handleCreateHabit()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="rounded-sm">
              Annuler
            </Button>
            <Button
              className="rounded-sm"
              onClick={handleCreateHabit}
              disabled={!newHabitName.trim() || savingHabit}
            >
              {savingHabit ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
