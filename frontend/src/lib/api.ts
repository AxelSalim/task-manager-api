/**
 * Configuration de l'API et fonctions utilitaires pour les requêtes
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

/**
 * Obtenir le token JWT depuis le localStorage
 */
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

/**
 * Définir le token JWT dans le localStorage
 */
export function setAuthToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('token', token);
}

/**
 * Supprimer le token JWT du localStorage
 */
export function removeAuthToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('token');
}

/**
 * Fonction helper pour faire des requêtes API
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erreur serveur' }));
    throw new Error(error.message || `Erreur ${response.status}`);
  }

  return response.json();
}

/**
 * Requêtes API pour l'authentification
 */
export const authAPI = {
  register: async (data: {
    name: string;
    email: string;
    password: string;
    consentPrivacyPolicy: boolean;
    consentTermsOfService: boolean;
  }) => {
    return apiRequest<{ code: number; data: any; message: string }>('/api/users/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  login: async (email: string, password: string) => {
    const response = await apiRequest<{
      code: number;
      message: string;
      token: string;
      user: { id: number; name: string; email: string; avatar: string | null };
    }>('/api/users/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.token) {
      setAuthToken(response.token);
    }

    return response;
  },

  logout: () => {
    removeAuthToken();
  },

  getMe: async () => {
    return apiRequest<{
      code: number;
      data: { id: number; name: string; email: string; avatar: string | null };
      message: string;
    }>('/api/users/me');
  },
};

/**
 * Requêtes API pour les tâches
 */
export const tasksAPI = {
  getAll: async () => {
    return apiRequest<{
      code: number;
      data: Array<{
        id: number;
        title: string;
        description: string | null;
        status: string;
        priority: string;
        dueDate: string | null;
        userId: number;
        createdAt: string;
        updatedAt: string;
      }>;
      message: string;
    }>('/api/tasks');
  },

  getById: async (id: number) => {
    return apiRequest<{
      code: number;
      data: any;
      message: string;
    }>(`/api/tasks/${id}`);
  },

  create: async (data: {
    title: string;
    description?: string;
    status?: string;
    priority?: string;
    dueDate?: string;
  }) => {
    return apiRequest<{
      code: number;
      data: any;
      message: string;
    }>('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: number, data: {
    title?: string;
    description?: string;
    status?: string;
    priority?: string;
    dueDate?: string;
  }) => {
    return apiRequest<{
      code: number;
      data: any;
      message: string;
    }>(`/api/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: number) => {
    return apiRequest<{
      code: number;
      message: string;
    }>(`/api/tasks/${id}`, {
      method: 'DELETE',
    });
  },
};

