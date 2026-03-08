'use client';

import { useState } from 'react';
import { useTasks } from '@/hooks/useTasks';
import { Task } from '@/types/task';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { CreateTaskDialog } from '@/components/tasks/CreateTaskDialog';
import { EditTaskDialog } from '@/components/tasks/EditTaskDialog';
import { DeleteTaskDialog } from '@/components/tasks/DeleteTaskDialog';
import { tasksAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { RepeatPattern } from '@/components/tasks/RepeatSelector';

function KanbanPage() {
  const { tasks, isLoading, mutate } = useTasks();
  const { toast } = useToast();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  const handleTaskClick = (task: Task) => {
    setEditingTask(task);
    setEditDialogOpen(true);
  };

  const handleOpenDeleteDialog = (taskId: number) => {
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      setTaskToDelete(task);
      setDeleteDialogOpen(true);
    }
  };

  const handleCreateSubmit = async (values: {
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
      await tasksAPI.create({
        ...values,
        tagIds: values.tagIds,
        estimatedMinutes: values.estimatedMinutes,
      });
      toast({
        title: 'Tâche créée',
        description: 'La tâche a été créée avec succès.',
      });
      mutate();
      setCreateDialogOpen(false);
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue',
        variant: 'destructive',
      });
    }
  };

  const handleEditSubmit = async (values: {
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
    if (!editingTask) return;
    try {
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
      mutate();
      setEditDialogOpen(false);
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
          onTaskDelete={handleOpenDeleteDialog}
          onTasksChange={mutate}
          onAddCard={() => setCreateDialogOpen(true)}
        />
      </div>

      <CreateTaskDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSubmit={handleCreateSubmit}
      />
      <EditTaskDialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) setEditingTask(null);
        }}
        task={editingTask}
        onSubmit={handleEditSubmit}
      />
    </div>
  );
}

export default KanbanPage;
