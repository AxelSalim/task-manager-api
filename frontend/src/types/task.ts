import { Tag } from './tag';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: number;
  title: string;
  description: string | null;
  status: 'todo' | 'in-progress' | 'done';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  dueDate: string | null;
  reminderDate: string | null;
  /** Durée estimée en minutes (type Blitzit "Est") */
  estimatedMinutes?: number | null;
  /** Temps passé en minutes (type Blitzit "Done") */
  spentMinutes?: number;
  repeatPattern?: {
    type: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
    interval?: number;
    daysOfWeek?: number[];
    endDate?: string;
    count?: number;
  } | null;
  subtasks?: Subtask[];
  tags?: Tag[];
  userId: number;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: number;
    name: string;
    email: string;
  } | null;
}

