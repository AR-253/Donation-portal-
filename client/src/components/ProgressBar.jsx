import React from 'react';

const ProgressBar = ({ goal, current }) => {
  const percentage = goal > 0 ? Math.min(Math.round((current / goal) * 100), 100) : 0;

  return (
    <div className="w-full">
      <div className="flex justify-between items-center text-xs font-semibold text-gray-500 mb-1">
        <span>Progress</span>
        <span>{percentage}%</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
        <div
          className="bg-emerald-600 h-2.5 rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

export default ProgressBar;
