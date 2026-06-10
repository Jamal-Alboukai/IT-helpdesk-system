import api from './api';

// ─── Types ────────────────────────────────────────────────────
export interface LookupItem {
  id: string;
  name: string;
}

export interface TicketListItem {
  id: string;
  referenceNumber: string;
  title: string;
  category: string;
  priority: string;
  status: string;
  createdBy: string;
  assignedTo: string | null;
  escalationRequested: boolean;
  createdAt: string;
  dueAt: string | null;
}

export interface TicketDetail {
  id: string;
  referenceNumber: string;
  title: string;
  description: string;
  category: string;
  categoryId: string;
  priority: string;
  priorityId: string;
  status: string;
  statusId: string;
  createdBy: string;
  createdById: string;
  assignedTo: string | null;
  assignedToId: string | null;
  resolvedBy: string | null;
  closedBy: string | null;
  escalationRequested: boolean;
  escalationNote: string | null;
  dueAt: string | null;
  resolvedAt: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface TicketFilter {
  search?: string;
  categoryId?: string;
  priorityId?: string;
  statusId?: string;
  escalationRequested?: boolean;
  page?: number;
  pageSize?: number;
}

export interface CreateTicketRequest {
  title: string;
  description: string;
  categoryId: string;
  priorityId: string;
  dueAt?: string;
}

export interface UpdateTicketRequest {
  title?: string;
  description?: string;
  categoryId?: string;
  priorityId?: string;
  statusId?: string;
  assignedToId?: string;
  dueAt?: string;
  escalationRequested?: boolean;
  escalationNote?: string;
}

// ─── Service ──────────────────────────────────────────────────
export const ticketService = {
  getTickets: async (
    filter: TicketFilter = {}
  ): Promise<PaginatedResponse<TicketListItem>> => {
    const params = new URLSearchParams();
    if (filter.search) params.append('search', filter.search);
    if (filter.categoryId) params.append('categoryId', filter.categoryId);
    if (filter.priorityId) params.append('priorityId', filter.priorityId);
    if (filter.statusId) params.append('statusId', filter.statusId);
    if (filter.escalationRequested !== undefined)
      params.append('escalationRequested', String(filter.escalationRequested));
    params.append('page', String(filter.page || 1));
    params.append('pageSize', String(filter.pageSize || 10));

    const response = await api.get(`/ticket?${params.toString()}`);
    return response.data;
  },

  getTicketById: async (id: string): Promise<TicketDetail> => {
    const response = await api.get(`/ticket/${id}`);
    return response.data;
  },

  createTicket: async (data: CreateTicketRequest): Promise<TicketDetail> => {
    const response = await api.post('/ticket', data);
    return response.data;
  },

  updateTicket: async (
    id: string,
    data: UpdateTicketRequest
  ): Promise<TicketDetail> => {
    const response = await api.put(`/ticket/${id}`, data);
    return response.data;
  },

  deleteTicket: async (id: string): Promise<void> => {
    await api.delete(`/ticket/${id}`);
  },

  assignTicket: async (
    id: string,
    assignedToId: string
  ): Promise<TicketDetail> => {
    const response = await api.post(`/ticket/${id}/assign`, { assignedToId });
    return response.data;
  },

  requestEscalation: async (
    id: string,
    escalationNote: string
  ): Promise<TicketDetail> => {
    const response = await api.post(`/ticket/${id}/escalate`, { escalationNote });
    return response.data;
  },

  getCategories: async (): Promise<LookupItem[]> => {
    const response = await api.get('/categories');
    return response.data;
  },

  getPriorities: async (): Promise<LookupItem[]> => {
    const response = await api.get('/priorities');
    return response.data;
  },

  getStatuses: async (): Promise<LookupItem[]> => {
    const response = await api.get('/statuses');
    return response.data;
  },
};