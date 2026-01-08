'use client';

import { useState } from 'react';
import { AuthGuard } from '@/components/AuthGuard';
import { DashboardLayout } from '@/components/DashboardLayout';
import { trpc } from '@/lib/trpc';

export default function UsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const { data, isLoading, refetch } = trpc.user.list.useQuery({
    page,
    limit: 20,
    search: search || undefined,
  });

  const createMutation = trpc.user.create.useMutation({
    onSuccess: () => {
      setShowCreateModal(false);
      refetch();
    },
  });

  const updateMutation = trpc.user.update.useMutation({
    onSuccess: () => {
      setShowEditModal(false);
      setSelectedUser(null);
      refetch();
    },
  });

  const deleteMutation = trpc.user.delete.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const handleDelete = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }
    deleteMutation.mutate({ id: userId });
  };

  const handleEdit = (user: any) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">Users</h1>
                <p className="text-slate-600">Manage all user accounts and profiles</p>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-200 hover:scale-105"
              >
                <span>➕</span>
                <span>Add User</span>
              </button>
            </div>

            {/* Stats Cards */}
            {data && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="glass rounded-xl p-4">
                  <p className="text-sm font-medium text-slate-600 mb-1">Total Users</p>
                  <p className="text-2xl font-bold text-slate-900">{data.pagination.total}</p>
                </div>
                <div className="glass rounded-xl p-4">
                  <p className="text-sm font-medium text-slate-600 mb-1">Active Streaks</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {data.users.filter((u: { profile?: { currentStreak?: number } }) => u.profile?.currentStreak && u.profile.currentStreak > 0).length}
                  </p>
                </div>
                <div className="glass rounded-xl p-4">
                  <p className="text-sm font-medium text-slate-600 mb-1">With Profiles</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {data.users.filter((u: { profile?: any }) => u.profile).length}
                  </p>
                </div>
                <div className="glass rounded-xl p-4">
                  <p className="text-sm font-medium text-slate-600 mb-1">Page</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {page} / {data.pagination.totalPages}
                  </p>
                </div>
              </div>
            )}

            {/* Search */}
            <div className="glass rounded-xl p-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-slate-400 text-xl">🔍</span>
                </div>
                <input
                  type="text"
                  placeholder="Search by email, phone, or name..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
              </div>
            </div>

            {/* Users Table */}
            <div className="glass rounded-xl overflow-hidden">
              {isLoading ? (
                <div className="p-12 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
                  <p className="mt-4 text-slate-500">Loading users...</p>
                </div>
              ) : !data?.users.length ? (
                <div className="p-12 text-center">
                  <div className="text-6xl mb-4">👤</div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">No users found</h3>
                  <p className="text-slate-600 mb-6">Try adjusting your search or create a new user</p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Create User
                  </button>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                      <thead className="bg-slate-50/80">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                            User
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                            Profile
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                            Coins / Level
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                            Streak
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                            Roles
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                            Created
                          </th>
                          <th className="px-6 py-4 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-100">
                        {data.users.map((user: { id: string; displayName?: string; email?: string; phone?: string; profile?: any; roles: string[]; createdAt: string; [key: string]: any }) => (
                          <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-semibold text-slate-900">
                                  {user.displayName || '—'}
                                </div>
                                <div className="text-xs text-slate-500 mt-1">
                                  {user.email || user.phone || '—'}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-slate-900">
                                {user.profile?.gender ? (
                                  <span className="inline-flex items-center gap-1">
                                    {user.profile.gender.replace('_', ' ').toLowerCase()}
                                  </span>
                                ) : (
                                  '—'
                                )}
                                {user.profile?.ageBucket && (
                                  <span className="ml-2 text-xs text-slate-500">
                                    • {user.profile.ageBucket}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {user.profile?.totalCoins !== undefined ? (
                                <div>
                                  <div className="text-sm font-semibold text-yellow-600">
                                    🪙 {user.profile.totalCoins} coins
                                  </div>
                                  <div className="text-xs text-slate-500">
                                    Level {Math.floor((user.profile.totalCoins || 0) / 100) + 1}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-sm text-slate-400">—</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {user.profile?.currentStreak ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-lg">🔥</span>
                                  <div>
                                    <div className="text-sm font-semibold text-orange-600">
                                      {user.profile.currentStreak} days
                                    </div>
                                    {user.profile.longestStreak > user.profile.currentStreak && (
                                      <div className="text-xs text-slate-500">
                                        Best: {user.profile.longestStreak}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-sm text-slate-400">—</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex gap-1.5 flex-wrap">
                                {user.roles.map((role: string) => (
                                  <span
                                    key={role}
                                    className="px-2.5 py-1 text-xs font-medium rounded-full bg-gradient-to-r from-blue-100 to-blue-50 text-blue-700 border border-blue-200/60"
                                  >
                                    {role}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                              {new Date(user.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleEdit(user)}
                                  className="px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-lg font-medium transition-colors"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDelete(user.id)}
                                  className="px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {data.pagination.totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between">
                      <div className="text-sm text-slate-600">
                        Showing <span className="font-semibold text-slate-900">
                          {((page - 1) * data.pagination.limit) + 1}
                        </span> to{' '}
                        <span className="font-semibold text-slate-900">
                          {Math.min(page * data.pagination.limit, data.pagination.total)}
                        </span> of{' '}
                        <span className="font-semibold text-slate-900">{data.pagination.total}</span> users
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          disabled={page === 1}
                          className="px-4 py-2 border border-slate-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white transition-colors font-medium text-slate-700"
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => setPage((p) => p + 1)}
                          disabled={page >= data.pagination.totalPages}
                          className="px-4 py-2 border border-slate-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white transition-colors font-medium text-slate-700"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Create Modal */}
        {showCreateModal && (
          <CreateUserModal
            onClose={() => setShowCreateModal(false)}
            onSubmit={(data) => createMutation.mutate(data)}
            isLoading={createMutation.isLoading}
          />
        )}

        {/* Edit Modal */}
        {showEditModal && selectedUser && (
          <EditUserModal
            user={selectedUser}
            onClose={() => {
              setShowEditModal(false);
              setSelectedUser(null);
            }}
            onSubmit={(data) => updateMutation.mutate({ id: selectedUser.id, ...data })}
            isLoading={updateMutation.isLoading}
          />
        )}
      </DashboardLayout>
    </AuthGuard>
  );
}

function CreateUserModal({
  onClose,
  onSubmit,
  isLoading,
}: {
  onClose: () => void;
  onSubmit: (data: any) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    password: '',
    displayName: '',
    roles: ['USER'] as string[],
  });
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (authMethod === 'email' && !formData.email) {
      alert('Email is required');
      return;
    }
    if (authMethod === 'phone' && !formData.phone) {
      alert('Phone is required');
      return;
    }
    if (!formData.password || formData.password.length < 8) {
      alert('Password must be at least 8 characters');
      return;
    }
    onSubmit({
      email: authMethod === 'email' ? formData.email : undefined,
      phone: authMethod === 'phone' ? formData.phone : undefined,
      password: formData.password,
      displayName: formData.displayName || undefined,
      roles: formData.roles as any,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass rounded-2xl p-8 max-w-md w-full shadow-2xl animate-slide-up">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Create User</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Authentication Method</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAuthMethod('email')}
                className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all ${
                  authMethod === 'email'
                    ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Email
              </button>
              <button
                type="button"
                onClick={() => setAuthMethod('phone')}
                className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all ${
                  authMethod === 'phone'
                    ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Phone
              </button>
            </div>
          </div>
          {authMethod === 'email' ? (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Email *</label>
              <input
                type="email"
                placeholder="user@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                required
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Phone *</label>
              <input
                type="tel"
                placeholder="+1234567890"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                required
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Password *</label>
            <input
              type="password"
              placeholder="Minimum 8 characters"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              required
              minLength={8}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Display Name</label>
            <input
              type="text"
              placeholder="Optional"
              value={formData.displayName}
              onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Roles</label>
            <div className="flex gap-2 flex-wrap">
              {['USER', 'ADMIN', 'AGENCY', 'MERCHANT'].map((role) => (
                <label key={role} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.roles.includes(role)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({
                          ...formData,
                          roles: [...formData.roles, role],
                        });
                      } else {
                        setFormData({
                          ...formData,
                          roles: formData.roles.filter((r) => r !== role),
                        });
                      }
                    }}
                    className="mr-2 rounded"
                  />
                  <span className="text-sm text-slate-700">{role}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-slate-300 rounded-xl hover:bg-slate-50 font-medium text-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl hover:shadow-lg font-semibold disabled:opacity-50 transition-all"
            >
              {isLoading ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditUserModal({
  user,
  onClose,
  onSubmit,
  isLoading,
}: {
  user: any;
  onClose: () => void;
  onSubmit: (data: any) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    email: user.email || '',
    phone: user.phone || '',
    password: '',
    displayName: user.displayName || '',
    roles: user.roles || ['USER'],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updateData: any = {
      displayName: formData.displayName || undefined,
      roles: formData.roles as any,
    };
    if (formData.email) updateData.email = formData.email;
    if (formData.phone) updateData.phone = formData.phone;
    if (formData.password) {
      if (formData.password.length < 8) {
        alert('Password must be at least 8 characters');
        return;
      }
      updateData.password = formData.password;
    }
    onSubmit(updateData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass rounded-2xl p-8 max-w-md w-full shadow-2xl animate-slide-up">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Edit User</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              New Password (leave blank to keep current)
            </label>
            <input
              type="password"
              placeholder="Leave blank to keep current password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Display Name</label>
            <input
              type="text"
              value={formData.displayName}
              onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Roles</label>
            <div className="flex gap-2 flex-wrap">
              {['USER', 'ADMIN', 'AGENCY', 'MERCHANT'].map((role) => (
                <label key={role} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.roles.includes(role)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({
                          ...formData,
                          roles: [...formData.roles, role],
                        });
                      } else {
                        setFormData({
                          ...formData,
                          roles: formData.roles.filter((r) => r !== role),
                        });
                      }
                    }}
                    className="mr-2 rounded"
                  />
                  <span className="text-sm text-slate-700">{role}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-slate-300 rounded-xl hover:bg-slate-50 font-medium text-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl hover:shadow-lg font-semibold disabled:opacity-50 transition-all"
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
