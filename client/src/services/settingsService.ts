import api from './api';

// ─── Types ────────────────────────────────────────────────────

export interface CategoryDetail {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
}

export interface CreateCategoryRequest {
  name: string;
  description?: string;
}

export interface UpdateCategoryRequest {
  name?: string;
  description?: string;
  isActive?: boolean;
}

export interface PriorityDetail {
  id: string;
  name: string;
  displayOrder: number;
  isActive: boolean;
}

export interface CreatePriorityRequest {
  name: string;
  displayOrder: number;
}

export interface UpdatePriorityRequest {
  name?: string;
  displayOrder?: number;
  isActive?: boolean;
}

export interface StatusDetail {
  id: string;
  name: string;
  displayOrder: number;
  isActive: boolean;
}

// ─── Service ──────────────────────────────────────────────────

export const settingsService = {
  // ─── Categories ─────────────────────────────────────────────
  getCategories: async (): Promise<CategoryDetail[]> => {
    const response = await api.get('/settings/categories');
    return response.data;
  },

  createCategory: async (
    data: CreateCategoryRequest
  ): Promise<CategoryDetail> => {
    const response = await api.post('/settings/categories', data);
    return response.data;
  },

  updateCategory: async (
    id: string,
    data: UpdateCategoryRequest
  ): Promise<CategoryDetail> => {
    const response = await api.put(`/settings/categories/${id}`, data);
    return response.data;
  },

  // ─── Priorities ─────────────────────────────────────────────
  getPriorities: async (): Promise<PriorityDetail[]> => {
    const response = await api.get('/settings/priorities');
    return response.data;
  },

  createPriority: async (
    data: CreatePriorityRequest
  ): Promise<PriorityDetail> => {
    const response = await api.post('/settings/priorities', data);
    return response.data;
  },

  updatePriority: async (
    id: string,
    data: UpdatePriorityRequest
  ): Promise<PriorityDetail> => {
    const response = await api.put(`/settings/priorities/${id}`, data);
    return response.data;
  },

  // ─── Statuses (read only) ────────────────────────────────────
  getStatuses: async (): Promise<StatusDetail[]> => {
    const response = await api.get('/settings/statuses');
    return response.data;
  },
};