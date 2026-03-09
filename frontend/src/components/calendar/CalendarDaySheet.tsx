'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import {
  CheckCircle2,
  Circle,
  ClipboardList,
  Flag,
  Loader2,
  Plus,
  SquarePen,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export type CalendarDayTask = {
  id: number;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  reminderDate: string | null;
  createdAt?: string;
  tags?: Array<{ id: number; name: string; color: string }>;
};

const STATUS_CONFIG: Record<
  string,
  { label: string; icon: typeof Circle; className: string }
> = {
  todo: {
    label: 'À faire',
    icon: Circle,
    className: 'text-muted-foreground border-muted-foreground/30',
  },
  'in-progress': {
    label: 'En cours',
    icon: Loader2,
    className: 'text-blue-600 border-blue-200 bg-blue-50',
  },
  done: {
    label: 'Terminée',
    icon: CheckCircle2,
    className: 'text-primary border-primary/30 bg-primary/10',
  },
};

const PRIORITY_CONFIG: Record<string, { label: string; className: string }> = {
  low: { label: 'Basse', className: 'text-muted-foreground bg-muted/50' },
  normal: { label: 'Normale', className: 'text-foreground bg-muted/40' },
  high: { label: 'Haute', className: 'text-amber-700 bg-amber-100' },
  urgent: { label: 'Urgente', className: 'text-red-700 bg-red-100' },
};

type CalendarDaySheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date | null;
  tasks: CalendarDayTask[];
  loading?: boolean;
  onAddTask?: () => void;
  onEditTask?: (task: CalendarDayTask) => void;
  onDeleteTask?: (task: CalendarDayTask) => void;
};

function TaskCard({
  task,
  onEdit,
  onDelete,
}: {
  task: CalendarDayTask;
  onEdit?: (task: CalendarDayTask) => void;
  onDelete?: (task: CalendarDayTask) => void;
}) {
  const status = STATUS_CONFIG[task.status] ?? {
    label: task.status,
    icon: Circle,
    className: 'text-muted-foreground border-muted-foreground/30',
  };
  const priority = PRIORITY_CONFIG[task.priority] ?? {
    label: task.priority,
    className: 'bg-muted/40',
  };
  const StatusIcon = status.icon;

  return (
    <article
      className={cn(
        'rounded-sm border bg-card text-card-foreground overflow-hidden',
        'border-l-4',
        task.status === 'done' && 'border-l-primary',
        task.status === 'in-progress' && 'border-l-blue-500',
        task.status === 'todo' && 'border-l-muted-foreground/40'
      )}
    >
      <div className="p-4">
        <h3 className="font-medium text-sm leading-snug text-foreground">
          {task.title}
        </h3>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded border px-2 py-0.5 text-xs font-medium',
              status.className
            )}
          >
            {task.status === 'in-progress' ? (
              <StatusIcon className="h-3 w-3 animate-spin" />
            ) : (
              <StatusIcon className="h-3 w-3 shrink-0" />
            )}
            {status.label}
          </span>
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium',
              priority.className
            )}
          >
            <Flag className="h-3 w-3 shrink-0" />
            {priority.label}
          </span>
        </div>
        {task.description && (
          <p className="mt-3 text-xs text-muted-foreground line-clamp-3 leading-relaxed">
            {task.description}
          </p>
        )}
        {task.tags && task.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {task.tags.map((tag) => (
              <span
                key={tag.id}
                className="rounded px-1.5 py-0.5 text-[10px] font-medium opacity-90"
                style={{
                  backgroundColor: tag.color ? `${tag.color}20` : 'var(--muted)',
                  color: tag.color || 'var(--muted-foreground)',
                }}
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}
        {(onEdit || onDelete) && (
          <div className="mt-3 flex flex-wrap gap-2 pt-3 border-t">
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 rounded-sm px-2 text-muted-foreground hover:text-foreground"
                onClick={() => onEdit(task)}
                aria-label={`Modifier la tâche ${task.title}`}
              >
                <SquarePen className="h-3.5 w-3.5 shrink-0" />
                Modifier
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 rounded-sm px-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={() => onDelete(task)}
                aria-label={`Supprimer la tâche ${task.title}`}
              >
                <Trash2 className="h-3.5 w-3.5 shrink-0" />
                Supprimer
              </Button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

export function CalendarDaySheet({
  open,
  onOpenChange,
  selectedDate,
  tasks,
  loading = false,
  onAddTask,
  onEditTask,
  onDeleteTask,
}: CalendarDaySheetProps) {
  const dayLabel = selectedDate
    ? format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr })
    : '';
  const capitalizedDayLabel =
    dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex flex-col w-full sm:max-w-lg rounded-none border-l p-0 gap-0"
      >
        <SheetHeader className="shrink-0 border-b bg-muted/20 px-5 py-3">
          <SheetTitle className="text-base font-semibold text-foreground">
            {selectedDate ? capitalizedDayLabel : 'Jour'}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {selectedDate && (
            <>
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : tasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <div className="rounded-full bg-muted/50 p-4 mb-3">
                    <ClipboardList className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    Aucune tâche ce jour
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-[220px]">
                    Les tâches avec une date d’échéance ou de création ce jour
                    apparaîtront ici.
                  </p>
                  {onAddTask && (
                    <Button
                      className="mt-4 rounded-sm"
                      size="sm"
                      onClick={onAddTask}
                      aria-label="Ajouter une tâche"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter une tâche
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {onAddTask && (
                    <Button
                      variant="outline"
                      className="w-full rounded-sm"
                      size="sm"
                      onClick={onAddTask}
                      aria-label="Ajouter une tâche"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter une tâche
                    </Button>
                  )}
                  <ul className="space-y-3">
                    {tasks.map((task) => (
                      <li key={task.id}>
                        <TaskCard task={task} onEdit={onEditTask} onDelete={onDeleteTask} />
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
