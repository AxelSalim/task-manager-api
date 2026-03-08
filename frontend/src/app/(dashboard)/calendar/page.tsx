'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CalendarDaySheet, type CalendarDayTask } from '@/components/calendar/CalendarDaySheet';
import { CreateTaskDialog } from '@/components/tasks/CreateTaskDialog';
import { DeleteTaskDialog } from '@/components/tasks/DeleteTaskDialog';
import { EditTaskDialog } from '@/components/tasks/EditTaskDialog';
import { ChevronLeft, ChevronRight, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { tasksAPI } from '@/lib/api';

const daysOfWeek = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'week' | 'month'>('month');
  const [tasks, setTasks] = useState<CalendarDayTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [dateMenuOpen, setDateMenuOpen] = useState(false);
  const [createTaskDialogOpen, setCreateTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<CalendarDayTask | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<CalendarDayTask | null>(null);
  const [deleteTaskDialogOpen, setDeleteTaskDialogOpen] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const data = await tasksAPI.getAll();
      setTasks(data as CalendarDayTask[]);
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
        const taskDate = t.dueDate ? t.dueDate : t.createdAt;
        if (!taskDate) return false;
        return isSameDay(new Date(taskDate), date);
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

  const goToPrevious = () => {
    if (view === 'week') {
      setCurrentDate(new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000));
    } else {
      setCurrentDate(new Date(year, month - 1, 1));
    }
  };

  const goToNext = () => {
    if (view === 'week') {
      setCurrentDate(new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000));
    } else {
      setCurrentDate(new Date(year, month + 1, 1));
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Début de la semaine (dimanche) pour la vue semaine
  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    d.setDate(d.getDate() - d.getDay());
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const weekStart = getWeekStart(currentDate);
  const weekDays: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    weekDays.push(d);
  }

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

  const weekTitle =
    view === 'week'
      ? `Semaine du ${weekStart.getDate()} ${monthNames[weekStart.getMonth()]} ${weekStart.getFullYear()}`
      : `${monthNames[month]}, ${year}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-slate-900">
            {weekTitle}
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
          <Button variant="ghost" size="icon" onClick={goToPrevious}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday}>
            AUJOURD&apos;HUI
          </Button>
          <Button variant="ghost" size="icon" onClick={goToNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <DropdownMenu open={dateMenuOpen} onOpenChange={setDateMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Aller à une date">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="p-0 w-auto">
              <div className="p-2 border-b bg-muted/30">
                <p className="text-xs font-medium text-muted-foreground px-1">
                  Aller à une date
                </p>
              </div>
              <Calendar
                mode="single"
                selected={currentDate}
                onSelect={(date) => {
                  if (date) {
                    setCurrentDate(date);
                    setDateMenuOpen(false);
                  }
                }}
              />
            </DropdownMenuContent>
          </DropdownMenu>
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
          {view === 'week' ? (
            weekDays.map((date) => {
              const dayEvents = getEventsForDay(date);
              const isOtherMonth = date.getMonth() !== month;
              return (
                <button
                  key={date.toISOString()}
                  type="button"
                  onClick={() => handleDayClick(date)}
                  className={cn(
                    'min-h-[200px] border-r border-b border-slate-200 p-2 text-left hover:bg-slate-50 transition-colors cursor-pointer',
                    isToday(date) && 'bg-blue-50',
                    isOtherMonth && 'bg-slate-50/50'
                  )}
                >
                  <div
                    className={cn(
                      'text-sm font-medium mb-1',
                      isToday(date) ? 'text-primary' : 'text-slate-900',
                      isOtherMonth && 'text-slate-400'
                    )}
                  >
                    {date.getDate()}
                  </div>
                  <div className="text-[10px] text-muted-foreground uppercase mb-2">
                    {monthNames[date.getMonth()].slice(0, 3)}
                  </div>
                  <div className="space-y-1">
                    {dayEvents.slice(0, 5).map((event) => (
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
                    {dayEvents.length > 5 && (
                      <div className="text-xs text-slate-500 px-2">
                        +{dayEvents.length - 5} de plus
                      </div>
                    )}
                  </div>
                </button>
              );
            })
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>

      <CalendarDaySheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        selectedDate={selectedDate}
        tasks={selectedDate ? getTasksForDate(selectedDate) : []}
        loading={loading}
      />
    </div>
  );
}
