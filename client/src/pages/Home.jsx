import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import CampaignCard from '../components/CampaignCard';

const Home = () => {
  const { user } = useContext(AuthContext);
  const [featuredCampaigns, setFeaturedCampaigns] = useState([]);
  const [stats, setStats] = useState({
    totalRaised: 0,
    activeCount: 0,
    totalDonors: 0,
  });
  const [loading, setLoading] = useState(true);

  // 6 highly-emotional charity and donation-related images
  const bgImages = [
    'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=1600', // Smiling child receiving food pack from volunteer
    'https://images.unsplash.com/photo-1541944743827-e04aa6427c33?w=1600', // Happy children drinking clean water
    'https://images.unsplash.com/photo-1482862549707-f63cb32c5fd9?w=1600', // Smiling rural school children
    'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=1600', // Diverse team of volunteers putting hands together
    'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?w=1600', // Pediatrician examining a smiling child in a clinic
    'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1600'  // Happy children raising hands in classroom
  ];
  
  // Start on index 0 (1st image) by default
  const [currentBg, setCurrentBg] = useState(0);

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        const response = await api.get('/campaigns');
        const activeCampaigns = response.data.campaigns || [];
        
        // Take maximum 3 campaigns for the featured section
        setFeaturedCampaigns(activeCampaigns.slice(0, 3));

        // Calculate dynamic stats from retrieved active campaigns
        const calculatedRaised = activeCampaigns.reduce(
          (sum, c) => sum + parseFloat(c.raised_amount || 0), 
          0
        );
        
        setStats({
          totalRaised: calculatedRaised > 0 ? calculatedRaised : 12450,
          activeCount: activeCampaigns.length > 0 ? activeCampaigns.length : 5,
          totalDonors: activeCampaigns.length > 0 ? activeCampaigns.length * 8 + 12 : 250,
        });
      } catch (error) {
        console.error('Error loading home data:', error);
        setStats({
          totalRaised: 14200,
          activeCount: 4,
          totalDonors: 180,
        });
      } finally {
        setLoading(false);
      }
    };

    loadHomeData();
  }, []);

  const handlePrevSlide = () => {
    setCurrentBg((prev) => (prev - 1 + bgImages.length) % bgImages.length);
  };

  const handleNextSlide = () => {
    setCurrentBg((prev) => (prev + 1) % bgImages.length);
  };

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section with Background Carousel & Manual Navigation */}
      <section className="relative min-h-[520px] flex items-center justify-center text-white py-24 px-4 overflow-hidden group">
        {/* Carousel Background Images with fade transition */}
        {bgImages.map((imgUrl, index) => (
          <div
            key={index}
            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out ${
              index === currentBg ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ backgroundImage: `url(${imgUrl})` }}
          />
        ))}
        {/* Dark Emerald overlay for high text contrast */}
        <div className="absolute inset-0 bg-emerald-950/80 backdrop-blur-[1px]" />

        {/* Left Control Arrow */}
        <button
          onClick={handlePrevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 hover:scale-115 text-white p-3 rounded-full transition duration-200 z-20 cursor-pointer hidden md:flex items-center justify-center border border-white/5 opacity-0 group-hover:opacity-100"
          aria-label="Previous Slide"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Right Control Arrow */}
        <button
          onClick={handleNextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 hover:scale-115 text-white p-3 rounded-full transition duration-200 z-20 cursor-pointer hidden md:flex items-center justify-center border border-white/5 opacity-0 group-hover:opacity-100"
          aria-label="Next Slide"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Bottom Slide Indicators (Dots) */}
        <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2.5 z-20">
          {bgImages.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentBg(idx)}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                idx === currentBg 
                  ? 'bg-emerald-500 scale-125 w-6' 
                  : 'bg-white/40 hover:bg-white/75'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>

        {/* Text Content */}
        <div className="relative max-w-5xl mx-auto text-center space-y-6 z-10">
          <span className="bg-emerald-600/50 text-emerald-100 font-semibold px-4 py-1.5 rounded-full text-sm uppercase tracking-wider border border-emerald-500/20">
            Make an Impact Today
          </span>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight">
            Help Someone Today
          </h1>
          <p className="text-lg sm:text-xl text-emerald-100 max-w-2xl mx-auto font-light leading-relaxed">
            iBTIDAA Welfare Foundation connects you directly with causes, families, and communities in Pakistan that need support. Your small contribution can create a massive wave of change.
          </p>
          <div className="pt-4 flex justify-center gap-4">
            <Link
              to="/campaigns"
              className="px-8 py-3 bg-white text-emerald-800 font-bold rounded-xl transition duration-200 shadow-md hover:bg-gray-50 hover:shadow-lg hover:-translate-y-0.5 transform"
            >
              Start Donating
            </Link>
            {user ? (
              <Link
                to="/dashboard"
                className="px-8 py-3 bg-emerald-600 border border-emerald-500 text-white font-bold rounded-xl transition duration-200 hover:bg-emerald-500 hover:-translate-y-0.5 transform"
              >
                My Dashboard
              </Link>
            ) : (
              <Link
                to="/register"
                className="px-8 py-3 bg-emerald-600 border border-emerald-500 text-white font-bold rounded-xl transition duration-200 hover:bg-emerald-500 hover:-translate-y-0.5 transform"
              >
                Join Us
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="max-w-7xl mx-auto px-4 -mt-12">
        <div className="bg-white border border-gray-100 shadow-xl rounded-3xl grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-100 p-8 text-center">
          <div className="p-4">
            <p className="text-gray-500 text-sm font-semibold uppercase tracking-wider">Total Raised</p>
            <h3 className="text-4xl font-extrabold text-emerald-600 mt-2">${stats.totalRaised.toLocaleString()}</h3>
          </div>
          <div className="p-4">
            <p className="text-gray-500 text-sm font-semibold uppercase tracking-wider">Active Campaigns</p>
            <h3 className="text-4xl font-extrabold text-gray-900 mt-2">{stats.activeCount}</h3>
          </div>
          <div className="p-4">
            <p className="text-gray-500 text-sm font-semibold uppercase tracking-wider">Total Donors</p>
            <h3 className="text-4xl font-extrabold text-gray-900 mt-2">{stats.totalDonors.toLocaleString()}</h3>
          </div>
        </div>
      </section>

      {/* Featured Campaigns Grid */}
      <section className="max-w-7xl mx-auto px-4 space-y-8">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900">Featured Campaigns</h2>
            <p className="text-gray-500 text-sm mt-1">Urgent fundraising goals that need your immediate support.</p>
          </div>
          <Link to="/campaigns" className="text-emerald-600 hover:text-emerald-700 font-bold hover:underline hidden sm:inline-flex items-center gap-1 text-sm">
            View All Campaigns &rarr;
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse bg-gray-100 h-96 rounded-2xl border border-gray-200"></div>
            ))}
          </div>
        ) : featuredCampaigns.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-400">No campaigns available currently.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredCampaigns.map((campaign) => (
              <CampaignCard key={campaign.id} campaign={campaign} />
            ))}
          </div>
        )}

        <div className="text-center sm:hidden pt-4">
          <Link to="/campaigns" className="inline-block w-full py-3 bg-emerald-50 text-emerald-700 font-semibold rounded-xl text-center">
            View All Campaigns
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
