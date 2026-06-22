import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import ProgressBar from '../components/ProgressBar';
import DonationForm from '../components/DonationForm';
import { AuthContext } from '../context/AuthContext';
import { formatMediaUrl } from '../utils/media';

const CampaignDetail = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const [campaign, setCampaign] = useState(null);
  const [recentDonations, setRecentDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCampaignDetails = async () => {
    try {
      const response = await api.get(`/campaigns/${id}`);
      setCampaign(response.data.campaign);
      setRecentDonations(response.data.recentDonations || []);
    } catch (err) {
      console.error('Error fetching campaign details:', err);
      setError('Failed to load campaign details. It might have been deleted or doesn\'t exist.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaignDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="container mx-auto px-4 py-16 text-center max-w-xl">
        <div className="bg-red-50 border border-red-200 text-red-800 p-6 rounded-2xl">
          <p className="font-semibold text-lg">{error || 'Campaign not found'}</p>
          <Link to="/campaigns" className="mt-4 inline-block text-emerald-600 font-semibold hover:underline">
            Back to campaigns
          </Link>
        </div>
      </div>
    );
  }

  const raised = parseFloat(campaign.raised_amount || 0);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <Link to="/campaigns" className="text-emerald-600 font-semibold hover:underline inline-flex items-center gap-1 mb-6">
        &larr; Back to Campaigns
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Campaign Details */}
        <div className="lg:col-span-2 space-y-6">
          <img
            src={formatMediaUrl(campaign.image_url) || 'https://images.unsplash.com/photo-1541944743827-e04aa6427c33?w=800'}
            alt={campaign.title}
            className="w-full h-96 object-cover rounded-2xl shadow-sm border border-gray-100"
          />
          <div className="bg-white p-6 border border-gray-200 rounded-2xl shadow-sm">
            <h1 className="text-3xl font-extrabold text-gray-900 mb-4">{campaign.title}</h1>
            <div className="mb-6">
              <ProgressBar goal={campaign.goal_amount} current={raised} />
              <div className="flex justify-between items-center text-sm font-semibold text-gray-700 mt-3">
                <span>Goal: ${campaign.goal_amount}</span>
                <span className="text-emerald-600">Raised: ${raised}</span>
              </div>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">About this Campaign</h3>
            <p className="text-gray-600 whitespace-pre-line leading-relaxed">{campaign.description}</p>
          </div>

          {/* Recent Donors */}
          <div className="bg-white p-6 border border-gray-200 rounded-2xl shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Donors</h3>
            {recentDonations.length === 0 ? (
              <p className="text-gray-500 text-sm py-2">Be the first to donate to this campaign!</p>
            ) : (
              <div className="space-y-4 divide-y divide-gray-100">
                {recentDonations.map((donation, idx) => (
                  <div key={donation.id} className={`pt-4 ${idx === 0 ? 'pt-0' : ''}`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-gray-950">{donation.donor_name}</h4>
                        {donation.message && (
                          <p className="text-gray-500 text-sm italic mt-1">"{donation.message}"</p>
                        )}
                        <span className="text-xs text-gray-400 mt-1 block">
                          {new Date(donation.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <span className="text-emerald-600 font-bold bg-emerald-50 px-3 py-1 rounded-full text-sm">
                        +${parseFloat(donation.amount).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Donation Widget */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 border border-gray-200 rounded-2xl shadow-xl sticky top-24">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Support this Cause</h3>
            {user ? (
              <DonationForm campaignId={campaign.id} onDonationSuccess={fetchCampaignDetails} />
            ) : (
              <div className="text-center py-6 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <p className="text-gray-600 text-sm mb-4">Please log in to make a donation.</p>
                <Link
                  to="/login"
                  className="inline-block px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm transition shadow"
                >
                  Log In
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignDetail;
