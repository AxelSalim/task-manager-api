'use client';

import { useDroppable } from '@dnd-kit/core';
import { Task } from '@/types/task';
import { KanbanCard } from './KanbanCard';
import { cn } from '@/lib/utils';

interface KanbanColumnProps {
  id: string;
  title: string;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onTaskDelete: (taskId: number) => void;
  className?: string;
}

export function KanbanColumn({
  id,
  title,
  tasks,
  onTaskClick,
  onTaskDelete,
  className,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex flex-col h-full min-w-[300px] max-w-[300px] bg-muted/30 rounded-lg border transition-colors',
        isOver && 'bg-muted/50 border-primary',
        className
      )}
    >
      {/* En-tête de la colonne */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm text-foreground">{title}</h3>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
            {tasks.length}
          </span>
        </div>
      </div>

      {/* Liste des tâches */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {tasks.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-8">
            Aucune tâche
          </div>
        ) : (
          tasks.map((task) => (
            <KanbanCard
              key={task.id}
              task={task}
              onClick={() => onTaskClick(task)}
              onDelete={() => onTaskDelete(task.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
