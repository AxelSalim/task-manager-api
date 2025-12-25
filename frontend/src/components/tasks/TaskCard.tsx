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

interface TaskCardProps {
  task: Task;
  onToggle?: (taskId: number) => void;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: number) => void;
  onUpdateSubtasks?: (taskId: number, subtasks: Task['subtasks']) => void;
}

const priorityColors = {
  low: 'bg-blue-100 text-blue-700 border-blue-200',
  normal: 'bg-gray-100 text-gray-700 border-gray-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  urgent: 'bg-red-100 text-red-700 border-red-200',
};

const priorityIcons = {
  low: '🔵',
  normal: '⚪',
  high: '🟠',
  urgent: '🔴',
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

  return (
    <div
      className={cn(
        'group bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-all',
        isCompleted && 'opacity-60'
      )}
    >
      <div className="flex items-start gap-3">
        <Checkbox
          checked={isCompleted}
          onCheckedChange={handleToggle}
          className="mt-1"
        />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3
              className={cn(
                'font-medium text-slate-900 flex-1',
                isCompleted && 'line-through text-slate-500'
              )}
            >
              {task.title}
            </h3>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {task.description && (
            <div
              className={cn(
                'text-sm text-slate-600 mt-1',
                isCompleted && 'opacity-60'
              )}
            >
              <MarkdownPreview content={task.description} className="text-sm" />
            </div>
          )}

          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {task.tags.map(tag => (
                <TagBadge key={tag.id} tag={tag} size="sm" />
              ))}
            </div>
          )}

          <div className="flex items-center gap-3 mt-3 flex-wrap">
            {priority && (
              <div
                className={cn(
                  'inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border',
                  priorityColors[priority]
                )}
              >
                <Flag className="h-3 w-3" />
                {priority === 'low' && 'Basse'}
                {priority === 'normal' && 'Normale'}
                {priority === 'high' && 'Haute'}
                {priority === 'urgent' && 'Urgente'}
              </div>
            )}

            {dueDate && (
              <div
                className={cn(
                  'inline-flex items-center gap-1 text-xs',
                  isOverdue ? 'text-red-600 font-medium' : 'text-slate-600'
                )}
              >
                <Calendar className="h-3 w-3" />
                {format(dueDate, 'd MMM yyyy', { locale: fr })}
                {isOverdue && ' (En retard)'}
              </div>
            )}

            {reminderDate && (
              <div
                className={cn(
                  'inline-flex items-center gap-1 text-xs',
                  isReminderPassed ? 'text-orange-600 font-medium' : 'text-slate-600'
                )}
              >
                <Bell className="h-3 w-3" />
                {format(reminderDate, 'd MMM yyyy HH:mm', { locale: fr })}
              </div>
            )}
          </div>

          {/* Sous-tâches */}
          {task.subtasks && task.subtasks.length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-200">
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
      </div>
    </div>
  );
}

