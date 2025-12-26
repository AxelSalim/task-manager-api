'use client';

import useSWR from 'swr';
import { tasksAPI } from '@/lib/api';
import { Task } from '@/types/task';

export function useTasks() {
  const { data, error, isLoading, mutate } = useSWR(
    '/api/tasks',
    () => tasksAPI.getAll(),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  // Type assertion pour les tâches
  // apiRequest retourne déjà directement les données, pas besoin de data.data
  const tasks = (data || []) as Task[];

  return {
    tasks,
    isLoading,
    isError: error,
    mutate,
  };
}

export function useTask(id: number | null) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `/api/tasks/${id}` : null,
    () => (id ? tasksAPI.getById(id) : null),
    {
      revalidateOnFocus: false,
    }
  );

  return {
    // apiRequest retourne déjà directement les données, pas besoin de data.data
    task: data || null,
    isLoading,
    isError: error,
    mutate,
  };
}

