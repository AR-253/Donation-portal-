import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import api from '../../api/axios';
import AdminLayout from '../../components/AdminLayout';

const AdminAudits = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filters State
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = {};
      if (category) params.category = category;
      if (search) params.search = search;

      const response = await api.get('/admin/audit-logs', { params });
      setLogs(response.data.logs || []);
      setError(null);
    } catch (err) {
      console.error('Error loading audit logs:', err);
      setError('Failed to load system logs. Make sure the server is reachable.');
      toast.error('Failed to load system audit logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [category]); // Fetch on category switch immediately

  // Trigger search on submit or search button click
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLogs();
  };

  const handleResetFilters = () => {
    setSearch('');
    setCategory('');
    toast.success('Filters cleared.');
    // Due to state asynchronous nature, we fetch directly with empty values
    setLoading(true);
    api.get('/admin/audit-logs')
      .then(res => {
        setLogs(res.data.logs || []);
        setError(null);
      })
      .catch(err => {
        console.error(err);
        setError('Failed to reset logs.');
      })
      .finally(() => setLoading(false));
  };

  const handleExportCSV = () => {
    if (logs.length === 0) {
      toast.error('No audit log entries available to export.');
      return;
    }

    const headers = ['Log ID', 'Actor (Email)', 'Action Category', 'Details', 'IP Address', 'Date & Time'];
    const rows = logs.map((log) => [
      log.id,
      log.user_email || 'System/Anonymous',
      `"${log.category}"`,
      `"${log.details.replace(/"/g, '""')}"`,
      log.ip_address || 'N/A',
      new Date(log.date).toLocaleString(),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((r) => r.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `GiveHope_AuditLogs_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Security logs successfully exported to CSV!');
  };

  // Helper styling mapping for category badges
  const getCategoryBadgeClass = (cat) => {
    switch (cat) {
      case 'Campaign CRUD':
        return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'User Promotion':
        return 'bg-indigo-50 text-indigo-700 border-indigo-100';
      case 'Auth':
        return 'bg-sky-50 text-sky-700 border-sky-100';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-100';
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">System Audit Logs</h1>
            <p className="text-gray-500 text-sm mt-1">Track and monitor administrative changes, role updates, and auth activities.</p>
          </div>
          <button
            onClick={handleExportCSV}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition shadow flex items-center gap-2"
          >
            <span>📥</span> Export Logs to CSV
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block mb-1 text-xs font-semibold text-gray-500 uppercase">Search Details / Email</label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                placeholder="Search user, action details..."
              />
            </div>

            <div>
              <label className="block mb-1 text-xs font-semibold text-gray-500 uppercase">Action Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-white"
              >
                <option value="">All Categories</option>
                <option value="Campaign CRUD">Campaign CRUD</option>
                <option value="User Promotion">User Promotion</option>
                <option value="Auth">Auth & Security</option>
                <option value="System">System Logs</option>
              </select>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-grow px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition shadow"
              >
                Search
              </button>
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-500 text-sm font-bold rounded-xl transition"
              >
                Clear
              </button>
            </div>
          </form>
        </div>

        {error && (
          <div className="p-4 text-sm text-red-800 bg-red-50 border border-red-200 rounded-2xl">
            {error}
          </div>
        )}

        {/* Logs Table */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3.5 font-semibold text-gray-500 uppercase tracking-wider">Date & Time</th>
                  <th className="px-6 py-3.5 font-semibold text-gray-500 uppercase tracking-wider">User (Actor)</th>
                  <th className="px-6 py-3.5 font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3.5 font-semibold text-gray-500 uppercase tracking-wider">Action Description</th>
                  <th className="px-6 py-3.5 font-semibold text-gray-500 uppercase tracking-wider">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center animate-pulse text-gray-400">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 inline-block mr-2"></div>
                      Loading audit entries...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-400">No logs found matching your filters.</td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50/50 transition">
                      <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                        {new Date(log.date).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-900 whitespace-nowrap">
                        {log.user_email || <span className="text-gray-400 italic">System / Anon</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${getCategoryBadgeClass(log.category)}`}>
                          {log.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-700 max-w-md break-words">
                        {log.details}
                      </td>
                      <td className="px-6 py-4 text-gray-400 font-mono text-xs whitespace-nowrap">
                        {log.ip_address || 'N/A'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminAudits;
