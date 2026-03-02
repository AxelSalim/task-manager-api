/**
 * Configuration de l'API et fonctions utilitaires pour les requêtes
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * Construire l'URL complète d'un avatar depuis une URL relative
 */
export function getAvatarUrl(avatarUrl: string | null | undefined): string | undefined {
  if (!avatarUrl) return undefined;
  if (avatarUrl.startsWith('http')) return avatarUrl;
  return `${API_BASE_URL}${avatarUrl}`;
}

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
 * Interface standardisée pour les réponses API de succès
 */
export interface ApiSuccessResponse<T = unknown> {
  success: true;
  code: number;
  data: T;
  message: string;
}

/**
 * Interface standardisée pour les réponses API d'erreur
 */
export interface ApiErrorResponse {
  success: false;
  code: number;
  message: string;
  errors?: Record<string, string> | string[] | null;
}

/**
 * Type union pour les réponses API
 */
export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Classe d'erreur personnalisée pour les erreurs API
 */
export class ApiError extends Error {
  code: number;
  errors?: Record<string, string> | string[] | null;

  constructor(message: string, code: number = 500, errors?: Record<string, string> | string[] | null) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.errors = errors;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

/**
 * Fonction helper pour faire des requêtes API avec gestion standardisée des erreurs
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

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data: ApiResponse<T> = await response.json().catch(() => {
      // Si la réponse n'est pas du JSON valide
      throw new ApiError(
        'Réponse serveur invalide',
        500
      );
    });

    // Vérifier si c'est une réponse d'erreur standardisée
    if (!response.ok || (data as ApiErrorResponse).success === false) {
      const errorData = data as ApiErrorResponse;
      throw new ApiError(
        errorData.message || `Erreur ${response.status}`,
        errorData.code || response.status,
        errorData.errors
      );
    }

    // Retourner les données de la réponse de succès
    const successData = data as ApiSuccessResponse<T>;
    return successData.data;
  } catch (error) {
    // Si c'est déjà une ApiError, la relancer
    if (error instanceof ApiError) {
      throw error;
    }

    // Erreur réseau ou autre
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new ApiError(
        'Erreur de connexion au serveur. Vérifiez votre connexion internet.',
        0
      );
    }

    // Erreur inconnue
    throw new ApiError(
      error instanceof Error ? error.message : 'Une erreur inattendue s\'est produite',
      500
    );
  }
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
    return apiRequest<{ id: number; name: string; email: string; avatar: string | null }>('/api/users/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  login: async (email: string, password: string) => {
    const response = await apiRequest<{
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
    return apiRequest<{ id: number; name: string; email: string; avatar: string | null }>('/api/users/me');
  },

  forgotPassword: async (email: string) => {
    return apiRequest<{ message: string }>('/api/users/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  verifyOTP: async (email: string, otp: string) => {
    return apiRequest<{ message: string; reset_token: string }>('/api/users/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    });
  },

  resetPassword: async (resetToken: string, newPassword: string) => {
    return apiRequest<{ message: string }>('/api/users/reset-password', {
      method: 'POST',
      body: JSON.stringify({ reset_token: resetToken, new_password: newPassword }),
    });
  },
};

/**
 * Requêtes API pour les tâches
 */
export const tasksAPI = {
  getAll: async () => {
    return apiRequest<Array<{
      id: number;
      title: string;
      description: string | null;
      status: string;
      priority: string;
      dueDate: string | null;
      reminderDate: string | null;
      subtasks?: Array<{ id: string; title: string; completed: boolean }>;
      tags?: Array<{ id: number; name: string; color: string }>;
      userId: number;
      createdAt: string;
      updatedAt: string;
    }>>('/api/tasks');
  },

  getById: async (id: number) => {
    return apiRequest<{
      id: number;
      title: string;
      description: string | null;
      status: string;
      priority: string;
      dueDate: string | null;
      reminderDate: string | null;
      subtasks?: Array<{ id: string; title: string; completed: boolean }>;
      tags?: Array<{ id: number; name: string; color: string }>;
      userId: number;
      createdAt: string;
      updatedAt: string;
    }>(`/api/tasks/${id}`);
  },

  create: async (data: {
    title: string;
    description?: string;
    status?: string;
    priority?: string;
    dueDate?: string;
    reminderDate?: string;
    repeatPattern?: any;
    tagIds?: number[];
    estimatedMinutes?: number | null;
  }) => {
    return apiRequest<{
      id: number;
      title: string;
      description: string | null;
      status: string;
      priority: string;
      dueDate: string | null;
      reminderDate: string | null;
      subtasks?: Array<{ id: string; title: string; completed: boolean }>;
      tags?: Array<{ id: number; name: string; color: string }>;
      userId: number;
      createdAt: string;
      updatedAt: string;
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
    reminderDate?: string;
    repeatPattern?: any;
    tagIds?: number[];
    estimatedMinutes?: number | null;
    spentMinutes?: number;
  }) => {
    return apiRequest<{
      id: number;
      title: string;
      description: string | null;
      status: string;
      priority: string;
      dueDate: string | null;
      reminderDate: string | null;
      subtasks?: Array<{ id: string; title: string; completed: boolean }>;
      tags?: Array<{ id: number; name: string; color: string }>;
      userId: number;
      createdAt: string;
      updatedAt: string;
    }>(`/api/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: number) => {
    return apiRequest<null>(`/api/tasks/${id}`, {
      method: 'DELETE',
    });
  },
  updateSubtasks: async (id: number, subtasks: Array<{ id: string; title: string; completed: boolean }>) => {
    return apiRequest<{
      id: number;
      title: string;
      description: string | null;
      status: string;
      priority: string;
      dueDate: string | null;
      reminderDate: string | null;
      subtasks?: Array<{ id: string; title: string; completed: boolean }>;
      tags?: Array<{ id: number; name: string; color: string }>;
      userId: number;
      createdAt: string;
      updatedAt: string;
    }>(`/api/tasks/${id}/subtasks`, {
      method: 'PUT',
      body: JSON.stringify({ subtasks }),
    });
  },
};

/**
 * API pour les tags
 */
export const tagsAPI = {
  getAll: async () => {
    return apiRequest<Array<{
      id: number;
      name: string;
      color: string;
      userId: number;
      createdAt: string;
      updatedAt: string;
    }>>('/api/tags');
  },

  getById: async (id: number) => {
    return apiRequest<{
      id: number;
      name: string;
      color: string;
      userId: number;
      createdAt: string;
      updatedAt: string;
    }>(`/api/tags/${id}`);
  },

  create: async (data: {
    name: string;
    color?: string;
  }) => {
    return apiRequest<{
      id: number;
      name: string;
      color: string;
      userId: number;
      createdAt: string;
      updatedAt: string;
    }>('/api/tags', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: number, data: {
    name?: string;
    color?: string;
  }) => {
    return apiRequest<{
      id: number;
      name: string;
      color: string;
      userId: number;
      createdAt: string;
      updatedAt: string;
    }>(`/api/tags/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: number) => {
    return apiRequest<null>(`/api/tags/${id}`, {
      method: 'DELETE',
    });
  },
};

