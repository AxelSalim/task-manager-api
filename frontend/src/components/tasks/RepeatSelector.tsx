'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export type RepeatPattern = {
  type: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
  interval?: number;
  daysOfWeek?: number[];
  endDate?: string;
  count?: number;
} | null;

interface RepeatSelectorProps {
  value: RepeatPattern;
  onChange: (pattern: RepeatPattern) => void;
  className?: string;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Dimanche' },
  { value: 1, label: 'Lundi' },
  { value: 2, label: 'Mardi' },
  { value: 3, label: 'Mercredi' },
  { value: 4, label: 'Jeudi' },
  { value: 5, label: 'Vendredi' },
  { value: 6, label: 'Samedi' },
];

export function RepeatSelector({ value, onChange, className }: RepeatSelectorProps) {
  const [localPattern, setLocalPattern] = useState<RepeatPattern>(value);

  const handleTypeChange = (type: string) => {
    if (type === 'none') {
      setLocalPattern(null);
      onChange(null);
      return;
    }

    const newPattern: RepeatPattern = {
      type: type as RepeatPattern['type'],
      interval: 1,
    };

    if (type === 'weekly') {
      newPattern.daysOfWeek = [];
    }

    setLocalPattern(newPattern);
    onChange(newPattern);
  };

  const handleIntervalChange = (interval: number) => {
    if (!localPattern) return;
    const newPattern = { ...localPattern, interval };
    setLocalPattern(newPattern);
    onChange(newPattern);
  };

  const handleDayToggle = (day: number) => {
    if (!localPattern || localPattern.type !== 'weekly') return;
    const daysOfWeek = localPattern.daysOfWeek || [];
    const newDays = daysOfWeek.includes(day)
      ? daysOfWeek.filter(d => d !== day)
      : [...daysOfWeek, day].sort();
    
    const newPattern = { ...localPattern, daysOfWeek: newDays };
    setLocalPattern(newPattern);
    onChange(newPattern);
  };

  const handleEndDateChange = (date: Date | undefined) => {
    if (!localPattern) return;
    const newPattern = {
      ...localPattern,
      endDate: date ? date.toISOString() : undefined,
      count: undefined, // Si on définit une date de fin, on retire le count
    };
    setLocalPattern(newPattern);
    onChange(newPattern);
  };

  const handleCountChange = (count: number | undefined) => {
    if (!localPattern) return;
    const newPattern = {
      ...localPattern,
      count,
      endDate: undefined, // Si on définit un count, on retire la date de fin
    };
    setLocalPattern(newPattern);
    onChange(newPattern);
  };

  const currentType = localPattern?.type || 'none';

  return (
    <div className={cn('space-y-4', className)}>
      <div className="space-y-2">
        <Label>Répétition</Label>
        <Select value={currentType} onValueChange={handleTypeChange}>
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner une répétition" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Aucune répétition</SelectItem>
            <SelectItem value="daily">Quotidienne</SelectItem>
            <SelectItem value="weekly">Hebdomadaire</SelectItem>
            <SelectItem value="monthly">Mensuelle</SelectItem>
            <SelectItem value="yearly">Annuelle</SelectItem>
            <SelectItem value="custom">Personnalisée</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {localPattern && (
        <div className="space-y-3 pl-4 border-l-2 border-slate-200">
          {/* Intervalle */}
          {(localPattern.type === 'daily' || localPattern.type === 'monthly' || localPattern.type === 'yearly') && (
            <div className="space-y-2">
              <Label className="text-sm">Répéter tous les</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="1"
                  value={localPattern.interval || 1}
                  onChange={(e) => handleIntervalChange(parseInt(e.target.value) || 1)}
                  className="w-20"
                />
                <span className="text-sm text-slate-600">
                  {localPattern.type === 'daily' && 'jour(s)'}
                  {localPattern.type === 'monthly' && 'mois'}
                  {localPattern.type === 'yearly' && 'an(s)'}
                </span>
              </div>
            </div>
          )}

          {/* Jours de la semaine pour hebdomadaire */}
          {localPattern.type === 'weekly' && (
            <div className="space-y-2">
              <Label className="text-sm">Répéter tous les</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="1"
                  value={localPattern.interval || 1}
                  onChange={(e) => handleIntervalChange(parseInt(e.target.value) || 1)}
                  className="w-20"
                />
                <span className="text-sm text-slate-600">semaine(s) le</span>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {DAYS_OF_WEEK.map(day => (
                  <div key={day.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`day-${day.value}`}
                      checked={localPattern.daysOfWeek?.includes(day.value) || false}
                      onCheckedChange={() => handleDayToggle(day.value)}
                    />
                    <Label
                      htmlFor={`day-${day.value}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {day.label.substring(0, 3)}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Date de fin ou nombre d'occurrences */}
          <div className="space-y-2">
            <Label className="text-sm">Fin de la répétition</Label>
            <div className="flex items-center gap-2">
              <Select
                value={localPattern.endDate ? 'date' : localPattern.count ? 'count' : 'never'}
                onValueChange={(value) => {
                  if (value === 'never') {
                    handleEndDateChange(undefined);
                    handleCountChange(undefined);
                  } else if (value === 'date') {
                    handleCountChange(undefined);
                  } else if (value === 'count') {
                    handleEndDateChange(undefined);
                  }
                }}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="never">Jamais</SelectItem>
                  <SelectItem value="date">Le</SelectItem>
                  <SelectItem value="count">Après</SelectItem>
                </SelectContent>
              </Select>

              {localPattern.endDate && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="flex-1 justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {localPattern.endDate ? (
                        format(new Date(localPattern.endDate), 'PPP', { locale: fr })
                      ) : (
                        <span>Choisir une date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={localPattern.endDate ? new Date(localPattern.endDate) : undefined}
                      onSelect={(date) => handleEndDateChange(date || undefined)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              )}

              {localPattern.count && (
                <div className="flex items-center gap-2 flex-1">
                  <Input
                    type="number"
                    min="1"
                    value={localPattern.count}
                    onChange={(e) => handleCountChange(parseInt(e.target.value) || undefined)}
                    className="w-20"
                  />
                  <span className="text-sm text-slate-600">occurrence(s)</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

