'use client';

import { Task } from '@/types/task';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { TagSelector } from '@/components/tags/TagSelector';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface TaskFormProps {
  task?: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: {
    title: string;
    description?: string;
    status: Task['status'];
    priority: Task['priority'];
    dueDate?: string;
    tagIds?: number[];
  }) => Promise<void>;
}

const taskSchema = Yup.object().shape({
  title: Yup.string()
    .required('Le titre est requis')
    .min(3, 'Le titre doit contenir au moins 3 caractères')
    .max(200, 'Le titre ne peut pas dépasser 200 caractères'),
  description: Yup.string().max(1000, 'La description ne peut pas dépasser 1000 caractères'),
  status: Yup.string().oneOf(['todo', 'in-progress', 'done']).required('Le statut est requis'),
  priority: Yup.string()
    .oneOf(['low', 'normal', 'high', 'urgent'])
    .required('La priorité est requise'),
  dueDate: Yup.date().nullable(),
});

export function TaskForm({ task, open, onOpenChange, onSubmit }: TaskFormProps) {
  const isEditing = !!task;
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>(
    task?.tags?.map(tag => tag.id) || []
  );

  const formik = useFormik({
    initialValues: {
      title: task?.title || '',
      description: task?.description || '',
      status: (task?.status || 'todo') as Task['status'],
      priority: (task?.priority || 'normal') as Task['priority'],
      dueDate: task?.dueDate ? new Date(task.dueDate) : null as Date | null,
    },
    validationSchema: taskSchema,
    enableReinitialize: true,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        await onSubmit({
          title: values.title,
          description: values.description || undefined,
          status: values.status,
          priority: values.priority,
          dueDate: values.dueDate ? values.dueDate.toISOString() : undefined,
          tagIds: selectedTagIds.length > 0 ? selectedTagIds : undefined,
        });
        formik.resetForm();
        setSelectedTagIds([]);
        onOpenChange(false);
      } catch (error) {
        console.error('Error submitting task:', error);
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Modifier la tâche' : 'Nouvelle tâche'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Modifiez les informations de la tâche ci-dessous.'
              : 'Remplissez les informations pour créer une nouvelle tâche.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={formik.handleSubmit} className="space-y-4">
          {/* Titre */}
          <div className="space-y-2">
            <Label htmlFor="title">Titre *</Label>
            <Input
              id="title"
              name="title"
              value={formik.values.title}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              placeholder="Ex: Réviser le code"
              className={cn(
                formik.touched.title && formik.errors.title && 'border-red-500'
              )}
            />
            {formik.touched.title && formik.errors.title && (
              <p className="text-sm text-red-500">{formik.errors.title}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formik.values.description}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              placeholder="Ajoutez une description détaillée..."
              rows={30}
              className={cn(
                "min-h-[150px]",
                formik.touched.description && formik.errors.description && 'border-red-500'
              )}
            />
            {formik.touched.description && formik.errors.description && (
              <p className="text-sm text-red-500">{formik.errors.description}</p>
            )}
          </div>

          {/* Statut et Priorité */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Statut *</Label>
              <Select
                value={formik.values.status}
                onValueChange={(value) => formik.setFieldValue('status', value)}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">À faire</SelectItem>
                  <SelectItem value="in-progress">En cours</SelectItem>
                  <SelectItem value="done">Terminé</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priorité *</Label>
              <Select
                value={formik.values.priority}
                onValueChange={(value) => formik.setFieldValue('priority', value)}
              >
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Basse</SelectItem>
                  <SelectItem value="normal">Normale</SelectItem>
                  <SelectItem value="high">Haute</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <TagSelector
              selectedTagIds={selectedTagIds}
              onSelectionChange={setSelectedTagIds}
            />
          </div>

          {/* Date d'échéance */}
          <div className="space-y-2">
            <Label>Date d&apos;échéance</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !formik.values.dueDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formik.values.dueDate ? (
                    format(formik.values.dueDate, 'PPP', { locale: fr })
                  ) : (
                    <span>Choisir une date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formik.values.dueDate || undefined}
                  onSelect={(date) => formik.setFieldValue('dueDate', date || null)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                formik.resetForm();
                onOpenChange(false);
              }}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={formik.isSubmitting}>
              {formik.isSubmitting
                ? 'Enregistrement...'
                : isEditing
                  ? 'Enregistrer'
                  : 'Créer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

