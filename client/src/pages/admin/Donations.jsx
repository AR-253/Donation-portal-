import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import api from '../../api/axios';
import AdminLayout from '../../components/AdminLayout';

const AdminDonations = () => {
  const [donations, setDonations] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters State
  const [filters, setFilters] = useState({
    campaign_id: '',
    status: '',
    start_date: '',
    end_date: '',
  });

  // Selected Donation for Receipt Modal
  const [selectedDonation, setSelectedDonation] = useState(null);

  const fetchFiltersData = async () => {
    try {
      const response = await api.get('/admin/campaigns');
      setCampaigns(response.data.campaigns || []);
    } catch (err) {
      console.error('Error fetching campaigns filter list:', err);
    }
  };

  const fetchDonations = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.campaign_id) params.campaign_id = filters.campaign_id;
      if (filters.status) params.status = filters.status;
      if (filters.start_date) params.start_date = filters.start_date;
      if (filters.end_date) params.end_date = filters.end_date;

      const response = await api.get('/admin/donations', { params });
      setDonations(response.data.donations || []);
      setError(null);
    } catch (err) {
      console.error('Error loading donations list:', err);
      setError('Failed to load donations. Please make sure the server is reachable.');
      toast.error('Failed to load donations ledger.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiltersData();
  }, []);

  useEffect(() => {
    fetchDonations();
  }, [filters]);

  // Lock background scrolling when modal is open
  useEffect(() => {
    if (selectedDonation) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedDonation]);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleResetFilters = () => {
    setFilters({
      campaign_id: '',
      status: '',
      start_date: '',
      end_date: '',
    });
    toast.success('Filters reset successfully.');
  };

  const handleExportCSV = () => {
    if (donations.length === 0) {
      toast.error('No donation data available to export.');
      return;
    }

    const headers = ['Donation ID', 'Donor Name', 'Campaign Title', 'Amount ($)', 'Message', 'Status', 'Stripe Payment ID', 'Receipt Number', 'Date'];
    
    const rows = donations.map((d) => [
      d.id,
      `"${d.donor_name.replace(/"/g, '""')}"`,
      `"${d.campaign_title.replace(/"/g, '""')}"`,
      d.amount,
      `"${(d.message || '').replace(/"/g, '""')}"`,
      d.status,
      d.stripe_payment_id || 'N/A',
      d.receipt_number || 'N/A',
      new Date(d.date).toLocaleString(),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((r) => r.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `GiveHope_Donations_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Donations successfully exported to CSV!');
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Donations ledger</h1>
            <p className="text-gray-500 text-sm mt-1">Audit, filter, and export donor contribution details.</p>
          </div>
          <button
            onClick={handleExportCSV}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition shadow flex items-center gap-2"
          >
            <span>📥</span> Export to CSV
          </button>
        </div>

        {/* Filters Panel */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-gray-900 text-sm">Filter Transactions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block mb-1 text-xs font-semibold text-gray-500 uppercase">By Campaign</label>
              <select
                name="campaign_id"
                value={filters.campaign_id}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-white"
              >
                <option value="">All Campaigns</option>
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-1 text-xs font-semibold text-gray-500 uppercase">By Status</label>
              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-white"
              >
                <option value="">All Statuses</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            <div>
              <label className="block mb-1 text-xs font-semibold text-gray-500 uppercase">Start Date</label>
              <input
                type="date"
                name="start_date"
                value={filters.start_date}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-white"
              />
            </div>

            <div>
              <label className="block mb-1 text-xs font-semibold text-gray-500 uppercase">End Date</label>
              <input
                type="date"
                name="end_date"
                value={filters.end_date}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-white"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleResetFilters}
              className="text-xs font-semibold text-gray-500 hover:text-gray-800 transition"
            >
              Reset All Filters
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 text-sm text-red-800 bg-red-50 border border-red-200 rounded-2xl">
            {error}
          </div>
        )}

        {/* Donations Table */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3.5 font-semibold text-gray-500 uppercase tracking-wider">Donor</th>
                  <th className="px-6 py-3.5 font-semibold text-gray-500 uppercase tracking-wider">Campaign</th>
                  <th className="px-6 py-3.5 font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3.5 font-semibold text-gray-500 uppercase tracking-wider">Receipt Number</th>
                  <th className="px-6 py-3.5 font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3.5 font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 inline-block"></div>
                    </td>
                  </tr>
                ) : donations.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-400">No donations match your filters.</td>
                  </tr>
                ) : (
                  donations.map((donation) => (
                    <tr 
                      key={donation.id} 
                      className="hover:bg-gray-50/50 transition cursor-pointer"
                      onClick={() => setSelectedDonation(donation)}
                      title="Click to view detailed receipt"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-bold text-gray-950">{donation.donor_name}</p>
                          {donation.message && <p className="text-xs text-gray-400 italic max-w-xs truncate">"{donation.message}"</p>}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600 truncate max-w-xs">{donation.campaign_title}</td>
                      <td className="px-6 py-4 text-emerald-600 font-bold">${parseFloat(donation.amount).toFixed(2)}</td>
                      <td className="px-6 py-4 font-mono text-xs text-gray-500">{donation.receipt_number || 'Pending'}</td>
                      <td className="px-6 py-4 text-gray-500">{new Date(donation.date).toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-1 text-xs font-bold rounded-full border ${
                            donation.status === 'completed'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                              : donation.status === 'pending'
                              ? 'bg-yellow-50 text-yellow-700 border-yellow-100'
                              : 'bg-red-50 text-red-700 border-red-100'
                          }`}
                        >
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

        {/* Detailed Receipt Modal */}
        {selectedDonation && (
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn"
            onClick={() => setSelectedDonation(null)}
          >
            <div 
              className="bg-white border border-gray-200 rounded-3xl p-6 shadow-2xl max-w-md w-full relative space-y-6 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Receipt Header */}
              <div className="text-center relative">
                <button
                  onClick={() => setSelectedDonation(null)}
                  className="absolute top-0 right-0 text-gray-400 hover:text-gray-600 text-2xl leading-none"
                >
                  &times;
                </button>
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3 text-xl shadow-inner">
                  📄
                </div>
                <h3 className="text-xl font-extrabold text-gray-900">Official Donation Receipt</h3>
                <p className="text-xs text-gray-400 font-mono mt-1">Receipt No: {selectedDonation.receipt_number || 'Pending'}</p>
              </div>

              {/* Receipt details */}
              <div className="border-t border-b border-dashed border-gray-200 py-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400 uppercase font-semibold">Payment Status</span>
                  <span
                    className={`px-2.5 py-1 text-xs font-bold rounded-full border ${
                      selectedDonation.status === 'completed'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                        : selectedDonation.status === 'pending'
                        ? 'bg-yellow-50 text-yellow-700 border-yellow-100'
                        : 'bg-red-50 text-red-700 border-red-100'
                    }`}
                  >
                    {selectedDonation.status}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400 uppercase font-semibold">Amount Contributed</span>
                  <span className="text-lg font-black text-emerald-600">${parseFloat(selectedDonation.amount).toFixed(2)}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400 uppercase font-semibold">Date & Time</span>
                  <span className="text-xs font-semibold text-gray-700">{new Date(selectedDonation.date).toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-start">
                  <span className="text-xs text-gray-400 uppercase font-semibold shrink-0">Campaign</span>
                  <span className="text-xs font-bold text-gray-800 text-right ml-4">{selectedDonation.campaign_title}</span>
                </div>
              </div>

              {/* Sender and Receiver details */}
              <div className="space-y-4 text-xs">
                <div>
                  <h4 className="font-bold text-gray-900 uppercase tracking-wider mb-2 text-[10px] text-gray-400">Sender Details (From)</h4>
                  <div className="bg-gray-50 border border-gray-100 rounded-2xl p-3 space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Name:</span>
                      <span className="font-semibold text-gray-800">{selectedDonation.donor_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Email:</span>
                      <span className="font-semibold text-gray-800">{selectedDonation.donor_email || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Account/Source:</span>
                      <span className="font-semibold text-gray-800 truncate max-w-[180px]" title={selectedDonation.stripe_payment_id || 'Direct Payment'}>
                        {selectedDonation.stripe_payment_id ? `Stripe ID: ${selectedDonation.stripe_payment_id}` : 'Direct Portal Account'}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-gray-900 uppercase tracking-wider mb-2 text-[10px] text-gray-400">Receiver Details (To)</h4>
                  <div className="bg-gray-50 border border-gray-100 rounded-2xl p-3 space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Beneficiary:</span>
                      <span className="font-semibold text-emerald-700 font-bold">GiveHope Organization</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Destination Account:</span>
                      <span className="font-semibold text-gray-800">givehope_db.donations</span>
                    </div>
                  </div>
                </div>

                {selectedDonation.message && (
                  <div>
                    <h4 className="font-bold text-gray-900 uppercase tracking-wider mb-1.5 text-[10px] text-gray-400">Donor Note</h4>
                    <p className="bg-emerald-50/50 border border-emerald-100/50 rounded-2xl p-3 text-xs italic text-gray-700">
                      "{selectedDonation.message}"
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex-grow px-4 py-2.5 border border-emerald-600 hover:bg-emerald-50 text-emerald-600 font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5"
                >
                  <span>🖨️</span> Print Receipt
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDonation(null)}
                  className="flex-grow px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminDonations;
