import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid
} from 'recharts';
import api from '../../services/api';

interface DashboardStats {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  pendingTickets: number;
  resolvedTickets: number;
  closedTickets: number;
  criticalTickets: number;
  escalatedTickets: number;
  ticketsByCategory: { label: string; value: number; color: string }[];
  ticketsByPriority: { label: string; value: number; color: string }[];
  ticketsByStatus: { label: string; value: number; color: string }[];
  ticketsOverTime: { date: string; count: number }[];
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadStats() {
      try {
        const response = await api.get('/dashboard/stats');
        setStats(response.data);
      } catch {
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <p className="text-gray-400">Loading dashboard...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-6">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  // ─── KPI cards config ──────────────────────────────────────
  const kpiCards = [
    {
      label: 'Total Tickets',
      value: stats.totalTickets,
      color: 'border-blue-500',
      textColor: 'text-blue-400',
      bg: 'bg-blue-500/10'
    },
    {
      label: 'Open',
      value: stats.openTickets,
      color: 'border-yellow-500',
      textColor: 'text-yellow-400',
      bg: 'bg-yellow-500/10'
    },
    {
      label: 'In Progress',
      value: stats.inProgressTickets,
      color: 'border-purple-500',
      textColor: 'text-purple-400',
      bg: 'bg-purple-500/10'
    },
    {
      label: 'Pending',
      value: stats.pendingTickets,
      color: 'border-orange-500',
      textColor: 'text-orange-400',
      bg: 'bg-orange-500/10'
    },
    {
      label: 'Resolved',
      value: stats.resolvedTickets,
      color: 'border-green-500',
      textColor: 'text-green-400',
      bg: 'bg-green-500/10'
    },
    {
      label: 'Closed',
      value: stats.closedTickets,
      color: 'border-gray-500',
      textColor: 'text-gray-400',
      bg: 'bg-gray-500/10'
    },
    {
      label: 'Critical',
      value: stats.criticalTickets,
      color: 'border-red-500',
      textColor: 'text-red-400',
      bg: 'bg-red-500/10'
    },
    {
      label: 'Escalated',
      value: stats.escalatedTickets,
      color: 'border-red-400',
      textColor: 'text-red-300',
      bg: 'bg-red-400/10'
    },
  ];

  return (
    <div className="p-6 space-y-6">

      {/* ─── Header ─────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          Welcome back, {user?.firstName}!
        </h1>
        <p className="text-gray-400 mt-1 text-sm">
          {user?.role === 'Employee'
            ? 'Here are your support tickets.'
            : user?.role === 'ITSupportAgent'
            ? 'Here are your assigned tickets.'
            : 'Here is your help desk overview.'}
        </p>
      </div>

      {/* ─── KPI Cards ──────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpiCards.map(card => (
          <div
            key={card.label}
            className={`${card.bg} rounded-xl p-4 border-l-4 ${card.color}`}
          >
            <p className="text-gray-400 text-xs font-medium uppercase tracking-wide">
              {card.label}
            </p>
            <p className={`text-3xl font-bold mt-2 ${card.textColor}`}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* ─── Charts row 1 ───────────────────────────────── */}
      <div className="grid grid-cols-2 gap-6">

        {/* Tickets by Status — Pie chart */}
        <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
          <h2 className="text-sm font-medium text-gray-400 mb-4">
            Tickets by Status
          </h2>
          {stats.ticketsByStatus.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">
              No data yet
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={stats.ticketsByStatus}
                  dataKey="value"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, value }) => `${name}: ${value}`}
                  labelLine={false}
                >
                  {stats.ticketsByStatus.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: 'white'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Tickets by Priority — Bar chart */}
        <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
          <h2 className="text-sm font-medium text-gray-400 mb-4">
            Tickets by Priority
          </h2>
          {stats.ticketsByPriority.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">
              No data yet
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats.ticketsByPriority}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis
                  dataKey="label"
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                />
                <YAxis
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: 'white'
                  }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {stats.ticketsByPriority.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

      </div>

      {/* ─── Charts row 2 ───────────────────────────────── */}
      <div className="grid grid-cols-2 gap-6">

        {/* Tickets by Category — Bar chart */}
        <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
          <h2 className="text-sm font-medium text-gray-400 mb-4">
            Tickets by Category
          </h2>
          {stats.ticketsByCategory.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">
              No data yet
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats.ticketsByCategory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis
                  dataKey="label"
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                />
                <YAxis
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: 'white'
                  }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {stats.ticketsByCategory.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Tickets over time — Line chart */}
        <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
          <h2 className="text-sm font-medium text-gray-400 mb-4">
            Tickets Created — Last 7 Days
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={stats.ticketsOverTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis
                dataKey="date"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
              />
              <YAxis
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: 'white'
                }}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: '#3b82f6', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

      </div>

    </div>
  );
}