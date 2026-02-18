'use client';

import { useDroppable } from '@dnd-kit/core';
import { Task } from '@/types/task';
import { KanbanCard } from './KanbanCard';
import { cn } from '@/lib/utils';
import { Plus, MoreVertical, MoreHorizontal } from 'lucide-react';
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
  /** Défini pour les colonnes par statut (À faire, En cours, Terminé) ; absent pour "Liste des tâches" */
  status?: Task['status'];
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
        'flex flex-col h-full w-[300px] shrink-0 rounded-sm overflow-hidden',
        'bg-primary border border-primary/80 transition-colors',
        isOver && 'ring-2 ring-primary ring-offset-2 ring-offset-primary/20',
        className
      )}
    >
      {/* En-tête colonne — fond gris foncé, texte blanc (style image) */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-primary-foreground/20 shrink-0">
        <h3 className="font-semibold text-sm uppercase tracking-wide text-primary-foreground">
          {title}
        </h3>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/20 cursor-pointer"
                aria-label="Options de la colonne"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-primary border-primary/80">
              <DropdownMenuItem className="cursor-pointer text-primary-foreground focus:bg-primary-foreground/20 focus:text-primary-foreground">
                Renommer
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer text-primary-foreground focus:bg-primary-foreground/20 focus:text-primary-foreground">
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
              className="w-full h-24 border border-dashed border-primary-foreground/30 text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10 hover:border-primary-foreground/50 rounded-lg cursor-pointer transition-colors"
              onClick={onAddCard}
            >
              <Plus className="h-5 w-5 mr-2" />
              Ajouter une carte
            </Button>
          ) : (
            <div className="flex items-center justify-center h-24 text-sm text-primary-foreground/60">
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
        <div className="p-3 border-t border-primary-foreground/20 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10 cursor-pointer"
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
