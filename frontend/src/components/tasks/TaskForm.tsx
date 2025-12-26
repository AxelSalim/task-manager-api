'use client';

import { Task } from '@/types/task';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { TagSelector } from '@/components/tags/TagSelector';
import { RepeatSelector, RepeatPattern } from '@/components/tasks/RepeatSelector';
import { MarkdownEditor } from '@/components/markdown/MarkdownEditor';
import { CalendarIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

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
    reminderDate?: string;
    repeatPattern?: RepeatPattern;
    tagIds?: number[];
  }) => Promise<void>;
}

const taskSchema = Yup.object().shape({
  title: Yup.string().required('Le titre est requis').max(200, 'Le titre ne peut pas dépasser 200 caractères'),
  description: Yup.string().max(5000, 'La description ne peut pas dépasser 5000 caractères'),
});

export function TaskForm({ task, open, onOpenChange, onSubmit }: TaskFormProps) {
  const isEditing = !!task;
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>(
    task?.tags?.map(tag => tag.id) || []
  );
  const [repeatPattern, setRepeatPattern] = useState<RepeatPattern>(
    task?.repeatPattern || null
  );

  const formik = useFormik({
    initialValues: {
      title: task?.title || '',
      description: task?.description || '',
      status: (task?.status || 'todo') as Task['status'],
      priority: (task?.priority || 'normal') as Task['priority'],
      dueDate: task?.dueDate ? new Date(task.dueDate) : null as Date | null,
      reminderDate: task?.reminderDate ? new Date(task.reminderDate) : null as Date | null,
    },
    validationSchema: taskSchema,
    enableReinitialize: true,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      try {
        await onSubmit({
          title: values.title,
          description: values.description || undefined,
          status: values.status,
          priority: values.priority,
          dueDate: values.dueDate ? values.dueDate.toISOString() : undefined,
          reminderDate: values.reminderDate ? values.reminderDate.toISOString() : undefined,
          repeatPattern: repeatPattern || undefined,
          tagIds: selectedTagIds.length > 0 ? selectedTagIds : undefined,
        });
        resetForm();
        setSelectedTagIds([]);
        setRepeatPattern(null);
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
      <DialogContent className="sm:max-w-[950px] max-h-[95vh] overflow-y-auto">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-2xl font-bold">{isEditing ? 'Modifier la tâche' : 'Nouvelle tâche'}</DialogTitle>
          <DialogDescription className="text-base mt-2">
            {isEditing
              ? 'Modifiez les informations de la tâche ci-dessous.'
              : 'Remplissez les informations pour créer une nouvelle tâche.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={formik.handleSubmit} className="space-y-6">
          {/* Section 1: Informations de base */}
          <Card className="border-2">
            <CardContent className="pt-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">Informations de base</h3>
                  <p className="text-sm text-muted-foreground">Titre et description de la tâche</p>
                </div>
                
                <Separator />
                
                {/* Titre */}
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-medium">Titre *</Label>
                  <Input
                    id="title"
                    name="title"
                    value={formik.values.title}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder="Ex: Réviser le code"
                    className={cn(
                      "h-11 text-base",
                      formik.touched.title && formik.errors.title && 'border-red-500 focus-visible:ring-red-500'
                    )}
                  />
                  {formik.touched.title && formik.errors.title && (
                    <p className="text-sm text-red-500 mt-1.5 flex items-center gap-1">
                      <span className="text-red-500">•</span> {formik.errors.title}
                    </p>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium">Description</Label>
                  <MarkdownEditor
                    value={formik.values.description || ''}
                    onChange={(value) => formik.setFieldValue('description', value)}
                    placeholder="Ajoutez une description détaillée en Markdown...

Exemples de syntaxe :
- **Texte en gras**
- *Texte en italique*
- \`Code inline\`
- [Lien](https://example.com)
- - Liste à puces
- 1. Liste numérotée
- > Citation
- \`\`\`code block\`\`\`"
                    rows={16}
                    className={cn(
                      formik.touched.description && formik.errors.description && 'border-red-500'
                    )}
                  />
                  {formik.touched.description && formik.errors.description && (
                    <p className="text-sm text-red-500 mt-1.5 flex items-center gap-1">
                      <span className="text-red-500">•</span> {formik.errors.description}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Organisation */}
          <Card className="border-2">
            <CardContent className="pt-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">Organisation</h3>
                  <p className="text-sm text-muted-foreground">Statut, priorité et catégorisation</p>
                </div>
                
                <Separator />

                <div className="grid grid-cols-2 gap-6">
                  {/* Statut */}
                  <div className="space-y-2">
                    <Label htmlFor="status" className="text-sm font-medium">Statut *</Label>
                    <Select
                      value={formik.values.status}
                      onValueChange={(value) => formik.setFieldValue('status', value)}
                    >
                      <SelectTrigger id="status" className="h-11 text-base">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todo">À faire</SelectItem>
                        <SelectItem value="in-progress">En cours</SelectItem>
                        <SelectItem value="done">Terminé</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Priorité */}
                  <div className="space-y-2">
                    <Label htmlFor="priority" className="text-sm font-medium">Priorité *</Label>
                    <Select
                      value={formik.values.priority}
                      onValueChange={(value) => formik.setFieldValue('priority', value)}
                    >
                      <SelectTrigger id="priority" className="h-11 text-base">
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
                  <Label className="text-sm font-medium">Tags</Label>
                  <TagSelector
                    selectedTagIds={selectedTagIds}
                    onSelectionChange={setSelectedTagIds}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 3: Planification */}
          <Card className="border-2">
            <CardContent className="pt-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">Planification</h3>
                  <p className="text-sm text-muted-foreground">Dates et répétition</p>
                </div>
                
                <Separator />

                {/* Répétition */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Répétition</Label>
                  <RepeatSelector
                    value={repeatPattern}
                    onChange={setRepeatPattern}
                  />
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-6">
                  {/* Date d'échéance */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Date d&apos;échéance</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full justify-start text-left font-normal h-11 text-base',
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

                  {/* Date de rappel */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Date de rappel</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full justify-start text-left font-normal h-11 text-base',
                            !formik.values.reminderDate && 'text-muted-foreground'
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formik.values.reminderDate ? (
                            format(formik.values.reminderDate, 'PPP p', { locale: fr })
                          ) : (
                            <span>Choisir une date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formik.values.reminderDate || undefined}
                          onSelect={(date) => formik.setFieldValue('reminderDate', date || null)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <DialogFooter className="pt-4 mt-6 border-t bg-muted/30 -mx-6 -mb-6 px-6 pb-6">
            <div className="flex items-center justify-between w-full">
              <p className="text-sm text-muted-foreground">
                * Champs obligatoires
              </p>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => {
                    formik.resetForm();
                    setSelectedTagIds([]);
                    setRepeatPattern(null);
                    onOpenChange(false);
                  }}
                  className="min-w-[120px]"
                >
                  Annuler
                </Button>
                <Button 
                  type="submit" 
                  size="lg" 
                  disabled={formik.isSubmitting}
                  className="min-w-[160px]"
                >
                  {formik.isSubmitting
                    ? 'Enregistrement...'
                    : isEditing
                      ? 'Enregistrer'
                      : 'Créer la tâche'}
                </Button>
              </div>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
