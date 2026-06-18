import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import AdminLayout from '../../components/AdminLayout';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  Area,
  CartesianGrid,
} from 'recharts';

const CustomTooltip = ({ active, payload, label, currency = false }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-md p-3 border border-gray-100 rounded-2xl shadow-xl space-y-1">
        <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">{label}</p>
        <p className="text-sm font-black text-gray-900">
          {payload[0].name}:{' '}
          <span className={currency ? "text-emerald-600" : "text-indigo-600"}>
            {currency ? `$${parseFloat(payload[0].value).toLocaleString()}` : payload[0].value}
          </span>
        </p>
      </div>
    );
  }
  return null;
};

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState(null);
  const [recentDonations, setRecentDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAdminStats = async () => {
      try {
        const response = await api.get('/admin/stats');
        setStats(response.data.stats);
        setCharts(response.data.charts);
        setRecentDonations(response.data.recentDonations || []);
      } catch (err) {
        console.error('Error loading admin dashboard stats:', err);
        setError('Failed to load admin statistics. Please ensure the backend is connected.');
      } finally {
        setLoading(false);
      }
    };

    fetchAdminStats();
  }, []);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      </AdminLayout>
    );
  }

  if (error || !stats) {
    return (
      <AdminLayout>
        <div className="bg-red-50 border border-red-200 text-red-800 p-6 rounded-2xl max-w-xl mx-auto text-center mt-12">
          <p className="font-semibold">{error || 'Server error loading statistics'}</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Admin Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Real-time metrics, analytics overview, and recent actions.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 border border-gray-200 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-500 uppercase">Total Donations</span>
              <span className="text-2xl">💰</span>
            </div>
            <p className="text-3xl font-extrabold text-gray-900 mt-2">{stats.totalDonations}</p>
          </div>

          <div className="bg-white p-6 border border-gray-200 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-500 uppercase">Amount Raised</span>
              <span className="text-2xl">📈</span>
            </div>
            <p className="text-3xl font-extrabold text-emerald-600 mt-2">${stats.totalDonatedAmount.toLocaleString()}</p>
          </div>

          <div className="bg-white p-6 border border-gray-200 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-500 uppercase">Active Campaigns</span>
              <span className="text-2xl">🎗️</span>
            </div>
            <p className="text-3xl font-extrabold text-gray-900 mt-2">{stats.totalActiveCampaigns} <span className="text-sm font-normal text-gray-400">/ {stats.totalCampaigns}</span></p>
          </div>

          <div className="bg-white p-6 border border-gray-200 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-500 uppercase">Total Users</span>
              <span className="text-2xl">👥</span>
            </div>
            <p className="text-3xl font-extrabold text-gray-900 mt-2">{stats.totalUsers}</p>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Monthly Donation Amounts BarChart */}
          <div className="bg-white p-6 border border-gray-200 rounded-2xl shadow-sm space-y-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Donations Last 6 Months</h3>
              <p className="text-xs text-gray-400">Aggregated monthly completed donation volumes.</p>
            </div>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts?.monthlyAmounts} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                      <stop offset="100%" stopColor="#059669" stopOpacity={0.6} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#94a3b8" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false}
                    dy={8}
                  />
                  <YAxis 
                    stroke="#94a3b8" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false}
                    dx={-8}
                    tickFormatter={(val) => `$${val >= 1000 ? (val / 1000) + 'k' : val}`}
                  />
                  <Tooltip content={<CustomTooltip currency={true} />} cursor={{ fill: '#f8fafc', radius: 12 }} />
                  <Bar dataKey="amount" name="Donated Amount" fill="url(#barGradient)" radius={[10, 10, 0, 0]} maxBarSize={48} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Donor Count AreaChart */}
          <div className="bg-white p-6 border border-gray-200 rounded-2xl shadow-sm space-y-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Donor Registration Trend</h3>
              <p className="text-xs text-gray-400">New donor registration volumes over time.</p>
            </div>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={charts?.donorRegistrations} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#94a3b8" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false}
                    dy={8}
                  />
                  <YAxis 
                    stroke="#94a3b8" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false}
                    dx={-8}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="donors" 
                    name="Registered Donors" 
                    stroke="#6366f1" 
                    strokeWidth={3} 
                    fill="url(#areaGradient)" 
                    activeDot={{ r: 6, strokeWidth: 0, fill: '#6366f1' }} 
                    dot={{ strokeWidth: 2, r: 4, fill: '#fff', stroke: '#6366f1' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Recent Donations Table */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Recent Donations</h3>
              <p className="text-xs text-gray-400 mt-0.5">List of the most recent contributions processed by the gateway.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3.5 font-semibold text-gray-500 uppercase tracking-wider">Donor</th>
                  <th className="px-6 py-3.5 font-semibold text-gray-500 uppercase tracking-wider">Campaign</th>
                  <th className="px-6 py-3.5 font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3.5 font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3.5 font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {recentDonations.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-400">No donations processed yet.</td>
                  </tr>
                ) : (
                  recentDonations.map((donation) => (
                    <tr key={donation.id} className="hover:bg-gray-50/50 transition">
                      <td className="px-6 py-4 font-semibold text-gray-950">{donation.donor_name}</td>
                      <td className="px-6 py-4 text-gray-600 truncate max-w-xs">{donation.campaign_title}</td>
                      <td className="px-6 py-4 text-emerald-600 font-bold">${parseFloat(donation.amount).toFixed(2)}</td>
                      <td className="px-6 py-4 text-gray-500">{new Date(donation.date).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 text-xs font-bold rounded-full bg-emerald-50 text-emerald-700 capitalize border border-emerald-100">
                          {donation.status}
                        </span>
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

export default Dashboard;
