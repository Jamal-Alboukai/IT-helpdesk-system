import { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  reportsService,
  MonthlySummary,
  AgentPerformance,
} from '../../services/reportsService';

// ─── Helpers ──────────────────────────────────────────────────
function fmt(hours: number): string {
  if (hours === 0) return '—';
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  const rem = Math.round(hours % 24);
  return rem > 0 ? `${days}d ${rem}h` : `${days}d`;
}

function ResolutionBar({ rate }: { rate: number }) {
  const color =
    rate >= 75 ? 'bg-green-500' :
    rate >= 50 ? 'bg-yellow-500' :
    rate >= 25 ? 'bg-orange-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-700 rounded-full h-1.5">
        <div
          className={`h-1.5 rounded-full transition-all ${color}`}
          style={{ width: `${rate}%` }}
        />
      </div>
      <span className="text-xs text-gray-400 w-10 text-right">
        {rate}%
      </span>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────
export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [monthly, setMonthly] = useState<MonthlySummary[]>([]);
  const [agents, setAgents] = useState<AgentPerformance[]>([]);
  const [generatedAt, setGeneratedAt] = useState('');
  const [months, setMonths] = useState(12);
  const [exporting, setExporting] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  // ─── Load data ─────────────────────────────────────────────
  useEffect(() => {
    loadReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [months]);

  async function loadReport() {
    setLoading(true);
    setError('');
    try {
      const data = await reportsService.getSummary(months);
      setMonthly(data.monthlySummary);
      setAgents(data.agentPerformance);
      setGeneratedAt(data.generatedAt);
    } catch {
      setError('Failed to load report data.');
    } finally {
      setLoading(false);
    }
  }

  // ─── Export PDF ─────────────────────────────────────────────
  function handleExportPDF() {
    window.print();
  }

  // ─── Export Excel ────────────────────────────────────────────
  function handleExportExcel() {
    setExporting(true);
    try {
      const wb = XLSX.utils.book_new();

      // ── Sheet 1: Monthly Summary ──
      const monthlyData = monthly.map(m => ({
        'Month': m.month,
        'Total Created': m.totalCreated,
        'Resolved': m.resolved,
        'Closed': m.closed,
        'Escalated': m.escalated,
        'Avg Resolution (hrs)': m.avgResolutionHours,
      }));
      const ws1 = XLSX.utils.json_to_sheet(monthlyData);
      ws1['!cols'] = [
        { wch: 12 }, { wch: 14 }, { wch: 10 },
        { wch: 10 }, { wch: 10 }, { wch: 22 },
      ];
      XLSX.utils.book_append_sheet(wb, ws1, 'Monthly Summary');

      // ── Sheet 2: Agent Performance ──
      const agentData = agents.map(a => ({
        'Agent': a.agentName,
        'Email': a.email,
        'Total Assigned': a.totalAssigned,
        'Resolved': a.resolved,
        'Closed': a.closed,
        'Active': a.activeTickets,
        'Resolution Rate (%)': a.resolutionRate,
        'Avg Resolution (hrs)': a.avgResolutionHours,
      }));
      const ws2 = XLSX.utils.json_to_sheet(agentData);
      ws2['!cols'] = [
        { wch: 20 }, { wch: 28 }, { wch: 14 },
        { wch: 10 }, { wch: 10 }, { wch: 10 },
        { wch: 20 }, { wch: 22 },
      ];
      XLSX.utils.book_append_sheet(wb, ws2, 'Agent Performance');

      // ── Write file ──
      const fileName = `IDS_HelpDesk_Report_${
        new Date().toISOString().slice(0, 10)}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch {
      setError('Failed to export Excel file.');
    } finally {
      setExporting(false);
    }
  }

  // ─── Totals row for monthly table ──────────────────────────
  const totals = monthly.reduce(
    (acc, m) => ({
      totalCreated: acc.totalCreated + m.totalCreated,
      resolved: acc.resolved + m.resolved,
      closed: acc.closed + m.closed,
      escalated: acc.escalated + m.escalated,
    }),
    { totalCreated: 0, resolved: 0, closed: 0, escalated: 0 }
  );

  return (
    <>
      {/* ─── Print styles (PDF only) ────────────────────── */}
      <style>{`
        @media print {
          body { background: white !important; color: black !important; }
          .no-print { display: none !important; }
          .print-page { padding: 20px !important; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #ccc; padding: 6px 10px;
            font-size: 11px; color: black !important; }
          th { background: #f3f4f6 !important; font-weight: 600; }
          .print-title { font-size: 18px; font-weight: bold;
            margin-bottom: 4px; color: black !important; }
          .print-subtitle { font-size: 12px; color: #666 !important;
            margin-bottom: 20px; }
          .section-title { font-size: 14px; font-weight: 600;
            margin: 20px 0 8px; color: black !important; }
          .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr);
            gap: 12px; margin-bottom: 20px; }
          .kpi-card { border: 1px solid #ccc; padding: 10px;
            border-radius: 6px; }
          .kpi-label { font-size: 10px; color: #666; }
          .kpi-value { font-size: 20px; font-weight: bold; color: black; }
          .bar-cell { display: none; }
        }
      `}</style>

      <div className="min-h-screen bg-gray-900 p-4 md:p-6 print-page"
        ref={printRef}>
        <div className="max-w-6xl mx-auto">

          {/* ─── Header ─────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row sm:items-start
            sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-white
                print-title">
                Reports
              </h1>
              <p className="text-gray-400 text-sm mt-1 print-subtitle">
                IDS Help Desk · Generated {generatedAt || '...'}
              </p>
            </div>

            {/* Controls — hidden on print */}
            <div className="flex flex-wrap items-center gap-2 no-print">
              <select
                value={months}
                onChange={e => setMonths(Number(e.target.value))}
                className="px-3 py-2 bg-gray-800 border border-gray-700
                  rounded-lg text-white text-sm
                  focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={3}>Last 3 months</option>
                <option value={6}>Last 6 months</option>
                <option value={12}>Last 12 months</option>
                <option value={24}>Last 24 months</option>
              </select>
              <button
                onClick={handleExportPDF}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600
                  text-white text-sm font-medium rounded-lg transition
                  flex items-center gap-2"
              >
                🖨️ Export PDF
              </button>
              <button
                onClick={handleExportExcel}
                disabled={exporting || loading}
                className="px-4 py-2 bg-green-600 hover:bg-green-700
                  disabled:opacity-50 text-white text-sm
                  font-medium rounded-lg transition
                  flex items-center gap-2"
              >
                📊 {exporting ? 'Exporting...' : 'Export Excel'}
              </button>
            </div>
          </div>

          {/* ─── Error ──────────────────────────────────── */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border
              border-red-500/20 rounded-lg no-print">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-24">
              <p className="text-gray-400">Loading report...</p>
            </div>
          ) : (
            <>
              {/* ─── KPI summary strip ─────────────────── */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3
                md:gap-4 mb-6 kpi-grid">
                {[
                  { label: 'Total Created', value: totals.totalCreated,
                    color: 'text-blue-400' },
                  { label: 'Resolved', value: totals.resolved,
                    color: 'text-green-400' },
                  { label: 'Closed', value: totals.closed,
                    color: 'text-gray-400' },
                  { label: 'Escalated', value: totals.escalated,
                    color: 'text-red-400' },
                ].map(kpi => (
                  <div key={kpi.label}
                    className="bg-gray-800 rounded-xl p-4 kpi-card">
                    <p className="text-gray-400 text-xs mb-1 kpi-label">
                      {kpi.label}
                    </p>
                    <p className={`text-2xl md:text-3xl font-bold
                      kpi-value ${kpi.color}`}>
                      {kpi.value}
                    </p>
                    <p className="text-gray-500 text-xs mt-1">
                      Last {months} months
                    </p>
                  </div>
                ))}
              </div>

              {/* ─── Monthly Summary table ─────────────── */}
              <div className="mb-8">
                <h2 className="text-base md:text-lg font-semibold
                  text-white mb-3 section-title">
                  Monthly Ticket Summary
                </h2>
                <div className="bg-gray-800 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[560px]">
                      <thead>
                        <tr className="border-b border-gray-700">
                          <th className="text-left px-4 py-3 text-xs
                            font-medium text-gray-400 uppercase">
                            Month
                          </th>
                          <th className="text-right px-4 py-3 text-xs
                            font-medium text-gray-400 uppercase">
                            Created
                          </th>
                          <th className="text-right px-4 py-3 text-xs
                            font-medium text-gray-400 uppercase">
                            Resolved
                          </th>
                          <th className="text-right px-4 py-3 text-xs
                            font-medium text-gray-400 uppercase
                            hidden sm:table-cell">
                            Closed
                          </th>
                          <th className="text-right px-4 py-3 text-xs
                            font-medium text-gray-400 uppercase
                            hidden sm:table-cell">
                            Escalated
                          </th>
                          <th className="text-right px-4 py-3 text-xs
                            font-medium text-gray-400 uppercase">
                            Avg Resolution
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {monthly.map((m, i) => (
                          <tr key={i}
                            className="border-b border-gray-700/50
                              hover:bg-gray-700/20 transition">
                            <td className="px-4 py-3 text-white
                              font-medium whitespace-nowrap">
                              {m.month}
                            </td>
                            <td className="px-4 py-3 text-right
                              text-blue-400">
                              {m.totalCreated}
                            </td>
                            <td className="px-4 py-3 text-right
                              text-green-400">
                              {m.resolved}
                            </td>
                            <td className="px-4 py-3 text-right
                              text-gray-400 hidden sm:table-cell">
                              {m.closed}
                            </td>
                            <td className="px-4 py-3 text-right
                              hidden sm:table-cell">
                              {m.escalated > 0 ? (
                                <span className="text-red-400">
                                  {m.escalated}
                                </span>
                              ) : (
                                <span className="text-gray-600">0</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right
                              text-gray-300 whitespace-nowrap">
                              {fmt(m.avgResolutionHours)}
                            </td>
                          </tr>
                        ))}

                        {/* Totals row */}
                        <tr className="border-t-2 border-gray-600
                          bg-gray-700/30 font-semibold">
                          <td className="px-4 py-3 text-gray-300">
                            Total
                          </td>
                          <td className="px-4 py-3 text-right text-blue-400">
                            {totals.totalCreated}
                          </td>
                          <td className="px-4 py-3 text-right text-green-400">
                            {totals.resolved}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-400
                            hidden sm:table-cell">
                            {totals.closed}
                          </td>
                          <td className="px-4 py-3 text-right text-red-400
                            hidden sm:table-cell">
                            {totals.escalated}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-500">
                            —
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {monthly.every(m => m.totalCreated === 0) && (
                    <p className="text-gray-500 text-sm text-center py-8">
                      No ticket data for this period.
                    </p>
                  )}
                </div>
              </div>

              {/* ─── Agent Performance table ───────────── */}
              <div>
                <h2 className="text-base md:text-lg font-semibold
                  text-white mb-3 section-title">
                  Agent Performance
                </h2>
                <div className="bg-gray-800 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[560px]">
                      <thead>
                        <tr className="border-b border-gray-700">
                          <th className="text-left px-4 py-3 text-xs
                            font-medium text-gray-400 uppercase">
                            Agent
                          </th>
                          <th className="text-right px-4 py-3 text-xs
                            font-medium text-gray-400 uppercase">
                            Assigned
                          </th>
                          <th className="text-right px-4 py-3 text-xs
                            font-medium text-gray-400 uppercase">
                            Resolved
                          </th>
                          <th className="text-right px-4 py-3 text-xs
                            font-medium text-gray-400 uppercase
                            hidden md:table-cell">
                            Closed
                          </th>
                          <th className="text-right px-4 py-3 text-xs
                            font-medium text-gray-400 uppercase
                            hidden md:table-cell">
                            Active
                          </th>
                          <th className="text-right px-4 py-3 text-xs
                            font-medium text-gray-400 uppercase
                            hidden lg:table-cell">
                            Avg Resolution
                          </th>
                          <th className="px-4 py-3 text-xs font-medium
                            text-gray-400 uppercase bar-cell
                            hidden lg:table-cell">
                            Resolution Rate
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {agents.map((a, i) => (
                          <tr key={i}
                            className="border-b border-gray-700/50
                              hover:bg-gray-700/20 transition">
                            <td className="px-4 py-3">
                              <p className="text-white font-medium
                                whitespace-nowrap">
                                {a.agentName}
                              </p>
                              <p className="text-gray-500 text-xs
                                hidden sm:block">
                                {a.email}
                              </p>
                            </td>
                            <td className="px-4 py-3 text-right
                              text-gray-300">
                              {a.totalAssigned}
                            </td>
                            <td className="px-4 py-3 text-right
                              text-green-400">
                              {a.resolved}
                            </td>
                            <td className="px-4 py-3 text-right
                              text-gray-400 hidden md:table-cell">
                              {a.closed}
                            </td>
                            <td className="px-4 py-3 text-right
                              hidden md:table-cell">
                              {a.activeTickets > 0 ? (
                                <span className="text-blue-400">
                                  {a.activeTickets}
                                </span>
                              ) : (
                                <span className="text-gray-600">0</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right
                              text-gray-300 hidden lg:table-cell
                              whitespace-nowrap">
                              {fmt(a.avgResolutionHours)}
                            </td>
                            <td className="px-4 py-3 w-40 bar-cell
                              hidden lg:table-cell">
                              <ResolutionBar rate={a.resolutionRate} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {agents.length === 0 && (
                    <p className="text-gray-500 text-sm text-center py-8">
                      No agents found.
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}