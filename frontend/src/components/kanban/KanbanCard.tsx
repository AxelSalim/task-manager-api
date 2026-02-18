'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task } from '@/types/task';
import { TagBadge } from '@/components/tags/TagBadge';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar, ListTodo, Trash2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface KanbanCardProps {
  task: Task;
  onClick: () => void;
  onDelete: () => void;
  isDone?: boolean;
}

const priorityStyles: Record<string, string> = {
  low: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
  normal: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
  high: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  urgent: 'bg-red-500/20 text-red-300 border-red-500/40',
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

  const completedSubtasks = task.subtasks?.filter((s) => s.completed).length ?? 0;
  const totalSubtasks = task.subtasks?.length ?? 0;

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={cn(
        'rounded-lg border bg-slate-700/90 border-slate-600 p-3 cursor-grab active:cursor-grabbing',
        'shadow-sm hover:shadow-md hover:border-slate-500 transition-all duration-200 relative group',
        isDragging && 'opacity-50 rotate-1 shadow-lg z-50'
      )}
    >
      {/* Indicateur terminé (coche verte) */}
      {isDone && (
        <div className="absolute top-3 right-3 flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400">
          <Check className="h-3.5 w-3.5" />
        </div>
      )}

      <div className="space-y-3 pr-8">
        {/* Titre */}
        <h4
          className={cn(
            'font-medium text-sm text-slate-100 line-clamp-2',
            isDone && 'line-through text-slate-400'
          )}
        >
          {task.title}
        </h4>

        {/* Labels (tags + priorité) — style image */}
        <div className="flex flex-wrap gap-1.5">
          {task.priority && task.priority !== 'normal' && (
            <span
              className={cn(
                'inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium border',
                priorityStyles[task.priority] ?? priorityStyles.normal
              )}
            >
              {task.priority === 'urgent' && 'Urgent'}
              {task.priority === 'high' && 'Haute'}
              {task.priority === 'low' && 'Basse'}
            </span>
          )}
          {task.tags?.slice(0, 4).map((tag) => (
            <TagBadge key={tag.id} tag={tag} size="sm" />
          ))}
          {task.tags && task.tags.length > 4 && (
            <span className="text-xs text-slate-500">+{task.tags.length - 4}</span>
          )}
        </div>

        {/* Métadonnées — date + checklist X/Y (style image) */}
        <div className="flex items-center gap-3 text-xs text-slate-400">
          {task.dueDate && (
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              {format(new Date(task.dueDate), 'd MMM', { locale: fr })}
            </span>
          )}
          {totalSubtasks > 0 && (
            <span className="inline-flex items-center gap-1">
              <ListTodo className="h-3.5 w-3.5 shrink-0" />
              {completedSubtasks}/{totalSubtasks}
            </span>
          )}
          {(task.estimatedMinutes != null || (task.spentMinutes ?? 0) > 0) && (
            <span className="tabular-nums">
              {task.estimatedMinutes != null && `Est: ${task.estimatedMinutes}min`}
              {(task.spentMinutes ?? 0) > 0 &&
                ` · Fait: ${task.spentMinutes}min`}
            </span>
          )}
        </div>
      </div>

      {/* Supprimer au survol */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleDelete}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 text-slate-400 hover:text-red-400 hover:bg-slate-600/80 cursor-pointer"
        aria-label="Supprimer la tâche"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
