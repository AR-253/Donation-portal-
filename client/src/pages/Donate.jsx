import React from 'react';
import { useParams } from 'react-router-dom';
import DonationForm from '../components/DonationForm';

const Donate = () => {
  const { id } = useParams();

  return (
    <div className="container mx-auto px-4 py-12 max-w-lg">
      <div className="bg-white p-8 border border-gray-200 rounded-2xl shadow-xl">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-6">Make a Donation</h2>
        <p className="text-gray-600 text-center mb-8">
          Thank you for choosing to make a difference. Please enter your donation details below.
        </p>
        <DonationForm campaignId={id} />
      </div>
    </div>
  );
};

export default Donate;
