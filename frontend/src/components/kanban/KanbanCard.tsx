'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task } from '@/types/task';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { SquarePen } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface KanbanCardProps {
  task: Task;
  onClick: () => void;
  isDone?: boolean;
}

const statusLabel: Record<string, string> = {
  todo: 'À faire',
  'in-progress': 'En cours',
  done: 'Terminé',
};

export function KanbanCard({ task, onClick, isDone }: KanbanCardProps) {
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id.toString() });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick();
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={cn(
        'group rounded-lg border border-border overflow-hidden cursor-grab active:cursor-grabbing',
        'bg-card shadow-sm hover:shadow-md hover:border-border/80 transition-all duration-200 relative flex flex-col',
        isDragging && 'opacity-50 rotate-1 shadow-lg z-50'
      )}
    >
      <div className="h-8 shrink-0 bg-muted/80 dark:bg-muted/50 border-b border-border relative flex items-center justify-end pr-0.5">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleEdit}
          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground hover:bg-accent cursor-pointer"
          aria-label="Modifier la tâche"
        >
          <SquarePen className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 min-h-[72px] bg-card px-3 py-2.5">
        <div className="flex flex-col gap-0.5 min-w-0">
          <p className="text-xs text-muted-foreground font-medium">
            {statusLabel[task.status] ?? task.status} •
          </p>
          <p
            className={cn(
              'text-sm text-foreground font-medium line-clamp-2',
              isDone && 'line-through text-muted-foreground'
            )}
          >
            {task.title}
          </p>
          {task.dueDate && (
            <p className="text-xs text-muted-foreground">
              ({format(new Date(task.dueDate), 'do MMMM', { locale: fr })})
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
