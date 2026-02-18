'use client';

import { useState } from 'react';
import { useTasks } from '@/hooks/useTasks';
import { Task } from '@/types/task';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { TaskForm } from '@/components/tasks/TaskForm';
import { tasksAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { RepeatPattern } from '@/components/tasks/RepeatSelector';

function KanbanPage() {
  const { tasks, isLoading, mutate } = useTasks();
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const handleTaskClick = (task: Task) => {
    setEditingTask(task);
    setIsFormOpen(true);
  };

  const handleTaskDelete = async (taskId: number) => {
    try {
      await tasksAPI.delete(taskId);
      toast({
        title: 'Tâche supprimée',
        description: 'La tâche a été supprimée avec succès.',
      });
      mutate();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer la tâche',
        variant: 'destructive',
      });
    }
  };

  const handleFormSubmit = async (values: {
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
  }) => {
    try {
      if (editingTask) {
        await tasksAPI.update(editingTask.id, {
          ...values,
          tagIds: values.tagIds,
          estimatedMinutes: values.estimatedMinutes,
          spentMinutes: values.spentMinutes,
        });
        toast({
          title: 'Tâche mise à jour',
          description: 'La tâche a été mise à jour avec succès.',
        });
      } else {
        await tasksAPI.create({
          ...values,
          tagIds: values.tagIds,
          estimatedMinutes: values.estimatedMinutes,
        });
        toast({
          title: 'Tâche créée',
          description: 'La tâche a été créée avec succès.',
        });
      }
      mutate();
      setIsFormOpen(false);
      setEditingTask(null);
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Tableau Kanban */}
      <div className="flex-1 overflow-hidden">
        <KanbanBoard
          tasks={tasks}
          onTaskClick={handleTaskClick}
          onTaskDelete={handleTaskDelete}
          onTasksChange={mutate}
          onAddCard={() => {
            setEditingTask(null);
            setIsFormOpen(true);
          }}
        />
      </div>

      {/* Formulaire de tâche */}
      <TaskForm
        task={editingTask}
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) {
            setEditingTask(null);
          }
        }}
        onSubmit={handleFormSubmit}
      />
    </div>
  );
}

export default KanbanPage;
