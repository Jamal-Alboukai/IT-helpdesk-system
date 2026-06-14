import api from './api';

export interface NotificationItem {
  id: string;
  message: string;
  ticketId: string | null;
  ticketReference: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export const notificationService = {
  getMyNotifications: async (): Promise<NotificationItem[]> => {
    const response = await api.get('/notification');
    return response.data;
  },

  getUnreadCount: async (): Promise<number> => {
    const response = await api.get('/notification/unread-count');
    return response.data.count;
  },

  markAsRead: async (id: string): Promise<void> => {
    await api.put(`/notification/${id}/read`);
  },

  markAllAsRead: async (): Promise<void> => {
    await api.put('/notification/read-all');
  },
};