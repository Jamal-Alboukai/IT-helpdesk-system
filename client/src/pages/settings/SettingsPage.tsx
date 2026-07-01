import { useState, useEffect } from 'react';
import {
  settingsService,
  CategoryDetail,
  PriorityDetail,
  StatusDetail,
} from '../../services/settingsService';

// ─── Tab type ─────────────────────────────────────────────────
type Tab = 'categories' | 'priorities' | 'statuses';

// ─── Small reusable toggle badge ──────────────────────────────
function ActiveBadge({ isActive }: { isActive: boolean }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium
      ${isActive
        ? 'bg-green-500/10 text-green-400 border border-green-500/20'
        : 'bg-gray-500/10 text-gray-500 border border-gray-600'
      }`}>
      {isActive ? 'Active' : 'Inactive'}
    </span>
  );
}

// ─── Categories tab ───────────────────────────────────────────
function CategoriesTab() {
  const [categories, setCategories] = useState<CategoryDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // ─── Add form state ─────────────────────────────────────────
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [adding, setAdding] = useState(false);

  // ─── Edit state ─────────────────────────────────────────────
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    setLoading(true);
    try {
      const data = await settingsService.getCategories();
      setCategories(data);
    } catch {
      setError('Failed to load categories.');
    } finally {
      setLoading(false);
    }
  }

  function flash(msg: string) {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3000);
  }

  // ─── Add ────────────────────────────────────────────────────
  async function handleAdd() {
    if (!newName.trim()) return;
    setAdding(true);
    setError('');
    try {
      const created = await settingsService.createCategory({
        name: newName.trim(),
        description: newDescription.trim() || undefined,
      });
      setCategories(prev => [...prev, created]);
      setNewName('');
      setNewDescription('');
      setShowAddForm(false);
      flash('Category added.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add category.');
    } finally {
      setAdding(false);
    }
  }

  // ─── Save edit ──────────────────────────────────────────────
  async function handleSaveEdit(id: string) {
    setSaving(true);
    setError('');
    try {
      const updated = await settingsService.updateCategory(id, {
        name: editName.trim(),
        description: editDescription.trim() || undefined,
      });
      setCategories(prev => prev.map(c => c.id === id ? updated : c));
      setEditingId(null);
      flash('Category updated.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update category.');
    } finally {
      setSaving(false);
    }
  }

  // ─── Toggle active ──────────────────────────────────────────
  async function handleToggleActive(cat: CategoryDetail) {
    setError('');
    try {
      const updated = await settingsService.updateCategory(cat.id, {
        isActive: !cat.isActive,
      });
      setCategories(prev => prev.map(c => c.id === cat.id ? updated : c));
      flash(`Category ${updated.isActive ? 'activated' : 'deactivated'}.`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update category.');
    }
  }

  function startEdit(cat: CategoryDetail) {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditDescription(cat.description || '');
    setShowAddForm(false);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName('');
    setEditDescription('');
  }

  if (loading) return (
    <p className="text-gray-400 text-sm py-8 text-center">
      Loading categories...
    </p>
  );

  return (
    <div className="space-y-4">

      {/* Feedback */}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}
      {success && (
        <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
          <p className="text-green-400 text-sm">{success}</p>
        </div>
      )}

      {/* Add button */}
      {!showAddForm && (
        <button
          onClick={() => { setShowAddForm(true); cancelEdit(); }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700
            text-white text-sm font-medium rounded-lg transition"
        >
          + Add Category
        </button>
      )}

      {/* Add form */}
      {showAddForm && (
        <div className="bg-gray-700/50 border border-gray-600
          rounded-xl p-4 space-y-3">
          <p className="text-white text-sm font-medium">New Category</p>
          <input
            type="text"
            placeholder="Category name *"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600
              rounded-lg text-white placeholder-gray-400 text-sm
              focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder="Description (optional)"
            value={newDescription}
            onChange={e => setNewDescription(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600
              rounded-lg text-white placeholder-gray-400 text-sm
              focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={!newName.trim() || adding}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700
                disabled:opacity-50 text-white text-sm
                font-medium rounded-lg transition"
            >
              {adding ? 'Adding...' : 'Add'}
            </button>
            <button
              onClick={() => {
                setShowAddForm(false);
                setNewName('');
                setNewDescription('');
              }}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-500
                text-gray-300 text-sm font-medium rounded-lg transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="space-y-2">
        {categories.map(cat => (
          <div key={cat.id}
            className="bg-gray-700/30 border border-gray-700
              rounded-xl p-4">

            {/* View / Edit row */}
            {editingId === cat.id ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600
                    rounded-lg text-white text-sm
                    focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  placeholder="Description (optional)"
                  value={editDescription}
                  onChange={e => setEditDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600
                    rounded-lg text-white placeholder-gray-400 text-sm
                    focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSaveEdit(cat.id)}
                    disabled={!editName.trim() || saving}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700
                      disabled:opacity-50 text-white text-xs
                      font-medium rounded-lg transition"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="px-3 py-1.5 bg-gray-600 hover:bg-gray-500
                      text-gray-300 text-xs font-medium rounded-lg transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-white text-sm font-medium">
                      {cat.name}
                    </p>
                    <ActiveBadge isActive={cat.isActive} />
                  </div>
                  {cat.description && (
                    <p className="text-gray-400 text-xs">{cat.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => startEdit(cat)}
                    className="px-3 py-1.5 bg-gray-600 hover:bg-gray-500
                      text-gray-300 text-xs font-medium rounded-lg transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleToggleActive(cat)}
                    className={`px-3 py-1.5 text-xs font-medium
                      rounded-lg transition
                      ${cat.isActive
                        ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20'
                        : 'bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20'
                      }`}
                  >
                    {cat.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {categories.length === 0 && (
          <p className="text-gray-500 text-sm text-center py-8">
            No categories yet.
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Priorities tab ───────────────────────────────────────────
function PrioritiesTab() {
  const [priorities, setPriorities] = useState<PriorityDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newOrder, setNewOrder] = useState('');
  const [adding, setAdding] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editOrder, setEditOrder] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPriorities();
  }, []);

  async function loadPriorities() {
    setLoading(true);
    try {
      const data = await settingsService.getPriorities();
      setPriorities(data);
    } catch {
      setError('Failed to load priorities.');
    } finally {
      setLoading(false);
    }
  }

  function flash(msg: string) {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3000);
  }

  async function handleAdd() {
    if (!newName.trim() || !newOrder) return;
    setAdding(true);
    setError('');
    try {
      const created = await settingsService.createPriority({
        name: newName.trim(),
        displayOrder: parseInt(newOrder),
      });
      setPriorities(prev =>
        [...prev, created].sort((a, b) => a.displayOrder - b.displayOrder));
      setNewName('');
      setNewOrder('');
      setShowAddForm(false);
      flash('Priority added.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add priority.');
    } finally {
      setAdding(false);
    }
  }

  async function handleSaveEdit(id: string) {
    setSaving(true);
    setError('');
    try {
      const updated = await settingsService.updatePriority(id, {
        name: editName.trim(),
        displayOrder: parseInt(editOrder),
      });
      setPriorities(prev =>
        prev.map(p => p.id === id ? updated : p)
          .sort((a, b) => a.displayOrder - b.displayOrder));
      setEditingId(null);
      flash('Priority updated.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update priority.');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(p: PriorityDetail) {
    setError('');
    try {
      const updated = await settingsService.updatePriority(p.id, {
        isActive: !p.isActive,
      });
      setPriorities(prev => prev.map(x => x.id === p.id ? updated : x));
      flash(`Priority ${updated.isActive ? 'activated' : 'deactivated'}.`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update priority.');
    }
  }

  function startEdit(p: PriorityDetail) {
    setEditingId(p.id);
    setEditName(p.name);
    setEditOrder(String(p.displayOrder));
    setShowAddForm(false);
  }

  if (loading) return (
    <p className="text-gray-400 text-sm py-8 text-center">
      Loading priorities...
    </p>
  );

  return (
    <div className="space-y-4">

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}
      {success && (
        <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
          <p className="text-green-400 text-sm">{success}</p>
        </div>
      )}

      {!showAddForm && (
        <button
          onClick={() => { setShowAddForm(true); setEditingId(null); }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700
            text-white text-sm font-medium rounded-lg transition"
        >
          + Add Priority
        </button>
      )}

      {showAddForm && (
        <div className="bg-gray-700/50 border border-gray-600
          rounded-xl p-4 space-y-3">
          <p className="text-white text-sm font-medium">New Priority</p>
          <input
            type="text"
            placeholder="Priority name *"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600
              rounded-lg text-white placeholder-gray-400 text-sm
              focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="number"
            placeholder="Display order * (e.g. 5)"
            value={newOrder}
            min={1}
            onChange={e => setNewOrder(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600
              rounded-lg text-white placeholder-gray-400 text-sm
              focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-gray-500 text-xs">
            Existing orders: {priorities.map(p => p.displayOrder).join(', ')}
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={!newName.trim() || !newOrder || adding}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700
                disabled:opacity-50 text-white text-sm
                font-medium rounded-lg transition"
            >
              {adding ? 'Adding...' : 'Add'}
            </button>
            <button
              onClick={() => {
                setShowAddForm(false);
                setNewName('');
                setNewOrder('');
              }}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-500
                text-gray-300 text-sm font-medium rounded-lg transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {priorities.map(p => (
          <div key={p.id}
            className="bg-gray-700/30 border border-gray-700 rounded-xl p-4">
            {editingId === p.id ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600
                    rounded-lg text-white text-sm
                    focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="number"
                  value={editOrder}
                  min={1}
                  onChange={e => setEditOrder(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600
                    rounded-lg text-white text-sm
                    focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSaveEdit(p.id)}
                    disabled={!editName.trim() || !editOrder || saving}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700
                      disabled:opacity-50 text-white text-xs
                      font-medium rounded-lg transition"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="px-3 py-1.5 bg-gray-600 hover:bg-gray-500
                      text-gray-300 text-xs font-medium rounded-lg transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-gray-500 text-xs w-6 text-right">
                    #{p.displayOrder}
                  </span>
                  <p className="text-white text-sm font-medium">{p.name}</p>
                  <ActiveBadge isActive={p.isActive} />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => startEdit(p)}
                    className="px-3 py-1.5 bg-gray-600 hover:bg-gray-500
                      text-gray-300 text-xs font-medium rounded-lg transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleToggleActive(p)}
                    className={`px-3 py-1.5 text-xs font-medium
                      rounded-lg transition
                      ${p.isActive
                        ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20'
                        : 'bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20'
                      }`}
                  >
                    {p.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {priorities.length === 0 && (
          <p className="text-gray-500 text-sm text-center py-8">
            No priorities yet.
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Statuses tab (read only) ─────────────────────────────────
function StatusesTab() {
  const [statuses, setStatuses] = useState<StatusDetail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    settingsService.getStatuses()
      .then(setStatuses)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Status color map consistent with rest of app
  const colors: Record<string, string> = {
    'Open': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    'In Progress': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    'Pending': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    'Resolved': 'bg-green-500/10 text-green-400 border-green-500/20',
    'Closed': 'bg-gray-500/10 text-gray-400 border-gray-600',
  };

  if (loading) return (
    <p className="text-gray-400 text-sm py-8 text-center">
      Loading statuses...
    </p>
  );

  return (
    <div className="space-y-4">

      {/* Info banner */}
      <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <p className="text-blue-400 text-sm">
          Statuses are fixed to the ticket workflow and cannot be added or
          removed. The transition rules are enforced by the system.
        </p>
      </div>

      {/* Workflow diagram */}
      <div className="bg-gray-700/30 border border-gray-700 rounded-xl p-4">
        <p className="text-gray-400 text-xs font-medium uppercase mb-3">
          Transition Rules
        </p>
        <div className="space-y-1.5 text-xs text-gray-400">
          <p>Open → <span className="text-white">In Progress</span></p>
          <p>In Progress → <span className="text-white">Pending</span> or <span className="text-white">Resolved</span></p>
          <p>Pending → <span className="text-white">In Progress</span></p>
          <p>Resolved → <span className="text-white">Closed</span> or <span className="text-white">In Progress</span></p>
          <p>Closed → <span className="text-red-400">terminal (no further transitions)</span></p>
        </div>
      </div>

      {/* Status list */}
      <div className="space-y-2">
        {statuses.map(s => (
          <div key={s.id}
            className="bg-gray-700/30 border border-gray-700
              rounded-xl p-4 flex items-center gap-4">
            <span className="text-gray-500 text-xs w-6 text-right">
              #{s.displayOrder}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium
              border ${colors[s.name] || 'bg-gray-500/10 text-gray-400 border-gray-600'}`}>
              {s.name}
            </span>
            <ActiveBadge isActive={s.isActive} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Settings page ───────────────────────────────────────
export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('categories');

  const tabs: { key: Tab; label: string }[] = [
    { key: 'categories', label: 'Categories' },
    { key: 'priorities', label: 'Priorities' },
    { key: 'statuses', label: 'Statuses' },
  ];

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-3xl mx-auto">

        {/* ─── Header ───────────────────────────────────── */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-gray-400 text-sm mt-1">
            Manage categories, priorities, and system statuses
          </p>
        </div>

        {/* ─── Tabs ─────────────────────────────────────── */}
        <div className="flex gap-1 bg-gray-800 rounded-xl p-1 mb-6">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition
                ${activeTab === tab.key
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ─── Tab content ──────────────────────────────── */}
        <div className="bg-gray-800 rounded-xl p-6">
          {activeTab === 'categories' && <CategoriesTab />}
          {activeTab === 'priorities' && <PrioritiesTab />}
          {activeTab === 'statuses' && <StatusesTab />}
        </div>

      </div>
    </div>
  );
}