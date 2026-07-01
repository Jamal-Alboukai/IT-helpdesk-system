import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  notificationService,
  NotificationItem
} from '../../services/notificationService';

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadNotifications();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadNotifications() {
    setLoading(true);
    try {
      const result = await notificationService.getMyNotifications();
      setNotifications(result);
    } catch {
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkAllRead() {
    await notificationService.markAllAsRead();
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  }

  async function handleNotificationClick(notification: NotificationItem) {
    if (!notification.isRead) {
      await notificationService.markAsRead(notification.id);
      setNotifications(prev =>
        prev.map(n => n.id === notification.id
          ? { ...n, isRead: true }
          : n)
      );
    }
    if (notification.ticketId) {
      navigate(`/tickets/${notification.ticketId}`);
    }
  }

  function timeAgo(dateStr: string): string {
    const seconds = Math.floor(
      (Date.now() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="p-6 max-w-3xl mx-auto">

      {/* ─── Header ─────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Notifications</h1>
          <p className="text-gray-400 text-sm mt-1">
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
              : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600
              text-gray-300 text-sm font-medium rounded-lg transition"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* ─── Error ──────────────────────────────────────── */}
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* ─── Notifications list ──────────────────────────── */}
      <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700">
        {loading ? (
          <div className="p-8 text-center">
            <p className="text-gray-400">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-4xl mb-3">🔔</p>
            <p className="text-white font-medium">No notifications yet</p>
            <p className="text-gray-400 text-sm mt-1">
              You'll be notified about ticket updates here
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-700">
            {notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                className={`w-full text-left p-4 hover:bg-gray-700/50
                  transition flex items-start gap-4
                  ${!n.isRead ? 'bg-blue-500/5' : ''}`}
              >
                {/* Unread indicator */}
                <div className="mt-1.5 flex-shrink-0">
                  {!n.isRead ? (
                    <span className="w-2.5 h-2.5 rounded-full
                      bg-blue-500 block" />
                  ) : (
                    <span className="w-2.5 h-2.5 rounded-full
                      bg-gray-700 block" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm leading-snug
                    ${!n.isRead ? 'text-white font-medium' : 'text-gray-300'}`}>
                    {n.message}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    {n.ticketReference && (
                      <span className="text-blue-400 text-xs font-mono">
                        {n.ticketReference}
                      </span>
                    )}
                    <span className="text-gray-500 text-xs">
                      {timeAgo(n.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Arrow */}
                {n.ticketId && (
                  <span className="text-gray-600 text-sm flex-shrink-0 mt-0.5">
                    →
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}