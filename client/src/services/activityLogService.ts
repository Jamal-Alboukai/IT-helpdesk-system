import api from './api';

export interface ActivityLogEntry {
  id: string;
  action: string;
  oldValue: string | null;
  newValue: string | null;
  performedBy: string;
  performedById: string;
  performedByRole: string;
  ticketReference: string | null;
  ticketId: string | null;
  ticketTitle: string | null;
  createdAt: string;
}

export interface ActivityLogPaged {
  data: ActivityLogEntry[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ActivityLogFilter {
  search?: string;
  action?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  pageSize?: number;
}

export const activityLogService = {
  getLogs: async (
    filter: ActivityLogFilter = {}
  ): Promise<ActivityLogPaged> => {
    const params = new URLSearchParams();
    if (filter.search) params.append('search', filter.search);
    if (filter.action) params.append('action', filter.action);
    if (filter.fromDate) params.append('fromDate', filter.fromDate);
    if (filter.toDate) params.append('toDate', filter.toDate);
    params.append('page', String(filter.page || 1));
    params.append('pageSize', String(filter.pageSize || 20));

    const response = await api.get(`/logs?${params.toString()}`);
    return response.data;
  },

  getActionTypes: async (): Promise<string[]> => {
    const response = await api.get('/logs/action-types');
    return response.data.map((x: { action: string }) => x.action);
  },
};