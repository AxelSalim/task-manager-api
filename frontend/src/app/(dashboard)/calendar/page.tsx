'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ChevronLeft, ChevronRight, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { tasksAPI } from '@/lib/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const daysOfWeek = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

type TaskItem = {
  id: number;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  reminderDate: string | null;
  tags?: Array<{ id: number; name: string; color: string }>;
};

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

const STATUS_LABELS: Record<string, string> = {
  todo: 'À faire',
  'in-progress': 'En cours',
  done: 'Terminée',
};

const PRIORITY_LABELS: Record<string, string> = {
  low: 'Basse',
  normal: 'Normale',
  high: 'Haute',
  urgent: 'Urgente',
};

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'week' | 'month'>('month');
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const data = await tasksAPI.getAll();
      setTasks(data as TaskItem[]);
    } catch {
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay();

  const prevMonthLastDay = new Date(year, month, 0).getDate();
  const daysBefore: { date: Date; dayNum: number }[] = [];
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    const d = prevMonthLastDay - i;
    daysBefore.push({ date: new Date(year, month - 1, d), dayNum: d });
  }

  const totalCells = daysBefore.length + daysInMonth;
  const remainingCells = 42 - totalCells;
  const daysAfter: { date: Date; dayNum: number }[] = [];
  for (let i = 1; i <= remainingCells; i++) {
    daysAfter.push({ date: new Date(year, month + 1, i), dayNum: i });
  }

  const getTasksForDate = useCallback(
    (date: Date) => {
      return tasks.filter((t) => {
        if (!t.dueDate) return false;
        return isSameDay(new Date(t.dueDate), date);
      });
    },
    [tasks]
  );

  const getEventsForDay = useCallback(
    (date: Date) => {
      return getTasksForDate(date).map((t) => ({
        id: t.id,
        title: t.title,
        color: t.status === 'done' ? 'bg-slate-200' : 'bg-blue-200',
        status: t.status,
      }));
    },
    [getTasksForDate]
  );

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setSheetOpen(true);
  };

  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const today = new Date();
  const isToday = (date: Date) => isSameDay(date, today);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-slate-900">
            {monthNames[month]}, {year}
          </h1>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setView('week')}
              className={cn(view === 'week' && 'bg-primary text-white')}
            >
              SEMAINE
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setView('month')}
              className={cn(view === 'month' && 'bg-primary text-white')}
            >
              MOIS
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={goToPreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday}>
            AUJOURD&apos;HUI
          </Button>
          <Button variant="ghost" size="icon" onClick={goToNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="grid grid-cols-7 border-b border-slate-200">
          {daysOfWeek.map((day) => (
            <div
              key={day}
              className="p-3 text-center text-sm font-medium text-slate-600 border-r border-slate-200 last:border-r-0"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {daysBefore.map(({ date, dayNum }) => {
            const dayEvents = getEventsForDay(date);
            return (
              <button
                key={`prev-${dayNum}`}
                type="button"
                onClick={() => handleDayClick(date)}
                className={cn(
                  'min-h-[120px] border-r border-b border-slate-200 p-2 bg-slate-50 text-left hover:bg-slate-100 transition-colors cursor-pointer'
                )}
              >
                <span className="text-sm text-slate-400">{dayNum}</span>
                <div className="space-y-1 mt-1">
                  {dayEvents.slice(0, 3).map((event) => (
                    <div
                      key={event.id}
                      className={cn(
                        'text-xs px-2 py-1 rounded truncate',
                        event.color,
                        'text-slate-800'
                      )}
                    >
                      {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-slate-500 px-2">
                      +{dayEvents.length - 3} de plus
                    </div>
                  )}
                </div>
              </button>
            );
          })}

          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((dayNum) => {
            const date = new Date(year, month, dayNum);
            const dayEvents = getEventsForDay(date);
            return (
              <button
                key={dayNum}
                type="button"
                onClick={() => handleDayClick(date)}
                className={cn(
                  'min-h-[120px] border-r border-b border-slate-200 p-2 text-left hover:bg-slate-100 transition-colors cursor-pointer',
                  isToday(date) && 'bg-blue-50'
                )}
              >
                <div
                  className={cn(
                    'text-sm font-medium mb-1',
                    isToday(date) ? 'text-primary' : 'text-slate-900'
                  )}
                >
                  {dayNum}
                </div>
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map((event) => (
                    <div
                      key={event.id}
                      className={cn(
                        'text-xs px-2 py-1 rounded truncate',
                        event.color,
                        'text-slate-800'
                      )}
                    >
                      {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-slate-500 px-2">
                      +{dayEvents.length - 3} de plus
                    </div>
                  )}
                </div>
              </button>
            );
          })}

          {daysAfter.map(({ date, dayNum }) => {
            const dayEvents = getEventsForDay(date);
            return (
              <button
                key={`next-${dayNum}`}
                type="button"
                onClick={() => handleDayClick(date)}
                className="min-h-[120px] border-r border-b border-slate-200 p-2 bg-slate-50 text-left hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <span className="text-sm text-slate-400">{dayNum}</span>
                <div className="space-y-1 mt-1">
                  {dayEvents.slice(0, 3).map((event) => (
                    <div
                      key={event.id}
                      className={cn(
                        'text-xs px-2 py-1 rounded truncate',
                        event.color,
                        'text-slate-800'
                      )}
                    >
                      {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-slate-500 px-2">
                      +{dayEvents.length - 3} de plus
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="flex flex-col sm:max-w-md rounded-none border-l">
          <SheetHeader className="border-b pb-4">
            <SheetTitle>
              {selectedDate
                ? format(selectedDate, "EEEE d MMMM yyyy", { locale: fr })
                : 'Jour'}
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto py-4">
            {selectedDate && (
              <>
                {loading ? (
                  <p className="text-sm text-muted-foreground">Chargement…</p>
                ) : (
                  <>
                    {getTasksForDate(selectedDate).length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Aucune tâche prévue ce jour.
                      </p>
                    ) : (
                      <ul className="space-y-3">
                        {getTasksForDate(selectedDate).map((task) => (
                          <li
                            key={task.id}
                            className="rounded-sm border bg-card p-3 text-card-foreground shadow-sm"
                          >
                            <p className="font-medium">{task.title}</p>
                            <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                              <span>
                                {STATUS_LABELS[task.status] ?? task.status}
                              </span>
                              <span>·</span>
                              <span>
                                {PRIORITY_LABELS[task.priority] ?? task.priority}
                              </span>
                            </div>
                            {task.description && (
                              <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                                {task.description}
                              </p>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
