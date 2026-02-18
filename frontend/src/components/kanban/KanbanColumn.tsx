'use client';

import { useDroppable } from '@dnd-kit/core';
import { Task } from '@/types/task';
import { KanbanCard } from './KanbanCard';
import { cn } from '@/lib/utils';
import { Plus, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface KanbanColumnProps {
  id: string;
  title: string;
  status: Task['status'];
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onTaskDelete: (taskId: number) => void;
  onAddCard?: () => void;
  isDoneColumn?: boolean;
  className?: string;
}

export function KanbanColumn({
  id,
  title,
  tasks,
  onTaskClick,
  onTaskDelete,
  onAddCard,
  isDoneColumn,
  className,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex flex-col h-full min-w-[280px] max-w-[320px] rounded-xl overflow-hidden',
        'bg-slate-800/90 border border-slate-700/80 transition-colors',
        isOver && 'ring-2 ring-slate-500 ring-offset-2 ring-offset-slate-900',
        className
      )}
    >
      {/* En-tête colonne — fond gris foncé, texte blanc (style image) */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 shrink-0">
        <h3 className="font-semibold text-sm uppercase tracking-wide text-white">
          {title}
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-400 bg-slate-700/80 px-2 py-0.5 rounded">
            {tasks.length}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-700 cursor-pointer"
                aria-label="Options de la colonne"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
              <DropdownMenuItem className="cursor-pointer text-slate-200 focus:bg-slate-700 focus:text-white">
                Renommer
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer text-slate-200 focus:bg-slate-700 focus:text-white">
                Déplacer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Liste des cartes */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
        {tasks.length === 0 ? (
          onAddCard ? (
            <Button
              variant="ghost"
              className="w-full h-24 border border-dashed border-slate-600 text-slate-400 hover:text-slate-300 hover:bg-slate-700/50 hover:border-slate-500 rounded-lg cursor-pointer transition-colors"
              onClick={onAddCard}
            >
              <Plus className="h-5 w-5 mr-2" />
              Ajouter une carte
            </Button>
          ) : (
            <div className="flex items-center justify-center h-24 text-sm text-slate-500">
              Aucune tâche
            </div>
          )
        ) : (
          tasks.map((task) => (
            <KanbanCard
              key={task.id}
              task={task}
              onClick={() => onTaskClick(task)}
              onDelete={() => onTaskDelete(task.id)}
              isDone={isDoneColumn}
            />
          ))
        )}
      </div>

      {/* Pied de colonne — "+ Ajouter une carte" */}
      {onAddCard && (
        <div className="p-3 border-t border-slate-700/80 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 cursor-pointer"
            onClick={onAddCard}
          >
            <Plus className="h-4 w-4 mr-2" />
            Ajouter une carte
          </Button>
        </div>
      )}
    </div>
  );
}
