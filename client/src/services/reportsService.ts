import api from './api';

export interface MonthlySummary {
  month: string;
  year: number;
  monthNumber: number;
  totalCreated: number;
  resolved: number;
  closed: number;
  escalated: number;
  avgResolutionHours: number;
}

export interface AgentPerformance {
  agentName: string;
  email: string;
  totalAssigned: number;
  resolved: number;
  closed: number;
  activeTickets: number;
  avgResolutionHours: number;
  resolutionRate: number;
}

export interface ReportsSummary {
  monthlySummary: MonthlySummary[];
  agentPerformance: AgentPerformance[];
  generatedAt: string;
}

export const reportsService = {
  getSummary: async (months = 12): Promise<ReportsSummary> => {
    const response = await api.get(`/reports/summary?months=${months}`);
    return response.data;
  },

  getMonthlySummary: async (months = 12): Promise<MonthlySummary[]> => {
    const response = await api.get(
      `/reports/monthly-summary?months=${months}`);
    return response.data;
  },

  getAgentPerformance: async (): Promise<AgentPerformance[]> => {
    const response = await api.get('/reports/agent-performance');
    return response.data;
  },
};