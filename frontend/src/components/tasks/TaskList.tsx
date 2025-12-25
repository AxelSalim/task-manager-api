'use client';

import { Task } from '@/types/task';
import { TaskCard } from './TaskCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Inbox } from 'lucide-react';

interface TaskListProps {
  tasks: Task[];
  isLoading?: boolean;
  onToggle?: (taskId: number) => void;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: number) => void;
  onUpdateSubtasks?: (taskId: number, subtasks: Task['subtasks']) => void;
}

export function TaskList({
  tasks,
  isLoading,
  onToggle,
  onEdit,
  onDelete,
  onUpdateSubtasks,
}: TaskListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <Alert className="border-slate-200">
        <Inbox className="h-4 w-4" />
        <AlertDescription className="text-slate-600">
          Aucune tâche trouvée. Créez votre première tâche pour commencer !
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onToggle={onToggle}
              onEdit={onEdit}
              onDelete={onDelete}
              onUpdateSubtasks={onUpdateSubtasks}
            />
      ))}
    </div>
  );
}

