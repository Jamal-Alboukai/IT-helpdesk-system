import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ticketService, Comment } from '../../services/ticketService';
import { attachmentService } from '../../services/attachmentService';

interface CommentSectionProps {
  ticketId: string;
  isClosed: boolean;
  canAddInternal: boolean;
}

// ─── Allowed file types for frontend validation ────────────────
const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf', 'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export default function CommentSection({
  ticketId,
  isClosed,
  canAddInternal
}: CommentSectionProps) {
  

  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // ─── File upload state ─────────────────────────────────────
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadComments();
  }, [ticketId]);

  async function loadComments() {
    setLoading(true);
    try {
      const result = await ticketService.getComments(ticketId);
      setComments(result);
    } catch {
      setError('Failed to load comments');
    } finally {
      setLoading(false);
    }
  }

  // ─── File selection handler ────────────────────────────────
  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    setFileError('');
    const file = e.target.files?.[0];
    if (!file) return;

    // Frontend validation
    if (!ALLOWED_TYPES.includes(file.type)) {
      setFileError('File type not allowed. Use JPG, PNG, PDF, DOC, DOCX, or XLSX');
      return;
    }
    if (file.size > MAX_SIZE) {
      setFileError('File size exceeds 5MB limit');
      return;
    }

    setSelectedFile(file);
  }

  function handleRemoveFile() {
    setSelectedFile(null);
    setFileError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  // ─── Submit comment ────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() && !selectedFile) return;

    setSubmitting(true);
    setError('');

    try {
      // Add comment first
      let commentId: string | undefined;
      if (content.trim()) {
        const comment = await ticketService.addComment(ticketId, {
          content: content.trim(),
          isInternal,
        });
        commentId = comment.id;
      }

      // Upload file if selected
      if (selectedFile) {
        setUploading(true);
        try {
          await attachmentService.upload(
            selectedFile,
            commentId ? undefined : ticketId,
            commentId
          );
        } catch {
          setFileError('Comment posted but file upload failed');
        } finally {
          setUploading(false);
        }
      }

      // Reset form
      setContent('');
      setIsInternal(false);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await loadComments();

    } catch (err: any) {
      if (err.response?.status === 404) {
        setError('Cannot add comment — ticket may be closed');
      } else {
        setError('Failed to add comment');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-gray-800 rounded-xl p-5">
      <h2 className="text-sm font-medium text-gray-400 mb-4">
        Comments {comments.length > 0 && `(${comments.length})`}
      </h2>

      {/* ─── Comments list ──────────────────────────────── */}
      {loading ? (
        <p className="text-gray-500 text-sm">Loading comments...</p>
      ) : comments.length === 0 ? (
        <p className="text-gray-500 text-sm">No comments yet.</p>
      ) : (
        <div className="space-y-3 mb-4">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className={`p-3 rounded-lg border ${
                comment.isInternal
                  ? 'bg-orange-500/5 border-orange-500/20'
                  : 'bg-gray-700/50 border-gray-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-white text-sm font-medium">
                    {comment.authorName}
                  </span>
                  <span className="text-gray-500 text-xs">
                    {comment.authorRole}
                  </span>
                  {comment.isInternal && (
                    <span className="px-1.5 py-0.5 bg-orange-500/10
                      text-orange-400 border border-orange-500/20
                      rounded text-xs font-medium">
                      Internal Note
                    </span>
                  )}
                </div>
                <span className="text-gray-500 text-xs">
                  {new Date(comment.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="text-gray-300 text-sm whitespace-pre-wrap">
                {comment.content}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ─── Error ──────────────────────────────────────── */}
      {error && (
        <div className="mb-3 p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-red-400 text-xs">{error}</p>
        </div>
      )}

      {/* ─── Add comment form ──────────────────────────── */}
      {isClosed ? (
        <p className="text-gray-500 text-xs italic">
          This ticket is closed — no further comments can be added.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-2">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Add a comment..."
            rows={3}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600
              rounded-lg text-white placeholder-gray-400 text-sm
              focus:outline-none focus:ring-2 focus:ring-blue-500
              resize-none transition"
            disabled={submitting}
          />

          {/* ─── File upload area ───────────────────────── */}
          <div className="border border-dashed border-gray-600 rounded-lg p-3">
            {selectedFile ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">
                    {selectedFile.type.startsWith('image/') ? '🖼️' : '📄'}
                  </span>
                  <div>
                    <p className="text-white text-xs font-medium">
                      {selectedFile.name}
                    </p>
                    <p className="text-gray-500 text-xs">
                      {attachmentService.formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="text-red-400 hover:text-red-300 text-xs transition"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.xlsx"
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer text-blue-400 hover:text-blue-300
                    text-xs transition"
                >
                  📎 Attach a file
                </label>
                <p className="text-gray-600 text-xs mt-0.5">
                  JPG, PNG, PDF, DOC, XLSX — max 5MB
                </p>
              </div>
            )}

            {/* File error */}
            {fileError && (
              <p className="text-red-400 text-xs mt-1">{fileError}</p>
            )}
          </div>

          <div className="flex items-center justify-between">
            {/* Internal note toggle — Agent and Admin only */}
            {canAddInternal ? (
              <label className="flex items-center gap-2 text-xs
                text-gray-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isInternal}
                  onChange={(e) => setIsInternal(e.target.checked)}
                  className="rounded border-gray-600 bg-gray-700
                    text-orange-500 focus:ring-orange-500"
                />
                Internal note (not visible to employee)
              </label>
            ) : (
              <span />
            )}

            <button
              type="submit"
              disabled={(!content.trim() && !selectedFile) || submitting}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700
                disabled:opacity-50 text-white text-sm
                font-medium rounded-lg transition"
            >
              {uploading ? 'Uploading...' : submitting ? 'Posting...' : 'Post Comment'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}