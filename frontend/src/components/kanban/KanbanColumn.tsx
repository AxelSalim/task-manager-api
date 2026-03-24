'use client';

import { useDroppable } from '@dnd-kit/core';
import { Task } from '@/types/task';
import { KanbanCard } from './KanbanCard';
import { cn } from '@/lib/utils';
import { Plus, MoreHorizontal } from 'lucide-react';
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
  onAddCard?: () => void;
  isDoneColumn?: boolean;
  className?: string;
}

export function KanbanColumn({
  id,
  title,
  tasks,
  onTaskClick,
  onAddCard,
  isDoneColumn,
  className,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex flex-col h-full w-[300px] shrink-0 rounded-lg overflow-hidden',
        'bg-muted/50 dark:bg-muted/25 border border-border shadow-sm transition-colors',
        isOver && 'ring-2 ring-ring ring-offset-2 ring-offset-background',
        className
      )}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0 bg-background/70 dark:bg-background/40">
        <h3 className="font-semibold text-xs uppercase tracking-wide text-foreground">
          {title}
        </h3>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent cursor-pointer"
                aria-label="Options de la colonne"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="cursor-pointer">Renommer</DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">Déplacer</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Liste des cartes */}
      <div className="kanban-column-scroll flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
        {tasks.length === 0 ? (
          onAddCard ? (
            <Button
              variant="ghost"
              className="w-full h-24 border border-dashed border-border text-muted-foreground hover:text-foreground hover:bg-accent/50 hover:border-muted-foreground/40 rounded-lg cursor-pointer transition-colors"
              onClick={onAddCard}
            >
              <Plus className="h-5 w-5 mr-2" />
              Ajouter une carte
            </Button>
          ) : (
            <div className="flex items-center justify-center h-24 text-sm text-muted-foreground">
              Aucune tâche
            </div>
          )
        ) : (
          tasks.map((task) => (
            <KanbanCard
              key={task.id}
              task={task}
              onClick={() => onTaskClick(task)}
              isDone={isDoneColumn}
            />
          ))
        )}
      </div>

      {/* Pied de colonne — "+ Ajouter une carte" */}
      {onAddCard && (
        <div className="p-3 border-t border-border shrink-0 bg-background/40 dark:bg-background/20">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-accent cursor-pointer"
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
