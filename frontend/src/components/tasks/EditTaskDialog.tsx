'use client';

import { Task } from '@/types/task';
import { TaskForm } from '@/components/tasks/TaskForm';
import { RepeatPattern } from '@/components/tasks/RepeatSelector';

export type EditTaskDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
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

export function EditTaskDialog({ open, onOpenChange, task, onSubmit }: EditTaskDialogProps) {
  return (
    <TaskForm
      task={task}
      title="Edit task"
      open={open}
      onOpenChange={onOpenChange}
      onSubmit={onSubmit}
    />
  );
}
