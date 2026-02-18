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
  onDelete: () => void;
  isDone?: boolean;
}

const statusLabel: Record<string, string> = {
  todo: 'À faire',
  'in-progress': 'En cours',
  done: 'Terminé',
};

export function KanbanCard({ task, onClick, onDelete, isDone }: KanbanCardProps) {
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
        'group rounded-sm border border-primary-foreground/25 overflow-hidden cursor-grab active:cursor-grabbing',
        'shadow-sm hover:shadow-md hover:border-primary-foreground/40 transition-all duration-200 relative flex flex-col',
        isDragging && 'opacity-50 rotate-1 shadow-lg z-50'
      )}
    >
      {/* Bandeau haut — couleur primaire */}
      <div className="h-8 shrink-0 bg-primary relative">
        {/* Icône crayon (édition) visible au survol */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleEdit}
          className="absolute top-0.5 right-0.5 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity bg-transparent text-primary-foreground hover:bg-transparent hover:text-primary-foreground cursor-pointer"
          aria-label="Modifier la tâche"
        >
          <SquarePen className="h-5 w-5" />
        </Button>
      </div>

      {/* Corps — fond primaire clair, texte primary-foreground */}
      <div className="flex-1 min-h-[72px] bg-primary-foreground/10 px-3 py-2.5">
        <div className="flex flex-col gap-0.5 min-w-0">
          {/* Ligne 1 : statut • */}
          <p className="text-xs text-primary-foreground/90 font-medium">
            {statusLabel[task.status] ?? task.status} •
          </p>
          {/* Ligne 2 : titre */}
          <p
            className={cn(
              'text-sm text-primary-foreground font-medium line-clamp-2',
              isDone && 'line-through text-primary-foreground/60'
            )}
          >
            {task.title}
          </p>
          {/* Ligne 3 : date */}
          {task.dueDate && (
            <p className="text-xs text-primary-foreground/70">
              ({format(new Date(task.dueDate), 'do MMMM', { locale: fr })})
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
