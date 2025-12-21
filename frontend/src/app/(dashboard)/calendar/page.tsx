'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

const daysOfWeek = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

// Exemple d'événements (à remplacer par les vraies données)
const events = [
  { date: 2, title: 'Courses Walmart', color: 'bg-blue-200', time: '10:00', recurring: true },
  { date: 2, title: 'Jour de la marmotte', color: 'bg-purple-200' },
  { date: 3, title: 'Match de basket avec Davi', color: 'bg-orange-200' },
  { date: 3, title: 'Mettre à jour les directives', color: 'bg-purple-200' },
  { date: 6, title: 'Material Design', color: 'bg-blue-200' },
  { date: 6, title: 'Plan BBQ 12:30', color: 'bg-orange-200', time: '12:30' },
  { date: 6, title: 'Jogging', color: 'bg-blue-200' },
  { date: 14, title: 'Acheter des billets 16:30', color: 'bg-orange-200', time: '16:30' },
  { date: 14, title: 'Brainstorming', color: 'bg-purple-200' },
  { date: 14, title: 'Saint-Valentin', color: 'bg-blue-200' },
];

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'week' | 'month'>('month');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay();

  // Jours du mois précédent pour compléter la grille
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  const daysBefore = [];
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    daysBefore.push(prevMonthLastDay - i);
  }

  // Jours du mois suivant pour compléter la grille
  const totalCells = daysBefore.length + daysInMonth;
  const remainingCells = 42 - totalCells; // 6 semaines * 7 jours
  const daysAfter = [];
  for (let i = 1; i <= remainingCells; i++) {
    daysAfter.push(i);
  }

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const getEventsForDay = (day: number) => {
    return events.filter(event => event.date === day);
  };

  const today = new Date();
  const isToday = (day: number) => {
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    );
  };

  return (
    <div className="space-y-6">
      {/* Header du calendrier */}
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
            AUJOURD'HUI
          </Button>
          <Button variant="ghost" size="icon" onClick={goToNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Grille du calendrier */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        {/* En-têtes des jours */}
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

        {/* Jours du calendrier */}
        <div className="grid grid-cols-7">
          {/* Jours du mois précédent */}
          {daysBefore.map((day) => (
            <div
              key={`prev-${day}`}
              className="min-h-[120px] border-r border-b border-slate-200 p-2 bg-slate-50"
            >
              <span className="text-sm text-slate-400">{day}</span>
            </div>
          ))}

          {/* Jours du mois actuel */}
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
            const dayEvents = getEventsForDay(day);
            return (
              <div
                key={day}
                className={cn(
                  'min-h-[120px] border-r border-b border-slate-200 p-2',
                  isToday(day) && 'bg-blue-50'
                )}
              >
                <div className={cn(
                  'text-sm font-medium mb-1',
                  isToday(day) ? 'text-primary' : 'text-slate-900'
                )}>
                  {day}
                </div>
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map((event, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        'text-xs px-2 py-1 rounded truncate flex items-center gap-1',
                        event.color,
                        'text-slate-800'
                      )}
                    >
                      {event.recurring && (
                        <span className="text-[10px]">🔄</span>
                      )}
                      {event.time && <span className="font-medium">{event.time}</span>}
                      <span className="truncate">{event.title}</span>
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-slate-500 px-2">
                      +{dayEvents.length - 3} de plus
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Jours du mois suivant */}
          {daysAfter.map((day) => (
            <div
              key={`next-${day}`}
              className="min-h-[120px] border-r border-b border-slate-200 p-2 bg-slate-50"
            >
              <span className="text-sm text-slate-400">{day}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

