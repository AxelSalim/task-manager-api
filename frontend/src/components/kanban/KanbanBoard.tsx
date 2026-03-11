'use client';

import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useState } from 'react';
import { Task } from '@/types/task';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';
import { tasksAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface KanbanBoardProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onTaskDelete: (taskId: number) => void;
  onTasksChange: () => void;
  onAddCard?: () => void;
}

const columns: Array<
  | { id: 'list'; title: string; status?: undefined }
  | { id: string; title: string; status: 'todo' | 'in-progress' | 'done' }
> = [
  { id: 'list', title: 'Liste des tâches' },
  { id: 'todo', title: 'À faire', status: 'todo' },
  { id: 'in-progress', title: 'En cours', status: 'in-progress' },
  { id: 'done', title: 'Terminé', status: 'done' },
];

export function KanbanBoard({
  tasks,
  onTaskClick,
  onTaskDelete,
  onTasksChange,
  onAddCard,
}: KanbanBoardProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Organiser les tâches par colonne : "Liste des tâches" = toutes, les autres par statut
  const tasksByColumn = columns.reduce(
    (acc, column) => {
      if (column.id === 'list') {
        acc.list = tasks;
      } else {
        acc[column.id] = tasks.filter((task) => task.status === column.status);
      }
      return acc;
    },
    {} as Record<string, Task[]>
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find((t) => t.id.toString() === active.id);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = parseInt(active.id as string);
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    // Si on dépose sur une colonne (over.id est l'id de la colonne)
    const targetColumn = columns.find((col) => col.id === over.id);
    // Ne pas changer le statut si on dépose sur "Liste des tâches" (vue seule)
    const targetStatus = targetColumn && 'status' in targetColumn ? targetColumn.status : undefined;
    if (targetStatus && task.status !== targetStatus) {
      try {
        // Mettre à jour le statut de la tâche
        const updated = await tasksAPI.update(taskId, {
          status: targetStatus,
        });
        const { syncReminderAfterUpdate } = await import('@/lib/electronReminders');
        syncReminderAfterUpdate(updated);

        toast({
          title: 'Tâche déplacée',
          description: `La tâche a été déplacée vers "${targetColumn?.title ?? ''}"`,
        });

        // Rafraîchir les tâches
        onTasksChange();
      } catch (error) {
        console.error('Erreur lors du déplacement de la tâche:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de déplacer la tâche',
          variant: 'destructive',
        });
      }
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 h-[80vh] overflow-x-auto pb-4">
        {columns.map((column) => (
          <SortableContext
            key={column.id}
            id={column.id}
            items={tasksByColumn[column.id]?.map((t) => t.id.toString()) || []}
            strategy={verticalListSortingStrategy}
          >
            <KanbanColumn
              id={column.id}
              title={column.title}
              status={'status' in column ? column.status : undefined}
              tasks={tasksByColumn[column.id] || []}
              onTaskClick={onTaskClick}
              onTaskDelete={onTaskDelete}
              onAddCard={onAddCard}
              isDoneColumn={'status' in column && column.status === 'done'}
            />
          </SortableContext>
        ))}
      </div>

      <DragOverlay>
        {activeTask ? (
          <div className="opacity-95 rotate-1 shadow-xl">
            <KanbanCard
              task={activeTask}
              onClick={() => {}}
              onDelete={() => {}}
              isDone={activeTask.status === 'done'}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
