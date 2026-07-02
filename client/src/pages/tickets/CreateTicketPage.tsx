import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ticketService, LookupItem } from '../../services/ticketService';
import { attachmentService } from '../../services/attachmentService';
import {
  suggestCategoryAndPriority,
  AISuggestion
} from '../../services/aiService';

const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf', 'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
];
const MAX_SIZE = 5 * 1024 * 1024;

export default function CreateTicketPage() {
  const navigate = useNavigate();

  // ─── Form state ────────────────────────────────────────────
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [priorityId, setPriorityId] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // ─── File state ────────────────────────────────────────────
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Lookup data ───────────────────────────────────────────
  const [categories, setCategories] = useState<LookupItem[]>([]);
  const [priorities, setPriorities] = useState<LookupItem[]>([]);
  const [loadingLookups, setLoadingLookups] = useState(true);

  // ─── AI suggestion state ───────────────────────────────────
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<AISuggestion | null>(null);
  const [aiError, setAiError] = useState('');

  // ─── Load dropdowns on mount ───────────────────────────────
  useEffect(() => {
    async function loadLookups() {
      try {
        const [cats, pris] = await Promise.all([
          ticketService.getCategories(),
          ticketService.getPriorities(),
        ]);
        setCategories(cats);
        setPriorities(pris);
      } catch {
        setError('Failed to load form data. Please refresh.');
      } finally {
        setLoadingLookups(false);
      }
    }
    loadLookups();
  }, []);

  // ─── File handlers ─────────────────────────────────────────
  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    setFileError('');
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      setFileError(
        'File type not allowed. Use JPG, PNG, PDF, DOC, DOCX, or XLSX');
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

  // ─── AI suggest ────────────────────────────────────────────
  async function handleAISuggest() {
    if (!title.trim() && !description.trim()) {
      setAiError('Please enter a title or description first.');
      return;
    }
    setAiLoading(true);
    setAiError('');
    setAiSuggestion(null);
    try {
      const suggestion = await suggestCategoryAndPriority(
        title,
        description,
        categories.map(c => c.name),
        priorities.map(p => p.name)
      );
      setAiSuggestion(suggestion);

      // Auto-apply the suggestions to the dropdowns
      const matchedCategory = categories.find(
        c => c.name === suggestion.categoryName);
      const matchedPriority = priorities.find(
        p => p.name === suggestion.priorityName);

      if (matchedCategory) setCategoryId(matchedCategory.id);
      if (matchedPriority) setPriorityId(matchedPriority.id);

    } catch (err: any) {
      setAiError(err.message || 'AI suggestion failed. Please try again.');
    } finally {
      setAiLoading(false);
    }
  }

  // ─── Submit ────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!title.trim()) { setError('Title is required'); return; }
    if (!description.trim()) { setError('Description is required'); return; }
    if (!categoryId) { setError('Please select a category'); return; }
    if (!priorityId) { setError('Please select a priority'); return; }

    setLoading(true);
    try {
      const ticket = await ticketService.createTicket({
        title: title.trim(),
        description: description.trim(),
        categoryId,
        priorityId,
        dueAt: dueAt || undefined,
      });

      if (selectedFile) {
        try {
          await attachmentService.upload(selectedFile, ticket.id);
        } catch {
          console.error('File upload failed');
        }
      }

      navigate(`/tickets/${ticket.id}`);

    } catch (err: any) {
      if (err.response?.status === 400) {
        setError(err.response.data.message || 'Invalid request');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  if (loadingLookups) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center
        justify-center">
        <p className="text-gray-400">Loading form...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-2xl mx-auto">

        {/* ─── Header ───────────────────────────────────── */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/tickets')}
            className="text-gray-400 hover:text-white transition"
          >
            ← Back
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">New Ticket</h1>
            <p className="text-gray-400 text-sm mt-1">
              Submit a new support request
            </p>
          </div>
        </div>

        {/* ─── Form ─────────────────────────────────────── */}
        <div className="bg-gray-800 rounded-xl p-6">

          {error && (
            <div className="mb-5 p-3 bg-red-500/10 border
              border-red-500/20 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Title */}
            <div>
              <label htmlFor="title"
                className="block text-sm font-medium text-gray-300 mb-1.5">
                Title <span className="text-red-400">*</span>
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Brief description of the issue"
                className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600
                  rounded-lg text-white placeholder-gray-400 text-sm
                  focus:outline-none focus:ring-2 focus:ring-blue-500
                  focus:border-transparent transition"
                disabled={loading}
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description"
                className="block text-sm font-medium text-gray-300 mb-1.5">
                Description <span className="text-red-400">*</span>
              </label>
              <textarea
                id="description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Describe the issue in detail..."
                rows={5}
                className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600
                  rounded-lg text-white placeholder-gray-400 text-sm
                  focus:outline-none focus:ring-2 focus:ring-blue-500
                  focus:border-transparent transition resize-none"
                disabled={loading}
              />
            </div>

            {/* ─── AI Suggest button ─────────────────────── */}
            <div className="bg-gray-700/40 border border-gray-600/50
              rounded-xl p-4 space-y-3">

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-300">
                    ✨ AI Suggestion
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Let AI suggest the best category and priority
                    based on your description
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAISuggest}
                  disabled={
                    aiLoading ||
                    loading ||
                    (!title.trim() && !description.trim())
                  }
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-700
                    disabled:opacity-50 disabled:cursor-not-allowed
                    text-white text-sm font-medium rounded-lg transition
                    flex items-center gap-2 shrink-0"
                >
                  {aiLoading ? (
                    <>
                      <span className="animate-spin">⟳</span>
                      Analyzing...
                    </>
                  ) : (
                    <>✨ Suggest</>
                  )}
                </button>
              </div>

              {/* AI error */}
              {aiError && (
                <p className="text-red-400 text-xs">{aiError}</p>
              )}

              {/* AI result */}
              {aiSuggestion && (
                <div className="bg-violet-500/10 border border-violet-500/20
                  rounded-lg p-3 space-y-1">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-gray-400">Category:</span>
                    <span className="text-violet-300 font-medium">
                      {aiSuggestion.categoryName}
                    </span>
                    <span className="text-gray-600">·</span>
                    <span className="text-gray-400">Priority:</span>
                    <span className="text-violet-300 font-medium">
                      {aiSuggestion.priorityName}
                    </span>
                  </div>
                  <p className="text-gray-400 text-xs">
                    💡 {aiSuggestion.reason}
                  </p>
                  <p className="text-gray-600 text-xs">
                    Applied to dropdowns below — you can change them.
                  </p>
                </div>
              )}
            </div>

            {/* Category + Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="category"
                  className="block text-sm font-medium text-gray-300 mb-1.5">
                  Category <span className="text-red-400">*</span>
                </label>
                <select
                  id="category"
                  value={categoryId}
                  onChange={e => setCategoryId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600
                    rounded-lg text-white text-sm
                    focus:outline-none focus:ring-2 focus:ring-blue-500
                    focus:border-transparent transition"
                  disabled={loading}
                >
                  <option value="">Select category</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="priority"
                  className="block text-sm font-medium text-gray-300 mb-1.5">
                  Priority <span className="text-red-400">*</span>
                </label>
                <select
                  id="priority"
                  value={priorityId}
                  onChange={e => setPriorityId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600
                    rounded-lg text-white text-sm
                    focus:outline-none focus:ring-2 focus:ring-blue-500
                    focus:border-transparent transition"
                  disabled={loading}
                >
                  <option value="">Select priority</option>
                  {priorities.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Due Date */}
            <div>
              <label htmlFor="dueAt"
                className="block text-sm font-medium text-gray-300 mb-1.5">
                Due Date
                <span className="text-gray-500 font-normal ml-1">
                  (optional)
                </span>
              </label>
              <input
                id="dueAt"
                type="datetime-local"
                value={dueAt}
                onChange={e => setDueAt(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600
                  rounded-lg text-white text-sm
                  focus:outline-none focus:ring-2 focus:ring-blue-500
                  focus:border-transparent transition"
                disabled={loading}
              />
            </div>

            {/* Attachment */}
            <div>
              <label className="block text-sm font-medium
                text-gray-300 mb-1.5">
                Attachment
                <span className="text-gray-500 font-normal ml-1">
                  (optional)
                </span>
              </label>
              <div className="border border-dashed border-gray-600
                rounded-lg p-4">
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
                      className="text-red-400 hover:text-red-300
                        text-xs transition"
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
                      id="ticket-file-upload"
                      disabled={loading}
                    />
                    <label
                      htmlFor="ticket-file-upload"
                      className="cursor-pointer text-blue-400
                        hover:text-blue-300 text-xs transition"
                    >
                      📎 Attach a file
                    </label>
                    <p className="text-gray-600 text-xs mt-0.5">
                      JPG, PNG, PDF, DOC, XLSX — max 5MB
                    </p>
                  </div>
                )}
                {fileError && (
                  <p className="text-red-400 text-xs mt-1">{fileError}</p>
                )}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700
                  disabled:bg-blue-800 disabled:cursor-not-allowed
                  text-white font-medium text-sm rounded-lg transition"
              >
                {loading ? 'Submitting...' : 'Submit Ticket'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/tickets')}
                disabled={loading}
                className="px-4 py-2.5 bg-gray-700 hover:bg-gray-600
                  text-gray-300 font-medium text-sm rounded-lg transition"
              >
                Cancel
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}