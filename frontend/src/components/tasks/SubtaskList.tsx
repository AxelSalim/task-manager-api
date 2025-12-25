'use client';

import { useState } from 'react';
import { Check, Plus, X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

interface SubtaskListProps {
  subtasks: Subtask[];
  taskId: number;
  onUpdate: (subtasks: Subtask[]) => void;
  disabled?: boolean;
}

export function SubtaskList({ subtasks, taskId, onUpdate, disabled = false }: SubtaskListProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  const handleToggle = async (subtaskId: string) => {
    const updated = subtasks.map(st =>
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );
    onUpdate(updated);
  };

  const handleAdd = () => {
    if (!newSubtaskTitle.trim()) return;

    const newSubtask: Subtask = {
      id: `subtask-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: newSubtaskTitle.trim(),
      completed: false,
    };

    onUpdate([...subtasks, newSubtask]);
    setNewSubtaskTitle('');
    setIsAdding(false);
  };

  const handleDelete = (subtaskId: string) => {
    onUpdate(subtasks.filter(st => st.id !== subtaskId));
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAdd();
    } else if (e.key === 'Escape') {
      setIsAdding(false);
      setNewSubtaskTitle('');
    }
  };

  const completedCount = subtasks.filter(st => st.completed).length;
  const totalCount = subtasks.length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-2">
      {/* Header avec progression */}
      {subtasks.length > 0 && (
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>
            {completedCount} / {totalCount} complétées
          </span>
          <span className="font-medium">{progress}%</span>
        </div>
      )}

      {/* Liste des sous-tâches */}
      <div className="space-y-1">
        {subtasks.map((subtask) => (
          <div
            key={subtask.id}
            className={cn(
              'flex items-center gap-2 p-2 rounded-md hover:bg-slate-50 transition-colors',
              subtask.completed && 'opacity-60'
            )}
          >
            <Checkbox
              checked={subtask.completed}
              onCheckedChange={() => handleToggle(subtask.id)}
              disabled={disabled}
              className="shrink-0"
            />
            <span
              className={cn(
                'flex-1 text-sm',
                subtask.completed && 'line-through text-slate-500'
              )}
            >
              {subtask.title}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={() => handleDelete(subtask.id)}
              disabled={disabled}
            >
              <Trash2 className="h-3 w-3 text-slate-400" />
            </Button>
          </div>
        ))}
      </div>

      {/* Ajout de nouvelle sous-tâche */}
      {isAdding ? (
        <div className="flex items-center gap-2">
          <Input
            value={newSubtaskTitle}
            onChange={(e) => setNewSubtaskTitle(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Nouvelle sous-tâche..."
            className="h-8 text-sm"
            autoFocus
            disabled={disabled}
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={handleAdd}
            disabled={disabled || !newSubtaskTitle.trim()}
          >
            <Check className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => {
              setIsAdding(false);
              setNewSubtaskTitle('');
            }}
            disabled={disabled}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-slate-600 hover:text-slate-900"
          onClick={() => setIsAdding(true)}
          disabled={disabled}
        >
          <Plus className="h-4 w-4 mr-2" />
          Ajouter une sous-tâche
        </Button>
      )}
    </div>
  );
}

