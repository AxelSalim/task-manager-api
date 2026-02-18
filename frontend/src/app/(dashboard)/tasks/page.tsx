'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTasks } from '@/hooks/useTasks';
import { TaskList } from '@/components/tasks/TaskList';
import { TaskForm } from '@/components/tasks/TaskForm';
import { Task } from '@/types/task';
import { Tag } from '@/types/tag';
import { RepeatPattern } from '@/components/tasks/RepeatSelector';
import { tasksAPI, tagsAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TagBadge } from '@/components/tags/TagBadge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Plus, Filter, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type FilterType = 'all' | 'todo' | 'in-progress' | 'done';
type SortType = 'date-asc' | 'date-desc' | 'priority-asc' | 'priority-desc' | 'title-asc';

export default function TasksPage() {
  const searchParams = useSearchParams();
  const { tasks, isLoading, mutate } = useTasks();
  const { toast } = useToast();
  
  const [filter, setFilter] = useState<FilterType>(
    (searchParams.get('filter') as FilterType) || 'all'
  );
  const [sort, setSort] = useState<SortType>('date-desc');
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [isTagFilterOpen, setIsTagFilterOpen] = useState(false);

  // Charger les tags
  useEffect(() => {
    const loadTags = async () => {
      try {
        const tags = await tagsAPI.getAll();
        setTags(tags);
      } catch (error) {
        console.error('Erreur lors du chargement des tags:', error);
      }
    };
    loadTags();
  }, []);

  // Filtrer les tâches
  const filteredTasks = useMemo(() => {
    let result = [...tasks];

    // Appliquer le filtre de statut
    if (filter !== 'all') {
      result = result.filter((task) => task.status === filter);
    }

    // Appliquer le filtre par tag
    if (selectedTagIds.length > 0) {
      result = result.filter((task) => {
        if (!task.tags || task.tags.length === 0) return false;
        return selectedTagIds.some(tagId => 
          task.tags?.some(tag => tag.id === tagId)
        );
      });
    }

    // Appliquer le tri
    result.sort((a, b) => {
      switch (sort) {
        case 'date-asc':
          const dateA = a.dueDate ? new Date(a.dueDate).getTime() : 0;
          const dateB = b.dueDate ? new Date(b.dueDate).getTime() : 0;
          return dateA - dateB;
        case 'date-desc':
          const dateA2 = a.dueDate ? new Date(a.dueDate).getTime() : 0;
          const dateB2 = b.dueDate ? new Date(b.dueDate).getTime() : 0;
          return dateB2 - dateA2;
        case 'priority-asc':
          const priorityOrder = { low: 1, normal: 2, high: 3, urgent: 4 };
          const priorityA = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
          const priorityB = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
          return priorityA - priorityB;
        case 'priority-desc':
          const priorityOrder2 = { low: 1, normal: 2, high: 3, urgent: 4 };
          const priorityA2 = priorityOrder2[a.priority as keyof typeof priorityOrder2] || 0;
          const priorityB2 = priorityOrder2[b.priority as keyof typeof priorityOrder2] || 0;
          return priorityB2 - priorityA2;
        case 'title-asc':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    return result;
  }, [tasks, filter, sort, selectedTagIds]);

  const handleTagToggle = (tagId: number) => {
    if (selectedTagIds.includes(tagId)) {
      setSelectedTagIds(selectedTagIds.filter(id => id !== tagId));
    } else {
      setSelectedTagIds([...selectedTagIds, tagId]);
    }
  };

  const clearTagFilter = () => {
    setSelectedTagIds([]);
  };

  const handleToggle = async (taskId: number) => {
    try {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;

      const newStatus = task.status === 'done' ? 'todo' : 'done';
      await tasksAPI.update(taskId, { status: newStatus });
      mutate();
      
      toast({
        title: 'Tâche mise à jour',
        description: `La tâche a été marquée comme ${newStatus === 'done' ? 'terminée' : 'à faire'}.`,
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour la tâche.',
        variant: 'destructive',
      });
    }
  };

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setIsFormOpen(true);
  };

  const handleCreate = () => {
    setEditingTask(null);
    setIsFormOpen(true);
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
      toast({
        title: 'Erreur',
        description: editingTask
          ? 'Impossible de mettre à jour la tâche.'
          : 'Impossible de créer la tâche.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const handleDelete = async (taskId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) {
      return;
    }

    try {
      await tasksAPI.delete(taskId);
      mutate();
      
      toast({
        title: 'Tâche supprimée',
        description: 'La tâche a été supprimée avec succès.',
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer la tâche.',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateSubtasks = async (taskId: number, subtasks: Task['subtasks']) => {
    try {
      await tasksAPI.updateSubtasks(taskId, subtasks || []);
      mutate();
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour les sous-tâches.',
        variant: 'destructive',
      });
    }
  };

  const stats = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter((t) => t.status === 'done').length;
    const inProgress = tasks.filter((t) => t.status === 'in-progress').length;
    const todo = tasks.filter((t) => t.status === 'todo').length;

    return { total, done, inProgress, todo };
  }, [tasks]);

  return (
    <div className="space-y-5">
      {/* Header type Blitzit: titre + progression X/Y DONE + CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-baseline gap-3 flex-wrap">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {filter === 'all' ? 'Mes tâches' : filter === 'done' ? 'Terminées' : filter === 'todo' ? 'À faire' : 'En cours'}
          </h1>
          <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
            {stats.done}/{stats.total} terminées
          </span>
        </div>
        <Button
          onClick={handleCreate}
          className="min-h-10 cursor-pointer transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 shrink-0"
        >
          <Plus className="h-4 w-4 mr-2 shrink-0" />
          Nouvelle tâche
        </Button>
      </div>

      {/* Filtres compacts (une ligne, style Blitzit) */}
      <div className="flex items-center gap-3 flex-wrap">
        <Select value={filter} onValueChange={(value) => setFilter(value as FilterType)}>
          <SelectTrigger className="w-[160px] h-9 text-sm">
            <SelectValue placeholder="Filtrer" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes</SelectItem>
            <SelectItem value="todo">À faire</SelectItem>
            <SelectItem value="in-progress">En cours</SelectItem>
            <SelectItem value="done">Terminées</SelectItem>
          </SelectContent>
        </Select>

        {/* Filtre par tag */}
        <Popover open={isTagFilterOpen} onOpenChange={setIsTagFilterOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5 h-9 cursor-pointer">
              <Filter className="h-3.5 w-3.5 shrink-0" />
              Tags
              {selectedTagIds.length > 0 && (
                <span className="ml-1 bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                  {selectedTagIds.length}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="start">
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Filtrer par tag</Label>
                {selectedTagIds.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearTagFilter}
                    className="h-7 text-xs"
                  >
                    Réinitialiser
                  </Button>
                )}
              </div>
              {tags.length === 0 ? (
                <div className="text-sm text-muted-foreground py-4 text-center">
                  Aucun tag disponible
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {tags.map(tag => (
                    <div
                      key={tag.id}
                      className="flex items-center space-x-2 p-2 rounded-md hover:bg-accent cursor-pointer"
                      onClick={() => handleTagToggle(tag.id)}
                    >
                      <Checkbox
                        checked={selectedTagIds.includes(tag.id)}
                        onCheckedChange={() => handleTagToggle(tag.id)}
                      />
                      <TagBadge tag={tag} variant="outline" size="sm" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* Tags sélectionnés */}
        {selectedTagIds.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            {tags
              .filter(tag => selectedTagIds.includes(tag.id))
              .map(tag => (
                <TagBadge
                  key={tag.id}
                  tag={tag}
                  onRemove={() => handleTagToggle(tag.id)}
                  size="sm"
                />
              ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={clearTagFilter}
              className="h-7 text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Tout effacer
            </Button>
          </div>
        )}

        <Select value={sort} onValueChange={(value) => setSort(value as SortType)}>
          <SelectTrigger className="w-[160px] h-9 text-sm">
              <SelectValue placeholder="Trier" />
            </SelectTrigger>
          <SelectContent>
            <SelectItem value="date-desc">Date (récent)</SelectItem>
            <SelectItem value="date-asc">Date (ancien)</SelectItem>
            <SelectItem value="priority-desc">Priorité (haute)</SelectItem>
            <SelectItem value="priority-asc">Priorité (basse)</SelectItem>
            <SelectItem value="title-asc">Titre (A-Z)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Task List */}
      <TaskList
        tasks={filteredTasks}
        isLoading={isLoading}
        onToggle={handleToggle}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onUpdateSubtasks={handleUpdateSubtasks}
      />

      {/* Task Form Modal */}
      <TaskForm
        task={editingTask}
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleFormSubmit}
      />
    </div>
  );
}
