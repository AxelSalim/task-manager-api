'use client';

import { Task } from '@/types/task';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Calendar, Flag, MoreVertical, Trash2, Edit, Bell } from 'lucide-react';
import { SubtaskList } from './SubtaskList';
import { TagBadge } from '@/components/tags/TagBadge';
import { MarkdownPreview } from '@/components/markdown/MarkdownPreview';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

function formatMinutes(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

interface TaskCardProps {
  task: Task;
  onToggle?: (taskId: number) => void;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: number) => void;
  onUpdateSubtasks?: (taskId: number, subtasks: Task['subtasks']) => void;
}

const priorityColors = {
  low: 'bg-blue-100 text-blue-700 border-blue-200',
  normal: 'bg-slate-100 text-slate-700 border-slate-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  urgent: 'bg-red-100 text-red-700 border-red-200',
};

export function TaskCard({ task, onToggle, onEdit, onDelete, onUpdateSubtasks }: TaskCardProps) {
  const isCompleted = task.status === 'done';
  const priority = (task.priority || 'normal') as keyof typeof priorityColors;
  const dueDate = task.dueDate ? new Date(task.dueDate) : null;
  const reminderDate = task.reminderDate ? new Date(task.reminderDate) : null;
  const isOverdue = dueDate && dueDate < new Date() && !isCompleted;
  const isReminderPassed = reminderDate && reminderDate < new Date() && !isCompleted;

  const handleToggle = () => {
    if (onToggle) {
      onToggle(task.id);
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(task);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(task.id);
    }
  };

  const hasTime = task.estimatedMinutes != null || (task.spentMinutes ?? 0) > 0;

  return (
    <article
      className={cn(
        'group bg-white border border-slate-200/80 rounded-xl px-4 py-3 hover:shadow-sm hover:border-slate-200 transition-all duration-200',
        isCompleted && 'opacity-75'
      )}
      aria-label={task.title}
    >
      {/* Ligne principale type Blitzit: checkbox + titre + Est/Done à droite */}
      <div className="flex items-center gap-3">
        <Checkbox
          checked={isCompleted}
          onCheckedChange={handleToggle}
          className="shrink-0 cursor-pointer"
          aria-label={isCompleted ? 'Marquer comme à faire' : 'Marquer comme terminée'}
        />
        <div className="flex-1 min-w-0 flex items-center justify-between gap-3">
          <h3
            className={cn(
              'font-medium text-slate-900 truncate',
              isCompleted && 'line-through text-slate-500'
            )}
          >
            {task.title}
          </h3>
          <div className="flex items-center gap-2 shrink-0">
            {hasTime && (
              <span className="text-xs font-medium text-slate-500 tabular-nums">
                {task.estimatedMinutes != null && (
                  <span>Est: {formatMinutes(task.estimatedMinutes)}</span>
                )}
                {(task.estimatedMinutes != null && (task.spentMinutes ?? 0) > 0) && ' · '}
                {(task.spentMinutes ?? 0) > 0 && (
                  <span className="text-slate-700">Fait: {formatMinutes(task.spentMinutes ?? 0)}</span>
                )}
              </span>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 min-h-9 min-w-9 opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus:opacity-100"
                  aria-label="Options de la tâche"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[10rem]">
                <DropdownMenuItem onClick={handleEdit} className="cursor-pointer">
                  <Edit className="h-4 w-4 mr-2 shrink-0" />
                  Modifier
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDelete} className="text-red-600 cursor-pointer focus:bg-red-50">
                  <Trash2 className="h-4 w-4 mr-2 shrink-0" />
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {(task.description || (task.tags && task.tags.length > 0) || dueDate || reminderDate || (priority && priority !== 'normal') || (task.subtasks && task.subtasks.length > 0)) && (
        <div className="ml-8 mt-2 pt-2 border-t border-slate-100 space-y-2">
          {task.description && (
            <div className={cn('text-sm text-slate-600 line-clamp-2', isCompleted && 'opacity-70')}>
              <MarkdownPreview content={task.description} className="text-sm" />
            </div>
          )}
          {task.tags && task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {task.tags.map(tag => (
                <TagBadge key={tag.id} tag={tag} size="sm" />
              ))}
            </div>
          )}
          <div className="flex items-center gap-3 flex-wrap text-xs text-slate-500">
            {priority && priority !== 'normal' && (
              <span className={cn('inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-medium', priorityColors[priority])}>
                <Flag className="h-3 w-3" />
                {priority === 'low' && 'Basse'}
                {priority === 'high' && 'Haute'}
                {priority === 'urgent' && 'Urgente'}
              </span>
            )}
            {dueDate && (
              <span className={cn('inline-flex items-center gap-1', isOverdue && 'text-red-600 font-medium')}>
                <Calendar className="h-3 w-3" />
                {format(dueDate, 'd MMM', { locale: fr })}
                {isOverdue && ' (retard)'}
              </span>
            )}
            {reminderDate && (
              <span className={cn('inline-flex items-center gap-1', isReminderPassed && 'text-amber-600')}>
                <Bell className="h-3 w-3" />
                {format(reminderDate, 'd MMM HH:mm', { locale: fr })}
              </span>
            )}
          </div>
          {task.subtasks && task.subtasks.length > 0 && (
            <div className="mt-2">
              <SubtaskList
                subtasks={task.subtasks}
                taskId={task.id}
                onUpdate={(updatedSubtasks) => {
                  if (onUpdateSubtasks) {
                    onUpdateSubtasks(task.id, updatedSubtasks);
                  }
                }}
              />
            </div>
          )}
        </div>
      )}
    </article>
  );
}


