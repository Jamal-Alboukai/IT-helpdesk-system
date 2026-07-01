import { useState, useEffect } from 'react';
import {
  userService,
  UserListItem,
  RoleLookup
} from '../../services/userService';

export default function UsersPage() {
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [roles, setRoles] = useState<RoleLookup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  // ─── Create form state ─────────────────────────────────────
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [tempPassword, setTempPassword] = useState('');
  const [roleId, setRoleId] = useState('');
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [usersData, rolesData] = await Promise.all([
        userService.getAllUsers(),
        userService.getRoles(),
      ]);
      setUsers(usersData);
      setRoles(rolesData);
    } catch {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');

    if (!firstName || !lastName || !email || !tempPassword || !roleId) {
      setFormError('All fields are required');
      return;
    }

    setCreating(true);
    try {
      await userService.createUser({
        firstName, lastName, email, tempPassword, roleId
      });

      // Reset form
      setFirstName('');
      setLastName('');
      setEmail('');
      setTempPassword('');
      setRoleId('');
      setShowCreateForm(false);
      await loadData();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to create user');
    } finally {
      setCreating(false);
    }
  }

  async function handleToggleActive(id: string, currentStatus: boolean) {
    if (!window.confirm(
      `Are you sure you want to ${currentStatus ? 'deactivate' : 'activate'} this user?`
    )) return;

    try {
      await userService.toggleActive(id);
      setUsers(prev => prev.map(u =>
        u.id === id ? { ...u, isActive: !u.isActive } : u
      ));
    } catch {
      setError('Failed to update user status');
    }
  }

  // ─── Role badge ────────────────────────────────────────────
  function RoleBadge({ role }: { role: string }) {
    const colors: Record<string, string> = {
      Admin: 'bg-red-500/10 text-red-400 border border-red-500/20',
      ITSupportAgent: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
      Employee: 'bg-green-500/10 text-green-400 border border-green-500/20',
      Manager: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium
        ${colors[role] || 'bg-gray-500/10 text-gray-400'}`}>
        {role}
      </span>
    );
  }

  return (
    <div className="p-6">

      {/* ─── Header ─────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">User Management</h1>
          <p className="text-gray-400 text-sm mt-1">
            {users.length} users in the system
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700
            text-white text-sm font-medium rounded-lg transition"
        >
          {showCreateForm ? 'Cancel' : '+ New User'}
        </button>
      </div>

      {/* ─── Error ──────────────────────────────────────── */}
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* ─── Create User Form ────────────────────────────── */}
      {showCreateForm && (
        <div className="bg-gray-800 rounded-xl p-5 mb-6 border border-gray-700">
          <h2 className="text-white font-medium mb-4">Create New User</h2>

          {formError && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400 text-sm">{formError}</p>
            </div>
          )}

          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">
                  First Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600
                    rounded-lg text-white text-sm
                    focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={creating}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">
                  Last Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600
                    rounded-lg text-white text-sm
                    focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={creating}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                Email <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600
                  rounded-lg text-white text-sm
                  focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={creating}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">
                  Temporary Password <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={tempPassword}
                  onChange={(e) => setTempPassword(e.target.value)}
                  placeholder="Min 8 chars"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600
                    rounded-lg text-white text-sm
                    focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={creating}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">
                  Role <span className="text-red-400">*</span>
                </label>
                <select
                  value={roleId}
                  onChange={(e) => setRoleId(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600
                    rounded-lg text-white text-sm
                    focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={creating}
                >
                  <option value="">Select role</option>
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600
                  text-gray-300 text-sm rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700
                  disabled:opacity-50 text-white text-sm
                  font-medium rounded-lg transition"
              >
                {creating ? 'Creating...' : 'Create User'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─── Users Table ─────────────────────────────────── */}
      <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left px-4 py-3 text-xs font-medium
                text-gray-400 uppercase">Name</th>
              <th className="text-left px-4 py-3 text-xs font-medium
                text-gray-400 uppercase">Email</th>
              <th className="text-left px-4 py-3 text-xs font-medium
                text-gray-400 uppercase">Role</th>
              <th className="text-left px-4 py-3 text-xs font-medium
                text-gray-400 uppercase">Status</th>
              <th className="text-left px-4 py-3 text-xs font-medium
                text-gray-400 uppercase">Created</th>
              <th className="text-left px-4 py-3 text-xs font-medium
                text-gray-400 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                  Loading users...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                  No users found
                </td>
              </tr>
            ) : (
              users.map(user => (
                <tr key={user.id}
                  className="border-b border-gray-700/50 hover:bg-gray-700/30 transition">
                  <td className="px-4 py-3">
                    <p className="text-white text-sm font-medium">
                      {user.fullName}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-gray-300 text-sm">{user.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <RoleBadge role={user.role} />
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium
                      ${user.isActive
                        ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                        : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                      }`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-gray-400 text-sm">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggleActive(user.id, user.isActive)}
                      className={`text-xs font-medium transition
                        ${user.isActive
                          ? 'text-red-400 hover:text-red-300'
                          : 'text-green-400 hover:text-green-300'
                        }`}
                    >
                      {user.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}