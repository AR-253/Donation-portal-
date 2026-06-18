import React from 'react';
import { Link } from 'react-router-dom';
import ProgressBar from './ProgressBar';

const CampaignCard = ({ campaign }) => {
  const { id, title, description, goal_amount, raised_amount, current_amount, image_url } = campaign;
  const raised = raised_amount !== undefined ? parseFloat(raised_amount) : parseFloat(current_amount || 0);

  return (
    <div className="flex flex-col bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition duration-300">
      <img
        src={image_url || 'https://images.unsplash.com/photo-1541944743827-e04aa6427c33?w=500'}
        alt={title}
        className="w-full h-48 object-cover"
      />
      <div className="flex-1 p-6 flex flex-col justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">{description}</p>
        </div>
        <div>
          <ProgressBar goal={goal_amount} current={raised} />
          <div className="flex justify-between items-center text-sm font-semibold text-gray-700 mt-4 mb-4">
            <span>Goal: ${goal_amount}</span>
            <span className="text-emerald-600">Raised: ${raised}</span>
          </div>
          <Link
            to={`/campaigns/${id}`}
            className="block text-center w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition duration-200"
          >
            Donate Now
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CampaignCard;
