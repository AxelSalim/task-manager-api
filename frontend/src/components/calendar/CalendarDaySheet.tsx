'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export type CalendarDayTask = {
  id: number;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  reminderDate: string | null;
  tags?: Array<{ id: number; name: string; color: string }>;
};

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

type CalendarDaySheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date | null;
  tasks: CalendarDayTask[];
  loading?: boolean;
};

export function CalendarDaySheet({
  open,
  onOpenChange,
  selectedDate,
  tasks,
  loading = false,
}: CalendarDaySheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex flex-col sm:max-w-lg rounded-none border-l"
      >
        <SheetHeader className="border-b pb-3">
          <SheetTitle>
            {selectedDate
              ? format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr })
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
                  {tasks.length === 0 ? (
                    <p className="text-sm text-center text-muted-foreground">
                      Aucune tâche prévue ce jour.
                    </p>
                  ) : (
                    <ul className="space-y-3">
                      {tasks.map((task) => (
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
  );
}
