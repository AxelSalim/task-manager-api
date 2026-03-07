'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Loader2, SquarePen, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { addDays, startOfWeek, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { habitsAPI, type HabitDto } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { CreateHabitSheet } from '@/components/habits/CreateHabitSheet';
import { EditHabitSheet } from '@/components/habits/EditHabitSheet';
import { DeleteHabitDialog } from '@/components/habits/DeleteHabitDialog';

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
  const [createSheetOpen, setCreateSheetOpen] = useState(false);
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<HabitDto | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [habitToDelete, setHabitToDelete] = useState<HabitDto | null>(null);
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
      return true;
    } catch (error: unknown) {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Impossible de charger les habitudes',
        variant: 'destructive',
      });
      return false;
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
    let cancelled = false;
    setLoading(true);
    (async () => {
      const ok = await loadHabits();
      if (cancelled) return;
      setLoading(false);
      if (ok) loadCompletions();
    })();
    return () => {
      cancelled = true;
    };
  }, [loadHabits]);

  useEffect(() => {
    if (habits.length === 0 && !loading) return;
    loadCompletions();
  }, [fromTo]);

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

  const openCreateSheet = () => setCreateSheetOpen(true);

  const openEditSheet = (habit: HabitDto) => {
    setEditingHabit(habit);
    setEditSheetOpen(true);
  };

  const openDeleteDialog = (habit: HabitDto) => {
    setHabitToDelete(habit);
    setDeleteDialogOpen(true);
  };

  const handleHabitDeleted = useCallback(() => {
    loadHabits();
    loadCompletions();
  }, [loadHabits, loadCompletions]);

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
        <h1 className="text-xl font-semibold">Mes habitudes</h1>
        <div className="flex items-center gap-2">
          <Button className="rounded-sm" size="sm" onClick={openCreateSheet}>
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
        <CardHeader className="px-4 py-3 border-b">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base font-semibold truncate min-w-0">
              Semaine — {weekLabel}
            </CardTitle>
            <div className="flex items-center gap-1 shrink-0">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-sm"
                onClick={goPrevWeek}
                aria-label="Semaine précédente"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 rounded-sm px-3 font-medium"
                onClick={goToday}
              >
                Cette semaine
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-sm"
                onClick={goNextWeek}
                aria-label="Semaine suivante"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
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
                      <td className="py-2 pr-4">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium">{habit.name}</span>
                          <div className="flex items-center gap-0.5 shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-sm"
                              onClick={() => openEditSheet(habit)}
                              aria-label="Modifier"
                            >
                              <SquarePen className="h-4 w-4 text-muted-foreground" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-sm"
                              onClick={() => openDeleteDialog(habit)}
                              aria-label="Supprimer"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </td>
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
                  <tr className="border-t-2 border-border bg-muted/40">
                    <td className="py-3 pr-4 pl-1 text-sm font-medium text-muted-foreground">% du jour</td>
                    {percentByDay.map((p, i) => (
                      <td key={i} className="py-3 px-1 text-center text-sm tabular-nums text-muted-foreground">
                        {p}%
                      </td>
                    ))}
                  </tr>
                  <tr className="bg-muted/40">
                    <td className="py-2 pr-4 pl-1 text-sm font-medium text-muted-foreground">Complétées</td>
                    {completedByDay.map((n, i) => (
                      <td key={i} className="py-2 px-1 text-center text-sm tabular-nums text-muted-foreground">
                        {n}
                      </td>
                    ))}
                  </tr>
                  <tr className="bg-muted/40">
                    <td className="py-2 pr-4 pl-1 text-sm font-medium text-muted-foreground">Total</td>
                    {weekDays.map((_, i) => (
                      <td key={i} className="py-2 px-1 text-center text-sm tabular-nums text-muted-foreground">
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

      <CreateHabitSheet
        open={createSheetOpen}
        onOpenChange={setCreateSheetOpen}
        onSaved={loadHabits}
      />
      <EditHabitSheet
        open={editSheetOpen}
        onOpenChange={setEditSheetOpen}
        habit={editingHabit}
        onSaved={loadHabits}
      />
      <DeleteHabitDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        habit={habitToDelete}
        onDeleted={handleHabitDeleted}
      />
    </div>
  );
}
