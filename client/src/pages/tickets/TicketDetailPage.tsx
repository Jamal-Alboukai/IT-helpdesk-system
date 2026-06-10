import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  ticketService,
  TicketDetail,
  LookupItem
} from '../../services/ticketService';

// ─── Priority badge ────────────────────────────────────────────
function PriorityBadge({ priority }: { priority: string }) {
  const colors: Record<string, string> = {
    Low: 'bg-green-500/10 text-green-400 border border-green-500/20',
    Medium: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
    High: 'bg-orange-500/10 text-orange-400 border border-orange-500/20',
    Critical: 'bg-red-500/10 text-red-400 border border-red-500/20',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[priority] || 'bg-gray-500/10 text-gray-400'}`}>
      {priority}
    </span>
  );
}

// ─── Status badge ──────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    'Open': 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
    'In Progress': 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
    'Pending': 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
    'Resolved': 'bg-green-500/10 text-green-400 border border-green-500/20',
    'Closed': 'bg-gray-500/10 text-gray-400 border border-gray-500/20',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-500/10 text-gray-400'}`}>
      {status}
    </span>
  );
}

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // ─── State ─────────────────────────────────────────────────
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // ─── Escalation form ───────────────────────────────────────
  const [showEscalationForm, setShowEscalationForm] = useState(false);
  const [escalationNote, setEscalationNote] = useState('');

  // ─── Status update ─────────────────────────────────────────
  const [statuses, setStatuses] = useState<LookupItem[]>([]);

  // ─── Load ticket ───────────────────────────────────────────
  useEffect(() => {
    if (id) loadTicket();
  }, [id]);

  // ─── Load statuses for agent ───────────────────────────────
  useEffect(() => {
    if (user?.role === 'ITSupportAgent' || user?.role === 'Admin') {
      ticketService.getStatuses().then(setStatuses).catch(() => {});
    }
  }, [user]);

  async function loadTicket() {
    setLoading(true);
    setError('');
    try {
      const result = await ticketService.getTicketById(id!);
      setTicket(result);
    } catch {
      setError('Ticket not found or access denied.');
    } finally {
      setLoading(false);
    }
  }

  // ─── Update status (Agent + Admin) ────────────────────────
  async function handleStatusChange(statusId: string) {
    if (!ticket) return;
    setActionLoading(true);
    try {
      const updated = await ticketService.updateTicket(ticket.id, { statusId });
      setTicket(updated);
    } catch {
      setError('Failed to update status.');
    } finally {
      setActionLoading(false);
    }
  }

  // ─── Close ticket (Employee) ───────────────────────────────
  async function handleCloseTicket() {
    if (!ticket) return;
    if (!window.confirm('Are you sure you want to close this ticket?')) return;
    setActionLoading(true);
    try {
      await ticketService.deleteTicket(ticket.id);
      navigate('/tickets');
    } catch {
      setError('Failed to close ticket.');
    } finally {
      setActionLoading(false);
    }
  }

  // ─── Request escalation (Agent) ───────────────────────────
  async function handleEscalation() {
    if (!ticket || !escalationNote.trim()) return;
    setActionLoading(true);
    try {
      const updated = await ticketService.requestEscalation(
        ticket.id, escalationNote.trim());
      setTicket(updated);
      setShowEscalationForm(false);
      setEscalationNote('');
    } catch {
      setError('Failed to request escalation.');
    } finally {
      setActionLoading(false);
    }
  }

  // ─── Loading state ─────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-gray-400">Loading ticket...</p>
      </div>
    );
  }

  // ─── Error state ───────────────────────────────────────────
  if (error || !ticket) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || 'Ticket not found'}</p>
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

  // ─── Role-based permissions ────────────────────────────────
  const isOwner = user?.id === ticket.createdById;
  const isAssigned = user?.id === ticket.assignedToId;
  const isAdmin = user?.role === 'Admin';
  const isAgent = user?.role === 'ITSupportAgent';
  const isEmployee = user?.role === 'Employee';
  const isOpen = ticket.status === 'Open';
  const isResolved = ticket.status === 'Resolved';

  const canEdit = (isEmployee && isOwner && isOpen) || isAdmin;
  const canUpdateStatus = (isAgent && isAssigned) || isAdmin;
  const canClose = (isEmployee && isOwner && isResolved) || isAdmin;
  const canEscalate = isAgent && isAssigned && !ticket.escalationRequested;

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-5xl mx-auto">

        {/* ─── Header ───────────────────────────────────── */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/tickets')}
            className="text-gray-400 hover:text-white transition"
          >
            ← Back
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <span className="text-blue-400 font-mono text-sm">
                {ticket.referenceNumber}
              </span>
              {ticket.escalationRequested && (
                <span className="px-2 py-0.5 bg-red-500/10 text-red-400 
                  border border-red-500/20 rounded-full text-xs font-medium">
                  Escalation Requested
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-white mt-1">
              {ticket.title}
            </h1>
          </div>
        </div>

        {/* ─── Error ────────────────────────────────────── */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-3 gap-6">

          {/* ─── Left — Main content ───────────────────── */}
          <div className="col-span-2 space-y-4">

            {/* Description */}
            <div className="bg-gray-800 rounded-xl p-5">
              <h2 className="text-sm font-medium text-gray-400 mb-3">
                Description
              </h2>
              <p className="text-white text-sm leading-relaxed whitespace-pre-wrap">
                {ticket.description}
              </p>
            </div>

            {/* Escalation note */}
            {ticket.escalationRequested && ticket.escalationNote && (
              <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-5">
                <h2 className="text-sm font-medium text-red-400 mb-2">
                  Escalation Note
                </h2>
                <p className="text-gray-300 text-sm leading-relaxed">
                  {ticket.escalationNote}
                </p>
              </div>
            )}

            {/* Escalation form */}
            {showEscalationForm && (
              <div className="bg-gray-800 rounded-xl p-5">
                <h2 className="text-sm font-medium text-gray-300 mb-3">
                  Request Escalation
                </h2>
                <textarea
                  value={escalationNote}
                  onChange={(e) => setEscalationNote(e.target.value)}
                  placeholder="Explain why this ticket needs to be escalated..."
                  rows={3}
                  className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600
                    rounded-lg text-white placeholder-gray-400 text-sm
                    focus:outline-none focus:ring-2 focus:ring-red-500
                    resize-none mb-3"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleEscalation}
                    disabled={!escalationNote.trim() || actionLoading}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700
                      disabled:opacity-50 text-white text-sm
                      font-medium rounded-lg transition"
                  >
                    Submit Escalation
                  </button>
                  <button
                    onClick={() => {
                      setShowEscalationForm(false);
                      setEscalationNote('');
                    }}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600
                      text-gray-300 text-sm font-medium rounded-lg transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* ─── Right — Details panel ─────────────────── */}
          <div className="space-y-4">

            {/* Ticket info */}
            <div className="bg-gray-800 rounded-xl p-5 space-y-4">
              <h2 className="text-sm font-medium text-gray-400">
                Ticket Details
              </h2>

              <div className="space-y-3">

                <div>
                  <p className="text-xs text-gray-500 mb-1">Status</p>
                  <StatusBadge status={ticket.status} />
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-1">Priority</p>
                  <PriorityBadge priority={ticket.priority} />
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-1">Category</p>
                  <p className="text-white text-sm">{ticket.category}</p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-1">Created By</p>
                  <p className="text-white text-sm">{ticket.createdBy}</p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-1">Assigned To</p>
                  <p className="text-white text-sm">
                    {ticket.assignedTo || '—'}
                  </p>
                </div>

                {ticket.dueAt && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Due Date</p>
                    <p className="text-white text-sm">
                      {new Date(ticket.dueAt).toLocaleDateString()}
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-xs text-gray-500 mb-1">Created</p>
                  <p className="text-white text-sm">
                    {new Date(ticket.createdAt).toLocaleDateString()}
                  </p>
                </div>

                {ticket.resolvedAt && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Resolved</p>
                    <p className="text-white text-sm">
                      {new Date(ticket.resolvedAt).toLocaleDateString()}
                    </p>
                  </div>
                )}

              </div>
            </div>

            {/* ─── Actions ──────────────────────────────── */}
            <div className="bg-gray-800 rounded-xl p-5 space-y-3">
              <h2 className="text-sm font-medium text-gray-400">Actions</h2>

              {/* Edit — Employee (own+Open) or Admin */}
              {canEdit && (
                <button
                  onClick={() => navigate(`/tickets/${ticket.id}/edit`)}
                  className="w-full py-2 px-4 bg-gray-700 hover:bg-gray-600
                    text-white text-sm font-medium rounded-lg transition"
                >
                  Edit Ticket
                </button>
              )}

              {/* Update status — Agent (assigned) or Admin */}
              {canUpdateStatus && (
                <div>
                  <p className="text-xs text-gray-500 mb-1.5">
                    Update Status
                  </p>
                  <select
                    value={ticket.statusId}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    disabled={actionLoading}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600
                      rounded-lg text-white text-sm
                      focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {statuses.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Request escalation — Agent only */}
              {canEscalate && !showEscalationForm && (
                <button
                  onClick={() => setShowEscalationForm(true)}
                  className="w-full py-2 px-4 bg-orange-600/20 
                    hover:bg-orange-600/30 border border-orange-500/30
                    text-orange-400 text-sm font-medium rounded-lg transition"
                >
                  Request Escalation
                </button>
              )}

              {/* Close ticket — Employee (resolved) or Admin */}
              {canClose && (
                <button
                  onClick={handleCloseTicket}
                  disabled={actionLoading}
                  className="w-full py-2 px-4 bg-green-600/20
                    hover:bg-green-600/30 border border-green-500/30
                    text-green-400 text-sm font-medium rounded-lg transition
                    disabled:opacity-50"
                >
                  Close Ticket
                </button>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}