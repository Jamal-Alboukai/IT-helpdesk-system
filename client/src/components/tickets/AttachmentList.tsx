import { useState, useEffect } from 'react';
import { attachmentService, Attachment } from '../../services/attachmentService';
import api from '../../services/api';

interface AttachmentListProps {
  ticketId: string;
}

export default function AttachmentList({ ticketId }: AttachmentListProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAttachments();
  }, [ticketId]);

  async function loadAttachments() {
    try {
      const result = await attachmentService.getTicketAttachments(ticketId);
      setAttachments(result);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload(attachment: Attachment) {
    try {
      const response = await api.get(
        `/attachment/download/${attachment.id}`,
        { responseType: 'blob' }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', attachment.fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Failed to download file');
    }
  }

  if (loading || attachments.length === 0) return null;

  return (
    <div className="bg-gray-800 rounded-xl p-5">
      <h2 className="text-sm font-medium text-gray-400 mb-3">
        Attachments ({attachments.length})
      </h2>
      <div className="space-y-2">
        {attachments.map((attachment) => (
          <div
            key={attachment.id}
            className="flex items-center justify-between
              p-3 bg-gray-700/50 rounded-lg border border-gray-700"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">
                {attachment.isImage ? '🖼️' : '📄'}
              </span>
              <div>
                <p className="text-white text-sm font-medium">
                  {attachment.fileName}
                </p>
                <p className="text-gray-500 text-xs">
                  {attachmentService.formatFileSize(attachment.fileSize)}
                  {' · '}
                  {attachment.uploadedBy}
                  {' · '}
                  {new Date(attachment.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Preview image inline */}
              {attachment.isImage && (
                <button
                  onClick={() => window.open(
                    `${api.defaults.baseURL}/attachment/download/${attachment.id}`,
                    '_blank'
                  )}
                  className="text-gray-400 hover:text-white text-xs transition"
                >
                  Preview
                </button>
              )}
              <button
                onClick={() => handleDownload(attachment)}
                className="px-3 py-1 bg-blue-600/20 hover:bg-blue-600/30
                  text-blue-400 border border-blue-500/30
                  text-xs font-medium rounded-lg transition"
              >
                Download
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}