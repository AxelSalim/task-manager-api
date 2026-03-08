'use client';

import { Task } from '@/types/task';
import { TaskForm } from '@/components/tasks/TaskForm';
import { RepeatPattern } from '@/components/tasks/RepeatSelector';

export type CreateTaskDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Date d'échéance initiale (ex. jour sélectionné au calendrier) */
  initialDueDate?: Date | null;
  onSubmit: (values: {
    title: string;
    description?: string;
    status: Task['status'];
    priority: Task['priority'];
    dueDate?: string;
    reminderDate?: string;
    repeatPattern?: RepeatPattern;
    tagIds?: number[];
    estimatedMinutes?: number | null;
    spentMinutes?: number;
  }) => Promise<void>;
};

export function CreateTaskDialog({ open, onOpenChange, initialDueDate, onSubmit }: CreateTaskDialogProps) {
  return (
    <TaskForm
      task={null}
      initialDueDate={initialDueDate}
      title="Ajouter une tâche"
      open={open}
      onOpenChange={onOpenChange}
      onSubmit={onSubmit}
    />
  );
}
