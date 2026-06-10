import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ticketService, LookupItem } from '../../services/ticketService';

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

  // ─── Lookup data ───────────────────────────────────────────
  const [categories, setCategories] = useState<LookupItem[]>([]);
  const [priorities, setPriorities] = useState<LookupItem[]>([]);
  const [loadingLookups, setLoadingLookups] = useState(true);

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

  // ─── Submit ────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    // Validation
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    if (!description.trim()) {
      setError('Description is required');
      return;
    }
    if (!categoryId) {
      setError('Please select a category');
      return;
    }
    if (!priorityId) {
      setError('Please select a priority');
      return;
    }

    setLoading(true);
    try {
      const ticket = await ticketService.createTicket({
        title: title.trim(),
        description: description.trim(),
        categoryId,
        priorityId,
        dueAt: dueAt || undefined,
      });

      // Redirect to ticket detail after creation
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
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
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

          {/* Error */}
          {error && (
            <div className="mb-5 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Title */}
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-300 mb-1.5">
                Title <span className="text-red-400">*</span>
              </label>
              <input
                id="title"
                name="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Brief description of the issue"
                className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600
                  rounded-lg text-white placeholder-gray-400 text-sm
                  focus:outline-none focus:ring-2 focus:ring-blue-500
                  focus:border-transparent transition"
                disabled={loading}
              />
            </div>

            {/* Category + Priority */}
            <div className="grid grid-cols-2 gap-4">

              {/* Category */}
              <div>
                <label
                  htmlFor="category"
                  className="block text-sm font-medium text-gray-300 mb-1.5">
                  Category <span className="text-red-400">*</span>
                </label>
                <select
                  id="category"
                  name="category"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
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

              {/* Priority */}
              <div>
                <label
                  htmlFor="priority"
                  className="block text-sm font-medium text-gray-300 mb-1.5">
                  Priority <span className="text-red-400">*</span>
                </label>
                <select
                  id="priority"
                  name="priority"
                  value={priorityId}
                  onChange={(e) => setPriorityId(e.target.value)}
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

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-300 mb-1.5">
                Description <span className="text-red-400">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the issue in detail..."
                rows={5}
                className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600
                  rounded-lg text-white placeholder-gray-400 text-sm
                  focus:outline-none focus:ring-2 focus:ring-blue-500
                  focus:border-transparent transition resize-none"
                disabled={loading}
              />
            </div>

            {/* Due Date */}
            <div>
              <label
                htmlFor="dueAt"
                className="block text-sm font-medium text-gray-300 mb-1.5">
                Due Date
                <span className="text-gray-500 font-normal ml-1">(optional)</span>
              </label>
              <input
                id="dueAt"
                name="dueAt"
                type="datetime-local"
                value={dueAt}
                onChange={(e) => setDueAt(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600
                  rounded-lg text-white text-sm
                  focus:outline-none focus:ring-2 focus:ring-blue-500
                  focus:border-transparent transition"
                disabled={loading}
              />
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