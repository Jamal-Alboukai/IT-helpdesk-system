import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  ticketService,
  TicketListItem,
  LookupItem,
  TicketFilter
} from '../../services/ticketService';

// ─── Priority badge colors ─────────────────────────────────────
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

// ─── Status badge colors ───────────────────────────────────────
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

export default function TicketListPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // ─── State ─────────────────────────────────────────────────
  const [tickets, setTickets] = useState<TicketListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // ─── Filters ───────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [priorityId, setPriorityId] = useState('');
  const [statusId, setStatusId] = useState('');
  const [page, setPage] = useState(1);

  // ─── Lookup data for dropdowns ─────────────────────────────
  const [categories, setCategories] = useState<LookupItem[]>([]);
  const [priorities, setPriorities] = useState<LookupItem[]>([]);
  const [statuses, setStatuses] = useState<LookupItem[]>([]);

  // ─── Load lookup data on mount ─────────────────────────────
  useEffect(() => {
    async function loadLookups() {
      try {
        const [cats, pris, stats] = await Promise.all([
          ticketService.getCategories(),
          ticketService.getPriorities(),
          ticketService.getStatuses(),
        ]);
        setCategories(cats);
        setPriorities(pris);
        setStatuses(stats);
      } catch {
        // silently fail — dropdowns just won't populate
      }
    }
    loadLookups();
  }, []);

  // ─── Load tickets when filters change ──────────────────────
  useEffect(() => {
    loadTickets();
  }, [page, categoryId, priorityId, statusId]);

  async function loadTickets(searchOverride?: string) {
    setLoading(true);
    setError('');
    try {
      const filter: TicketFilter = {
        search: searchOverride !== undefined ? searchOverride : search,
        categoryId: categoryId || undefined,
        priorityId: priorityId || undefined,
        statusId: statusId || undefined,
        page,
        pageSize: 10,
      };
      const result = await ticketService.getTickets(filter);
      setTickets(result.data);
      setTotalPages(result.totalPages);
      setTotalCount(result.totalCount);
    } catch {
      setError('Failed to load tickets. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // ─── Search on enter ───────────────────────────────────────
  function handleSearchKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      setPage(1);
      loadTickets(search);
    }
  }

  // ─── Reset filters ─────────────────────────────────────────
  function handleReset() {
    setSearch('');
    setCategoryId('');
    setPriorityId('');
    setStatusId('');
    setPage(1);
    loadTickets('');
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">

      {/* ─── Header ─────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Tickets</h1>
          <p className="text-gray-400 text-sm mt-1">
            {totalCount} ticket{totalCount !== 1 ? 's' : ''} found
          </p>
        </div>

        {/* Only Employee, ITSupportAgent, Admin can create */}
        {user?.role !== 'Manager' && (
          <button
            onClick={() => navigate('/tickets/new')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 
              text-white text-sm font-medium rounded-lg transition"
          >
            + New Ticket
          </button>
        )}
      </div>

      {/* ─── Filters ────────────────────────────────────── */}
      <div className="bg-gray-800 rounded-xl p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">

          {/* Search */}
          <input
            type="text"
            placeholder="Search tickets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className="px-3 py-2 bg-gray-700 border border-gray-600
              rounded-lg text-white placeholder-gray-400 text-sm
              focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* Category */}
          <select
            value={categoryId}
            onChange={(e) => { setCategoryId(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-gray-700 border border-gray-600
              rounded-lg text-white text-sm
              focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {/* Priority */}
          <select
            value={priorityId}
            onChange={(e) => { setPriorityId(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-gray-700 border border-gray-600
              rounded-lg text-white text-sm
              focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Priorities</option>
            {priorities.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          {/* Status */}
          <select
            value={statusId}
            onChange={(e) => { setStatusId(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-gray-700 border border-gray-600
              rounded-lg text-white text-sm
              focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            {statuses.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

        </div>

        {/* Reset button */}
        {(search || categoryId || priorityId || statusId) && (
          <button
            onClick={handleReset}
            className="mt-3 text-sm text-gray-400 hover:text-white transition"
          >
            Reset filters
          </button>
        )}
      </div>

      {/* ─── Error ──────────────────────────────────────── */}
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* ─── Table ──────────────────────────────────────── */}
      <div className="bg-gray-800 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase">Reference</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase">Title</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase">Category</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase">Priority</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase">Status</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase">Assigned To</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase">Created</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                  Loading tickets...
                </td>
              </tr>
            ) : tickets.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                  No tickets found
                </td>
              </tr>
            ) : (
              tickets.map((ticket) => (
                <tr
                  key={ticket.id}
                  className="border-b border-gray-700/50 hover:bg-gray-700/30 transition"
                >
                  <td className="px-4 py-3">
                    <span className="text-blue-400 text-sm font-mono">
                      {ticket.referenceNumber}
                    </span>
                    {ticket.escalationRequested && (
                      <span className="ml-2 px-1.5 py-0.5 bg-red-500/10 
                        text-red-400 border border-red-500/20 
                        rounded text-xs">
                        Escalated
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-white text-sm">{ticket.title}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-gray-300 text-sm">{ticket.category}</span>
                  </td>
                  <td className="px-4 py-3">
                    <PriorityBadge priority={ticket.priority} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={ticket.status} />
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-gray-300 text-sm">
                      {ticket.assignedTo || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-gray-400 text-sm">
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => navigate(`/tickets/${ticket.id}`)}
                      className="text-blue-400 hover:text-blue-300 text-sm transition"
                    >
                      View →
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ─── Pagination ─────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-gray-400 text-sm">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 bg-gray-800 border border-gray-700
                text-gray-300 text-sm rounded-lg disabled:opacity-50
                hover:bg-gray-700 transition"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 bg-gray-800 border border-gray-700
                text-gray-300 text-sm rounded-lg disabled:opacity-50
                hover:bg-gray-700 transition"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}