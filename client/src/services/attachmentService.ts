import api from './api';

export interface Attachment {
  id: string;
  fileName: string;
  fileSize: number;
  contentType: string;
  uploadedBy: string;
  createdAt: string;
  isImage: boolean;
}

export const attachmentService = {
  upload: async (
    file: File,
    ticketId?: string,
    commentId?: string
  ): Promise<Attachment> => {
    const formData = new FormData();
    formData.append('file', file);

    const params = new URLSearchParams();
    if (ticketId) params.append('ticketId', ticketId);
    if (commentId) params.append('commentId', commentId);

    const response = await api.post(
      `/attachment/upload?${params.toString()}`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  },

  getTicketAttachments: async (ticketId: string): Promise<Attachment[]> => {
    const response = await api.get(`/attachment/ticket/${ticketId}`);
    return response.data;
  },

  getDownloadUrl: (attachmentId: string): string => {
    return `${api.defaults.baseURL}/attachment/download/${attachmentId}`;
  },

  delete: async (attachmentId: string): Promise<void> => {
    await api.delete(`/attachment/${attachmentId}`);
  },

  formatFileSize: (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  },
};