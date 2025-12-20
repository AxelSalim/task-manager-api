'use client';

import useSWR from 'swr';
import { tasksAPI } from '@/lib/api';

export function useTasks() {
  const { data, error, isLoading, mutate } = useSWR(
    '/api/tasks',
    () => tasksAPI.getAll(),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  return {
    tasks: data?.data || [],
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
    task: data?.data || null,
    isLoading,
    isError: error,
    mutate,
  };
}

