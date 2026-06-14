import { useState, useEffect } from 'react';
import { ticketService, ActivityLogEntry } from '../../services/ticketService';

interface HistoryTimelineProps {
  ticketId: string;
}

export default function HistoryTimeline({ ticketId }: HistoryTimelineProps) {
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    ticketService.getTicketHistory(ticketId)
      .then(setLogs)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [ticketId]);

  if (loading || logs.length === 0) return null;

  // Show last 3 by default, all when expanded
  const visibleLogs = expanded ? logs : logs.slice(-3);

  return (
    <div className="bg-gray-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-gray-400">
          History
        </h2>
        {logs.length > 3 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-blue-400 hover:text-blue-300 text-xs transition"
          >
            {expanded ? 'Show less' : `Show all (${logs.length})`}
          </button>
        )}
      </div>

      <div className="space-y-3">
        {visibleLogs.map((log, index) => (
          <div key={log.id} className="flex gap-3">
            {/* Timeline dot + line */}
            <div className="flex flex-col items-center">
              <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
              {index < visibleLogs.length - 1 && (
                <div className="w-px flex-1 bg-gray-700 mt-1" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 pb-3">
              <div className="flex items-center justify-between">
                <p className="text-white text-sm font-medium">
                  {log.action}
                </p>
                <span className="text-gray-500 text-xs">
                  {new Date(log.createdAt).toLocaleString()}
                </span>
              </div>
              {(log.oldValue || log.newValue) && (
                <p className="text-gray-400 text-xs mt-0.5">
                  {log.oldValue && (
                    <span className="line-through text-gray-500">
                      {log.oldValue}
                    </span>
                  )}
                  {log.oldValue && log.newValue && ' → '}
                  {log.newValue}
                </p>
              )}
              <p className="text-gray-500 text-xs mt-0.5">
                by {log.performedBy}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}