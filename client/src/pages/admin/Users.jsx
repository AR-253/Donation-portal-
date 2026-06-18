import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import api from '../../api/axios';
import AdminLayout from '../../components/AdminLayout';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });

  const fetchUsers = async () => {
    try {
      const response = await api.get('/admin/users');
      setUsers(response.data.users || []);
    } catch (err) {
      console.error('Error loading users:', err);
      setError('Failed to fetch users list.');
      toast.error('Failed to load users list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Lock background scrolling when modal is open
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isModalOpen]);

  const handlePromoteUser = async (id, name) => {
    if (!window.confirm(`Are you sure you want to promote ${name} to an Administrator? This action cannot be undone.`)) {
      return;
    }

    try {
      await api.patch(`/admin/users/${id}/promote`);
      toast.success(`${name} has been promoted to Admin!`);
      fetchUsers();
    } catch (err) {
      toast.error('Failed to promote user: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const openCreateModal = () => {
    setFormData({ name: '', email: '', password: '' });
    setIsModalOpen(true);
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setFormLoading(true);

    if (!formData.name || !formData.email || !formData.password) {
      toast.error('All fields are required.');
      setFormLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters.');
      setFormLoading(false);
      return;
    }

    try {
      const response = await api.post('/admin/users/create-admin', formData);
      toast.success(response.data.message || 'Admin account created successfully!');
      setIsModalOpen(false);
      fetchUsers(); // Refresh table list
    } catch (err) {
      console.error('Create admin error:', err);
      toast.error(err.response?.data?.message || 'Failed to create admin account.');
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">User Directory</h1>
            <p className="text-gray-500 text-sm mt-1">Manage platform members and assign administrative privileges.</p>
          </div>
          <button
            onClick={openCreateModal}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition shadow flex items-center gap-2"
          >
            <span>➕</span> Create New Admin
          </button>
        </div>

        {error && (
          <div className="p-4 text-sm text-red-800 bg-red-50 border border-red-200 rounded-2xl">
            {error}
          </div>
        )}

        {/* Users Table */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3.5 font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3.5 font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3.5 font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3.5 font-semibold text-gray-500 uppercase tracking-wider">Registered Date</th>
                  <th className="px-6 py-3.5 font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-400">No users registered on the portal.</td>
                  </tr>
                ) : (
                  users.map((userItem) => (
                    <tr key={userItem.id} className="hover:bg-gray-50/50 transition">
                      <td className="px-6 py-4 font-bold text-gray-950">{userItem.name}</td>
                      <td className="px-6 py-4 text-gray-600">{userItem.email}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-1 text-xs font-bold rounded-full border ${
                            userItem.role === 'admin'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100 uppercase'
                              : 'bg-gray-50 text-gray-600 border-gray-100 capitalize'
                          }`}
                        >
                          {userItem.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500">{new Date(userItem.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-right">
                        {userItem.role === 'admin' ? (
                          <span className="text-xs text-gray-400 font-medium italic px-3">Already Admin</span>
                        ) : (
                          <button
                            onClick={() => handlePromoteUser(userItem.id, userItem.name)}
                            className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-lg text-xs font-semibold transition shadow-sm"
                          >
                            Promote to Admin
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create Admin Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-2xl max-w-md w-full space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-900">Create New Administrator</h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleCreateAdmin} className="space-y-4">
                <div>
                  <label className="block mb-1 text-sm font-semibold text-gray-700">Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                    placeholder="Enter full name"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-1 text-sm font-semibold text-gray-700">Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                    placeholder="admin@givehope.org"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-1 text-sm font-semibold text-gray-700">Password *</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                    placeholder="••••••••"
                    required
                  />
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white font-bold rounded-xl text-sm transition"
                  >
                    {formLoading ? 'Creating...' : 'Create Admin'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;
