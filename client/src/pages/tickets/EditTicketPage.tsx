import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  ticketService,
  TicketDetail,
  LookupItem
} from '../../services/ticketService';

export default function EditTicketPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // ─── State ─────────────────────────────────────────────────
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // ─── Form fields ───────────────────────────────────────────
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [priorityId, setPriorityId] = useState('');
  const [dueAt, setDueAt] = useState('');

  // ─── Lookup data ───────────────────────────────────────────
  const [categories, setCategories] = useState<LookupItem[]>([]);
  const [priorities, setPriorities] = useState<LookupItem[]>([]);

  // ─── Load ticket and lookups ───────────────────────────────
  useEffect(() => {
    if (id) loadData();
  }, [id]);

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      const [ticketData, cats, pris] = await Promise.all([
        ticketService.getTicketById(id!),
        ticketService.getCategories(),
        ticketService.getPriorities(),
      ]);

      // Check permission — Employee can only edit own Open tickets
      if (user?.role === 'Employee') {
        if (ticketData.createdById !== user.id) {
          navigate('/tickets');
          return;
        }
        if (ticketData.status !== 'Open') {
          navigate(`/tickets/${id}`);
          return;
        }
      }

      setTicket(ticketData);
      setTitle(ticketData.title);
      setDescription(ticketData.description);
      setCategoryId(ticketData.categoryId);
      setPriorityId(ticketData.priorityId);
      setDueAt(ticketData.dueAt
        ? new Date(ticketData.dueAt).toISOString().slice(0, 16)
        : '');
      setCategories(cats);
      setPriorities(pris);

    } catch {
      setError('Ticket not found or access denied.');
    } finally {
      setLoading(false);
    }
  }

  // ─── Submit ────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    if (!description.trim()) {
      setError('Description is required');
      return;
    }

    setSaving(true);
    try {
      // Build update payload based on role
      const isAdmin = user?.role === 'Admin';
      const isAgent = user?.role === 'ITSupportAgent';

      const payload: any = {};

      // Employee and Admin can update title, description, dueAt
      if (user?.role === 'Employee' || isAdmin) {
        payload.title = title.trim();
        payload.description = description.trim();
        payload.dueAt = dueAt || undefined;
      }

      // Agent and Admin can update category and priority
      if (isAgent || isAdmin) {
        payload.categoryId = categoryId;
        payload.priorityId = priorityId;
      }

      await ticketService.updateTicket(id!, payload);
      navigate(`/tickets/${id}`);

    } catch (err: any) {
      if (err.response?.status === 400) {
        setError(err.response.data.message || 'Invalid request');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  }

  // ─── Loading ───────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-gray-400">Loading ticket...</p>
      </div>
    );
  }

  // ─── Error ─────────────────────────────────────────────────
  if (error && !ticket) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => navigate('/tickets')}
            className="text-blue-400 hover:text-blue-300 transition"
          >
            ← Back to tickets
          </button>
        </div>
      </div>
    );
  }

  const isAgent = user?.role === 'ITSupportAgent';
  const isAdmin = user?.role === 'Admin';

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-2xl mx-auto">

        {/* ─── Header ───────────────────────────────────── */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(`/tickets/${id}`)}
            className="text-gray-400 hover:text-white transition"
          >
            ← Back
          </button>
          <div>
            <p className="text-blue-400 font-mono text-sm">
              {ticket?.referenceNumber}
            </p>
            <h1 className="text-2xl font-bold text-white">Edit Ticket</h1>
          </div>
        </div>

        {/* ─── Form ─────────────────────────────────────── */}
        <div className="bg-gray-800 rounded-xl p-6">

          {error && (
            <div className="mb-5 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Title — Employee + Admin only */}
            {(user?.role === 'Employee' || isAdmin) && (
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
                  className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600
                    rounded-lg text-white text-sm
                    focus:outline-none focus:ring-2 focus:ring-blue-500
                    focus:border-transparent transition"
                  disabled={saving}
                />
              </div>
            )}

            {/* Category + Priority — Agent + Admin only */}
            {(isAgent || isAdmin) && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="category"
                    className="block text-sm font-medium text-gray-300 mb-1.5">
                    Category
                  </label>
                  <select
                    id="category"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600
                      rounded-lg text-white text-sm
                      focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={saving}
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="priority"
                    className="block text-sm font-medium text-gray-300 mb-1.5">
                    Priority
                  </label>
                  <select
                    id="priority"
                    value={priorityId}
                    onChange={(e) => setPriorityId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600
                      rounded-lg text-white text-sm
                      focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={saving}
                  >
                    {priorities.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Description — Employee + Admin only */}
            {(user?.role === 'Employee' || isAdmin) && (
              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-300 mb-1.5">
                  Description <span className="text-red-400">*</span>
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600
                    rounded-lg text-white text-sm
                    focus:outline-none focus:ring-2 focus:ring-blue-500
                    resize-none transition"
                  disabled={saving}
                />
              </div>
            )}

            {/* Due Date — Employee + Admin */}
            {(user?.role === 'Employee' || isAdmin) && (
              <div>
                <label
                  htmlFor="dueAt"
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
                  onChange={(e) => setDueAt(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600
                    rounded-lg text-white text-sm
                    focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={saving}
                />
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700
                  disabled:bg-blue-800 disabled:cursor-not-allowed
                  text-white font-medium text-sm rounded-lg transition"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={() => navigate(`/tickets/${id}`)}
                disabled={saving}
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