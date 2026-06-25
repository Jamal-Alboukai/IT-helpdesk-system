import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as signalR from '@microsoft/signalr';
import {
  notificationService,
  NotificationItem
} from '../../services/notificationService';

// ─── Helper: Get cookie ────────────────────────────────────────
function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
}

export default function NotificationBell() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const connectionRef = useRef<signalR.HubConnection | null>(null);

  // ─── SignalR connection ────────────────────────────────────
  useEffect(() => {
    const token = getCookie('auth_token');
    if (!token) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl('http://localhost:5197/hubs/notifications', {
        accessTokenFactory: () => token,
        skipNegotiation: true,
        transport: signalR.HttpTransportType.WebSockets
      })
      .withAutomaticReconnect()
      .build();

    // ─── Listen for real-time notifications ───────────────
    connection.on('ReceiveNotification', (notification: NotificationItem) => {
      // Add to notifications list
      setNotifications(prev => [notification, ...prev]);
      // Increment unread count
      setUnreadCount(c => c + 1);
    });

    // ─── Start connection ──────────────────────────────────
    connection.start()
      .then(() => console.log('SignalR connected'))
      .catch(err => console.error('SignalR connection failed:', err));

    connectionRef.current = connection;

    // ─── Cleanup on unmount ────────────────────────────────
    return () => {
      connection.stop();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Initial unread count load ─────────────────────────────
  useEffect(() => {
    loadUnreadCount();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Close dropdown when clicking outside ─────────────────
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function loadUnreadCount() {
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch {
      // silently fail
    }
  }

  async function loadNotifications() {
    setLoading(true);
    try {
      const result = await notificationService.getMyNotifications();
      setNotifications(result);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  function toggleDropdown() {
    if (!isOpen) loadNotifications();
    setIsOpen(!isOpen);
  }

  async function handleNotificationClick(notification: NotificationItem) {
    // Mark as read
    if (!notification.isRead) {
      await notificationService.markAsRead(notification.id);
      setUnreadCount(c => Math.max(0, c - 1));
      setNotifications(prev =>
        prev.map(n => n.id === notification.id
          ? { ...n, isRead: true }
          : n)
      );
    }

    // Navigate to ticket if exists
    if (notification.ticketId) {
      navigate(`/tickets/${notification.ticketId}`);
      setIsOpen(false);
    }
  }

  async function handleMarkAllRead() {
    await notificationService.markAllAsRead();
    setUnreadCount(0);
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  }

  // ─── Relative time formatting ──────────────────────────────
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

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={toggleDropdown}
        className="relative p-2 text-gray-400 hover:text-white
          hover:bg-gray-700 rounded-lg transition"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor"
          viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center
            justify-center min-w-[18px] h-[18px] px-1 bg-red-500
            text-white text-xs font-bold rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-gray-800
          border border-gray-700 rounded-xl shadow-xl z-50
          max-h-96 overflow-hidden flex flex-col">

          {/* Header */}
          <div className="flex items-center justify-between p-3
            border-b border-gray-700">
            <h3 className="text-white text-sm font-semibold">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-blue-400 hover:text-blue-300 text-xs transition"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* List */}
          <div className="overflow-y-auto flex-1">
            {loading ? (
              <p className="text-gray-500 text-sm text-center py-6">
                Loading...
              </p>
            ) : notifications.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-6">
                No notifications
              </p>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`w-full text-left p-3 border-b border-gray-700/50
                    hover:bg-gray-700/50 transition
                    ${!n.isRead ? 'bg-blue-500/5' : ''}`}
                >
                  <div className="flex items-start gap-2">
                    {!n.isRead && (
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full
                        bg-blue-500 flex-shrink-0" />
                    )}
                    <div className={!n.isRead ? '' : 'pl-3.5'}>
                      <p className="text-gray-200 text-sm leading-snug">
                        {n.message}
                      </p>
                      <p className="text-gray-500 text-xs mt-1">
                        {timeAgo(n.createdAt)}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}