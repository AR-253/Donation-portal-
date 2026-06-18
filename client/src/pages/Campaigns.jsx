import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import CampaignCard from '../components/CampaignCard';

const Campaigns = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const response = await api.get('/campaigns');
        setCampaigns(response.data.campaigns || []);
      } catch (err) {
        console.error('Error fetching campaigns:', err);
        setError('Failed to fetch campaigns. Please make sure the backend is running.');
      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, []);

  return (
    <div className="container mx-auto px-4 py-12 max-w-7xl">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl mb-4">
          Support a <span className="text-emerald-600">Campaign</span>
        </h1>
        <p className="text-lg text-gray-600">
          Browse our active fundraising campaigns and donate to help make a positive impact.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-24">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <div className="inline-block p-6 bg-red-50 border border-red-200 text-red-800 rounded-2xl">
            <p className="font-semibold">{error}</p>
          </div>
        </div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 text-lg">No active campaigns found right now. Check back soon!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {campaigns.map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Campaigns;
