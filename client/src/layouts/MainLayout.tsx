import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from '../components/common/NotificationBell';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  // ─── Nav items per role ────────────────────────────────────
  const navItems = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: '⊞',
      roles: ['Admin', 'Manager'],
    },
    {
      label: 'Tickets',
      path: '/tickets',
      icon: '🎫',
      roles: ['Admin', 'Manager', 'ITSupportAgent', 'Employee'],
    },
    {
      label: 'Users',
      path: '/users',
      icon: '👥',
      roles: ['Admin'],
    },
    {
      label: 'Reports',
      path: '/reports',
      icon: '📊',
      roles: ['Admin', 'Manager'],
    },
    {
      label: 'Settings',
      path: '/settings',
      icon: '⚙️',
      roles: ['Admin'],
    },
      {
    label: 'Notifications',
    path: '/notifications',
    icon: '🔔',
    roles: ['Admin', 'Manager', 'ITSupportAgent', 'Employee'],
  },
  ].filter(item => item.roles.includes(user?.role || ''));

  function isActive(path: string) {
    return location.pathname.startsWith(path);
  }

  return (
    <div className="flex h-screen bg-gray-900 overflow-hidden">

      {/* ─── Sidebar ──────────────────────────────────────── */}
      <div className={`flex flex-col bg-gray-800 border-r border-gray-700
        transition-all duration-300 ${collapsed ? 'w-16' : 'w-56'}`}>

        {/* Logo */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          {!collapsed && (
            <div>
              <p className="text-white font-bold text-sm">IDS Help Desk</p>
              <p className="text-gray-400 text-xs">{user?.role}</p>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-gray-400 hover:text-white transition p-1"
          >
            {collapsed ? '→' : '←'}
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 p-2 space-y-1">
          {navItems.map(item => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5
                rounded-lg text-sm font-medium transition
                ${isActive(item.path)
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                }`}
            >
              <span className="text-base">{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* User info + logout */}
        <div className="p-2 border-t border-gray-700">
          {!collapsed && (
            <div className="px-3 py-2 mb-1">
              <p className="text-white text-sm font-medium truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-gray-400 text-xs truncate">{user?.email}</p>
            </div>
          )}
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5
              rounded-lg text-sm font-medium text-gray-400
              hover:bg-red-500/10 hover:text-red-400 transition"
          >
            <span>🚪</span>
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </div>

      {/* ─── Main area ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top header bar */}
        <div className="flex items-center justify-end gap-2 px-6 py-3
          border-b border-gray-700 bg-gray-800/50">
          <NotificationBell />
        </div>

        {/* Page content */}
        <div className="flex-1 overflow-auto">
          {children}
        </div>

      </div>

    </div>
  );
}