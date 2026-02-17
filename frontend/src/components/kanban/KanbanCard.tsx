'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task } from '@/types/task';
import { TagBadge } from '@/components/tags/TagBadge';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface KanbanCardProps {
  task: Task;
  onClick: () => void;
  onDelete: () => void;
}

const priorityColors = {
  low: 'bg-blue-100 text-blue-800 border-blue-200',
  normal: 'bg-gray-100 text-gray-800 border-gray-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  urgent: 'bg-red-100 text-red-800 border-red-200',
};

const priorityLabels = {
  low: 'Basse',
  normal: 'Normale',
  high: 'Haute',
  urgent: 'Urgente',
};

export function KanbanCard({ task, onClick, onDelete }: KanbanCardProps) {
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id.toString(),
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

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
        'bg-card border rounded-lg p-4 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-shadow relative',
        isDragging && 'opacity-50 rotate-2',
        'group'
      )}
    >
      <div className="space-y-3">
        {/* Titre */}
        <h4 className="font-medium text-sm text-foreground line-clamp-2">
          {task.title}
        </h4>

        {/* Description (si présente) */}
        {task.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {task.description.replace(/[#*`]/g, '').substring(0, 100)}
            {task.description.length > 100 ? '...' : ''}
          </p>
        )}

        {/* Tags */}
        {task.tags && task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {task.tags.slice(0, 3).map((tag) => (
              <TagBadge key={tag.id} tag={tag} size="sm" variant="outline" />
            ))}
            {task.tags.length > 3 && (
              <span className="text-xs text-muted-foreground">
                +{task.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Métadonnées */}
        <div className="flex items-center justify-between text-xs">
          {/* Priorité */}
          <span
            className={cn(
              'px-2 py-0.5 rounded border text-xs font-medium',
              priorityColors[task.priority]
            )}
          >
            {priorityLabels[task.priority]}
          </span>

          {/* Date d'échéance */}
          {task.dueDate && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>
                {format(new Date(task.dueDate), 'd MMM', { locale: fr })}
              </span>
            </div>
          )}
        </div>

        {/* Bouton supprimer (visible au survol) */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
        >
          <Trash2 className="h-3 w-3 text-destructive" />
        </Button>
      </div>
    </div>
  );
}
