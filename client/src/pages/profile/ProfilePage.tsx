import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  profileService,
  UserProfile,
} from '../../services/profileService';
import { authService } from '../../services/authService';

// ─── Role badge colors ─────────────────────────────────────────
function RoleBadge({ role }: { role: string }) {
  const colors: Record<string, string> = {
    Admin: 'bg-red-500/10 text-red-400 border border-red-500/20',
    ITSupportAgent: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
    Manager: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
    Employee: 'bg-green-500/10 text-green-400 border border-green-500/20',
  };
  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium
      ${colors[role] || 'bg-gray-500/10 text-gray-400 border border-gray-600'}`}>
      {role === 'ITSupportAgent' ? 'IT Support Agent' : role}
    </span>
  );
}

// ─── Initials avatar ───────────────────────────────────────────
function Avatar({
  firstName, lastName, size = 'lg'
}: {
  firstName: string;
  lastName: string;
  size?: 'sm' | 'lg';
}) {
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`
    .toUpperCase();

  // Consistent color based on initials
  const colors = [
    'bg-blue-500', 'bg-purple-500', 'bg-green-500',
    'bg-orange-500', 'bg-pink-500', 'bg-teal-500',
  ];
  const colorIndex = (firstName.charCodeAt(0) + lastName.charCodeAt(0)) %
    colors.length;
  const color = colors[colorIndex];

  const sizeClasses = size === 'lg'
    ? 'w-20 h-20 text-2xl'
    : 'w-10 h-10 text-sm';

  return (
    <div className={`${color} ${sizeClasses} rounded-full flex items-center
      justify-center text-white font-bold shrink-0`}>
      {initials}
    </div>
  );
}

export default function ProfilePage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  // ─── Profile state ─────────────────────────────────────────
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // ─── Edit name state ───────────────────────────────────────
  const [editingName, setEditingName] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [savingName, setSavingName] = useState(false);

  // ─── Change password state ─────────────────────────────────
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // ─── Load profile ──────────────────────────────────────────
  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    setLoading(true);
    try {
      const data = await profileService.getProfile();
      setProfile(data);
      setFirstName(data.firstName);
      setLastName(data.lastName);
    } catch {
      setError('Failed to load profile.');
    } finally {
      setLoading(false);
    }
  }

  function flash(msg: string) {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3000);
  }

  // ─── Save name ─────────────────────────────────────────────
  async function handleSaveName() {
    if (!firstName.trim() || !lastName.trim()) return;
    setSavingName(true);
    setError('');
    try {
      const updated = await profileService.updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });
      setProfile(updated);
      setEditingName(false);
      flash('Name updated successfully.');
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Failed to update name.');
    } finally {
      setSavingName(false);
    }
  }

  function handleCancelEdit() {
    setEditingName(false);
    if (profile) {
      setFirstName(profile.firstName);
      setLastName(profile.lastName);
    }
  }

  // ─── Change password ───────────────────────────────────────
  async function handleChangePassword() {
    setPasswordError('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('All fields are required.');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }
    if (currentPassword === newPassword) {
      setPasswordError(
        'New password must be different from current password.');
      return;
    }

    setSavingPassword(true);
    try {
      const result = await authService.changePassword({
        currentPassword,
        newPassword,
      });

      // Update token in cookie so user stays logged in
      if (result.token) {
        login(result.token);
      }

      setShowPasswordForm(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      flash('Password changed successfully.');
    } catch (err: any) {
      setPasswordError(
        err.response?.data?.message || 'Failed to change password.');
    } finally {
      setSavingPassword(false);
    }
  }

  function handleCancelPassword() {
    setShowPasswordForm(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
  }

  // ─── Loading ───────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center
        justify-center">
        <p className="text-gray-400">Loading profile...</p>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center
        justify-center">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-4 md:p-6">
      <div className="max-w-2xl mx-auto">

        {/* ─── Header ───────────────────────────────────── */}
        <div className="mb-6">
          <h1 className="text-xl md:text-2xl font-bold text-white">
            My Profile
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Manage your account information
          </p>
        </div>

        {/* ─── Feedback ─────────────────────────────────── */}
        {success && (
          <div className="mb-4 p-3 bg-green-500/10 border
            border-green-500/20 rounded-lg">
            <p className="text-green-400 text-sm">✓ {success}</p>
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border
            border-red-500/20 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* ─── Avatar + basic info card ─────────────────── */}
        <div className="bg-gray-800 rounded-xl p-5 md:p-6 mb-4">
          <div className="flex flex-col sm:flex-row items-center
            sm:items-start gap-5">

            {/* Avatar */}
            {profile && (
              <Avatar
                firstName={profile.firstName}
                lastName={profile.lastName}
                size="lg"
              />
            )}

            {/* Info */}
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-xl font-bold text-white">
                {profile?.fullName}
              </h2>
              <p className="text-gray-400 text-sm mt-1">
                {profile?.email}
              </p>
              <div className="mt-2">
                <RoleBadge role={profile?.role || ''} />
              </div>
              <p className="text-gray-500 text-xs mt-3">
                Member since{' '}
                {profile?.createdAt
                  ? new Date(profile.createdAt).toLocaleDateString(
                      undefined,
                      { year: 'numeric', month: 'long', day: 'numeric' }
                    )
                  : '—'}
              </p>
            </div>
          </div>
        </div>

        {/* ─── Edit Name card ───────────────────────────── */}
        <div className="bg-gray-800 rounded-xl p-5 md:p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-medium">Personal Information</h3>
            {!editingName && (
              <button
                onClick={() => setEditingName(true)}
                className="text-blue-400 hover:text-blue-300
                  text-sm transition"
              >
                Edit
              </button>
            )}
          </div>

          {editingName ? (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border
                      border-gray-600 rounded-lg text-white text-sm
                      focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border
                      border-gray-600 rounded-lg text-white text-sm
                      focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSaveName}
                  disabled={
                    !firstName.trim() ||
                    !lastName.trim() ||
                    savingName
                  }
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700
                    disabled:opacity-50 text-white text-sm
                    font-medium rounded-lg transition"
                >
                  {savingName ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600
                    text-gray-300 text-sm font-medium rounded-lg
                    transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500 mb-1">First Name</p>
                  <p className="text-white text-sm">{profile?.firstName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Last Name</p>
                  <p className="text-white text-sm">{profile?.lastName}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Email</p>
                <p className="text-white text-sm">{profile?.email}</p>
                <p className="text-gray-600 text-xs mt-0.5">
                  Email cannot be changed. Contact Admin if needed.
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Role</p>
                <p className="text-white text-sm">
                  {profile?.role === 'ITSupportAgent'
                    ? 'IT Support Agent'
                    : profile?.role}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ─── Change Password card ──────────────────────── */}
        <div className="bg-gray-800 rounded-xl p-5 md:p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-white font-medium">Password</h3>
              <p className="text-gray-500 text-xs mt-0.5">
                Keep your account secure
              </p>
            </div>
            {!showPasswordForm && (
              <button
                onClick={() => setShowPasswordForm(true)}
                className="text-blue-400 hover:text-blue-300
                  text-sm transition"
              >
                Change Password
              </button>
            )}
          </div>

          {showPasswordForm && (
            <div className="space-y-3">

              {passwordError && (
                <div className="p-3 bg-red-500/10 border
                  border-red-500/20 rounded-lg">
                  <p className="text-red-400 text-sm">{passwordError}</p>
                </div>
              )}

              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full px-3 py-2 bg-gray-700 border
                    border-gray-600 rounded-lg text-white
                    placeholder-gray-500 text-sm
                    focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  className="w-full px-3 py-2 bg-gray-700 border
                    border-gray-600 rounded-lg text-white
                    placeholder-gray-500 text-sm
                    focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full px-3 py-2 bg-gray-700 border
                    border-gray-600 rounded-lg text-white
                    placeholder-gray-500 text-sm
                    focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Password strength hint */}
              {newPassword && (
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map(i => (
                      <div
                        key={i}
                        className={`h-1 w-8 rounded-full transition-all
                          ${newPassword.length >= i * 3
                            ? i <= 1 ? 'bg-red-500'
                              : i <= 2 ? 'bg-orange-500'
                              : i <= 3 ? 'bg-yellow-500'
                              : 'bg-green-500'
                            : 'bg-gray-600'
                          }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-gray-500">
                    {newPassword.length < 4 ? 'Too short'
                      : newPassword.length < 7 ? 'Weak'
                      : newPassword.length < 10 ? 'Fair'
                      : 'Strong'}
                  </span>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={handleChangePassword}
                  disabled={savingPassword}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700
                    disabled:opacity-50 text-white text-sm
                    font-medium rounded-lg transition"
                >
                  {savingPassword ? 'Saving...' : 'Update Password'}
                </button>
                <button
                  onClick={handleCancelPassword}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600
                    text-gray-300 text-sm font-medium rounded-lg
                    transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {!showPasswordForm && (
            <p className="text-gray-500 text-sm">
              •••••••••••••
            </p>
          )}
        </div>

        {/* ─── Account info card ────────────────────────── */}
        <div className="bg-gray-800 rounded-xl p-5 md:p-6">
          <h3 className="text-white font-medium mb-4">Account Status</h3>
          <div className="flex items-center gap-3">
            <div className={`w-2.5 h-2.5 rounded-full
              ${profile?.isActive ? 'bg-green-500' : 'bg-red-500'}`}
            />
            <span className="text-gray-300 text-sm">
              {profile?.isActive ? 'Active account' : 'Inactive account'}
            </span>
          </div>
          <p className="text-gray-500 text-xs mt-2">
            Contact your Admin to change account status.
          </p>
        </div>

      </div>
    </div>
  );
}