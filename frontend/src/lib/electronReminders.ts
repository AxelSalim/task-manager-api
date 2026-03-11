/**
 * Synchronise les rappels avec le Planificateur Windows (Electron)
 * pour afficher des notifications même quand l'application est fermée.
 * No-op si on n'est pas dans Electron (navigateur).
 */

declare global {
  interface Window {
    electronAPI?: {
      registerReminder?: (payload: {
        taskId: number;
        reminderDate: string;
        title: string;
        body?: string;
      }) => Promise<{ ok: boolean; error?: string }>;
      unregisterReminder?: (payload: { taskId: number }) => Promise<{ ok: boolean; error?: string }>;
    };
  }
}

function getElectronAPI() {
  if (typeof window === 'undefined') return null;
  return window.electronAPI;
}

/**
 * Enregistre un rappel planifié (notification même app fermée — Windows).
 * À appeler après création d'une tâche avec reminderDate.
 */
export function syncReminderAfterCreate(task: {
  id: number;
  reminderDate: string | null;
  title: string;
  description?: string | null;
}): void {
  const api = getElectronAPI();
  if (!api?.registerReminder || !task.reminderDate) return;
  const body = task.description?.slice(0, 200) ?? '';
  api.registerReminder({
    taskId: task.id,
    reminderDate: task.reminderDate,
    title: task.title,
    body,
  }).catch(() => {});
}

/**
 * Met à jour ou supprime le rappel planifié après modification d'une tâche.
 * À appeler après mise à jour avec la tâche retournée par l'API.
 */
export function syncReminderAfterUpdate(task: {
  id: number;
  reminderDate: string | null;
  title: string;
  description?: string | null;
}): void {
  const api = getElectronAPI();
  if (!api) return;
  if (task.reminderDate) {
    const body = task.description?.slice(0, 200) ?? '';
    api.registerReminder({
      taskId: task.id,
      reminderDate: task.reminderDate,
      title: task.title,
      body,
    }).catch(() => {});
  } else {
    api.unregisterReminder({ taskId: task.id }).catch(() => {});
  }
}

/**
 * Supprime le rappel planifié après suppression d'une tâche.
 */
export function syncReminderAfterDelete(taskId: number): void {
  const api = getElectronAPI();
  if (!api?.unregisterReminder) return;
  api.unregisterReminder({ taskId }).catch(() => {});
}
