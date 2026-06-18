import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import api from '../../api/axios';
import AdminLayout from '../../components/AdminLayout';

const AdminCampaigns = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null); // null means "Create Mode"
  
  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    goal_amount: '',
    image_url: '',
    status: 'active',
  });
  
  const [formLoading, setFormLoading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);

  const fetchCampaigns = async () => {
    try {
      const response = await api.get('/admin/campaigns');
      setCampaigns(response.data.campaigns || []);
    } catch (err) {
      console.error('Error loading campaigns:', err);
      setError('Failed to load campaigns list.');
      toast.error('Failed to load campaigns.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
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

  const openCreateModal = () => {
    setEditingCampaign(null);
    setFormData({
      title: '',
      description: '',
      goal_amount: '',
      image_url: '',
      status: 'active',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (campaign) => {
    setEditingCampaign(campaign);
    setFormData({
      title: campaign.title,
      description: campaign.description,
      goal_amount: campaign.goal_amount,
      image_url: campaign.image_url,
      status: campaign.status,
    });
    setIsModalOpen(true);
  };

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Upload selected image file to backend static uploads
  const handleImageFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImageUploading(true);
    const uploadData = new FormData();
    uploadData.append('image', file);

    try {
      const response = await api.post('/admin/upload', uploadData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setFormData((prev) => ({ ...prev, image_url: response.data.imageUrl }));
      toast.success('Cover image uploaded successfully!');
    } catch (err) {
      console.error('Image file upload error:', err);
      toast.error(err.response?.data?.message || 'Failed to upload cover image.');
    } finally {
      setImageUploading(false);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);

    if (!formData.title || !formData.description || !formData.goal_amount) {
      toast.error('Please fill in all required fields.');
      setFormLoading(false);
      return;
    }

    try {
      if (editingCampaign) {
        await api.put(`/campaigns/${editingCampaign.id}`, formData);
        toast.success('Campaign updated successfully!');
      } else {
        await api.post('/campaigns', formData);
        toast.success('Campaign created successfully!');
      }
      setIsModalOpen(false);
      fetchCampaigns();
    } catch (err) {
      console.error('Form submission failed:', err);
      toast.error(err.response?.data?.message || 'Error processing request.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleTogglePause = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'paused' ? 'active' : 'paused';
    try {
      await api.patch(`/campaigns/${id}/status`, { status: nextStatus });
      toast.success(`Campaign status changed to ${nextStatus}!`);
      fetchCampaigns();
    } catch (err) {
      toast.error('Failed to change status: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteCampaign = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this campaign? All donation logs linked to it will also be deleted.')) {
      return;
    }

    try {
      await api.delete(`/admin/campaigns/${id}`);
      toast.success('Campaign deleted successfully!');
      fetchCampaigns();
    } catch (err) {
      toast.error('Failed to delete campaign: ' + (err.response?.data?.message || err.message));
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
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Manage Campaigns</h1>
            <p className="text-gray-500 text-sm mt-1">Add, update, pause, or remove campaigns here.</p>
          </div>
          <button
            onClick={openCreateModal}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition shadow flex items-center gap-2"
          >
            <span>➕</span> New Campaign
          </button>
        </div>

        {error && (
          <div className="p-4 text-sm text-red-800 bg-red-50 border border-red-200 rounded-2xl">
            {error}
          </div>
        )}

        {/* Table of all campaigns */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3.5 font-semibold text-gray-500 uppercase tracking-wider">Campaign</th>
                  <th className="px-6 py-3.5 font-semibold text-gray-500 uppercase tracking-wider">Goal</th>
                  <th className="px-6 py-3.5 font-semibold text-gray-500 uppercase tracking-wider">Raised</th>
                  <th className="px-6 py-3.5 font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3.5 font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {campaigns.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-400">No campaigns added yet.</td>
                  </tr>
                ) : (
                  campaigns.map((campaign) => (
                    <tr key={campaign.id} className="hover:bg-gray-50/50 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={campaign.image_url || 'https://images.unsplash.com/photo-1541944743827-e04aa6427c33?w=100'}
                            alt={campaign.title}
                            className="w-12 h-12 object-cover rounded-lg shrink-0 border border-gray-100"
                          />
                          <div className="overflow-hidden">
                            <p className="font-bold text-gray-950 truncate max-w-xs">{campaign.title}</p>
                            <p className="text-xs text-gray-400 truncate max-w-xs">{campaign.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-700">${parseFloat(campaign.goal_amount).toLocaleString()}</td>
                      <td className="px-6 py-4 font-bold text-emerald-600">${parseFloat(campaign.raised_amount).toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-1 text-xs font-bold rounded-full border ${
                            campaign.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                              : campaign.status === 'paused'
                              ? 'bg-yellow-50 text-yellow-700 border-yellow-100'
                              : 'bg-gray-50 text-gray-700 border-gray-100'
                          }`}
                        >
                          {campaign.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2 shrink-0">
                        <button
                          onClick={() => openEditModal(campaign)}
                          className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleTogglePause(campaign.id, campaign.status)}
                          className={`px-3 py-1.5 border rounded-lg text-xs font-semibold transition ${
                            campaign.status === 'paused'
                              ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-700'
                              : 'bg-yellow-50 hover:bg-yellow-100 border-yellow-200 text-yellow-700'
                          }`}
                        >
                          {campaign.status === 'paused' ? 'Resume' : 'Pause'}
                        </button>
                        <button
                          onClick={() => handleDeleteCampaign(campaign.id)}
                          className="px-3 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-lg text-xs font-semibold transition"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Form */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-2xl max-w-lg w-full space-y-6 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-900">
                  {editingCampaign ? 'Edit Campaign' : 'Create New Campaign'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div>
                  <label className="block mb-1 text-sm font-semibold text-gray-700">Campaign Title *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleFormChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                    placeholder="Enter campaign title"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-1 text-sm font-semibold text-gray-700">Description *</label>
                  <textarea
                    name="description"
                    rows="4"
                    value={formData.description}
                    onChange={handleFormChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                    placeholder="Explain the cause and requirements..."
                    required
                  ></textarea>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1 text-sm font-semibold text-gray-700">Goal Amount ($) *</label>
                    <input
                      type="number"
                      name="goal_amount"
                      min="1"
                      value={formData.goal_amount}
                      onChange={handleFormChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                      placeholder="e.g. 5000"
                      required
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm font-semibold text-gray-700">Campaign Status</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleFormChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm bg-white"
                      disabled={!editingCampaign}
                    >
                      <option value="active">Active</option>
                      <option value="paused">Paused</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>

                {/* Upload Image Section */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Cover Image</label>
                  <div className="flex gap-4 items-center">
                    {formData.image_url && (
                      <img
                        src={formData.image_url}
                        alt="Preview"
                        className="w-16 h-16 object-cover rounded-xl border border-gray-200"
                      />
                    )}
                    <div className="flex-grow">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileChange}
                        className="block w-full text-xs text-gray-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                      />
                      {imageUploading && <p className="text-xs text-emerald-600 mt-1 animate-pulse">Uploading image to server...</p>}
                    </div>
                  </div>
                  <div className="text-[11px] text-gray-400">
                    Or paste direct URL link:
                  </div>
                  <input
                    type="url"
                    name="image_url"
                    value={formData.image_url}
                    onChange={handleFormChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                    placeholder="https://example.com/cover.jpg"
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
                    disabled={formLoading || imageUploading}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white font-bold rounded-xl text-sm transition"
                  >
                    {formLoading ? 'Saving...' : 'Save Campaign'}
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

export default AdminCampaigns;
