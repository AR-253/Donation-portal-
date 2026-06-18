import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';
import AdminStats from '../components/AdminStats';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [myDonations, setMyDonations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Proactively redirect Admin to the rich /admin panel
    if (user && user.role === 'admin') {
      navigate('/admin', { replace: true });
      return;
    }

    const fetchUserData = async () => {
      try {
        const response = await api.get('/donations/my');
        setMyDonations(response.data.donations || []);
      } catch (error) {
        console.error('Error fetching dashboard data', error);
      } finally {
        setLoading(false);
      }
    };

    if (user && user.role !== 'admin') {
      fetchUserData();
    } else {
      setLoading(false);
    }
  }, [user, navigate]);

  if (!user) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <p className="text-gray-500">Please login to view dashboard.</p>
      </div>
    );
  }

  // Calculate stats for Donor Dashboard view
  const totalContributed = myDonations.reduce((sum, d) => sum + parseFloat(d.amount), 0);
  const uniqueCampaigns = new Set(myDonations.map(d => d.campaign_id)).size;
  const totalDonationsCount = myDonations.length;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
      {/* Fallback to AdminStats if redirection takes a moment */}
      {user.role === 'admin' ? (
        <AdminStats />
      ) : (
        <>
          {/* Branded Header Banner */}
          <div className="relative overflow-hidden bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-3xl p-8 shadow-md border border-emerald-500/10">
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full filter blur-2xl translate-x-16 -translate-y-16"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-300 rounded-full filter blur-xl -translate-x-12 translate-y-12"></div>
            </div>
            
            <div className="relative space-y-2">
              <span className="bg-emerald-500/30 text-emerald-100 font-semibold px-3 py-1 rounded-full text-xs uppercase tracking-wider border border-emerald-400/20">
                Donor Space
              </span>
              <h2 className="text-3xl font-extrabold tracking-tight">Welcome Back, {user.name}!</h2>
              <p className="text-emerald-100/90 text-sm max-w-xl font-light">
                Thank you for your generosity. Your contributions are supporting critical campaigns and helping communities thrive.
              </p>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-gray-150 p-6 rounded-2xl shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Contributed</p>
                <p className="text-3xl font-black text-emerald-600 mt-2">${totalContributed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
              <span className="text-3xl bg-emerald-50 p-3 rounded-2xl">💚</span>
            </div>

            <div className="bg-white border border-gray-150 p-6 rounded-2xl shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Causes Supported</p>
                <p className="text-3xl font-black text-gray-900 mt-2">{uniqueCampaigns} {uniqueCampaigns === 1 ? 'Campaign' : 'Campaigns'}</p>
              </div>
              <span className="text-3xl bg-emerald-50 p-3 rounded-2xl">🎗️</span>
            </div>

            <div className="bg-white border border-gray-150 p-6 rounded-2xl shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Donations Made</p>
                <p className="text-3xl font-black text-gray-900 mt-2">{totalDonationsCount} {totalDonationsCount === 1 ? 'Time' : 'Times'}</p>
              </div>
              <span className="text-3xl bg-emerald-50 p-3 rounded-2xl">📅</span>
            </div>
          </div>

          {/* Donation History List */}
          <div className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">My Donation History</h3>
                <p className="text-xs text-gray-400 mt-1">A timeline ledger of all contributions and payments linked to your profile.</p>
              </div>
            </div>

            {loading ? (
              <div className="p-12 text-center space-y-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 inline-block"></div>
                <p className="text-gray-400 text-sm">Loading ledger history...</p>
              </div>
            ) : myDonations.length === 0 ? (
              <div className="p-16 text-center space-y-4">
                <span className="text-5xl block">🕊️</span>
                <p className="text-gray-500 font-medium text-lg">You haven't made any donations yet.</p>
                <p className="text-gray-400 text-sm max-w-sm mx-auto">Explore active campaigns and make your first contribution to bring hope today!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3.5 font-semibold text-gray-500 uppercase tracking-wider">Campaign</th>
                      <th className="px-6 py-3.5 font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3.5 font-semibold text-gray-500 uppercase tracking-wider">Receipt Number</th>
                      <th className="px-6 py-3.5 font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3.5 font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {myDonations.map((donation) => (
                      <tr key={donation.id} className="hover:bg-gray-50/50 transition">
                        <td className="px-6 py-4 font-bold text-gray-900">{donation.campaign_title}</td>
                        <td className="px-6 py-4 text-emerald-600 font-extrabold text-base">${parseFloat(donation.amount).toFixed(2)}</td>
                        <td className="px-6 py-4 font-mono text-xs text-gray-500">{donation.receipt_number || 'GH-GATEWAY-PENDING'}</td>
                        <td className="px-6 py-4 text-gray-500">{new Date(donation.created_at || donation.date).toLocaleDateString()}</td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 capitalize">
                            {donation.payment_status || 'completed'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
