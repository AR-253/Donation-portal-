import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
      <span className="text-8xl">🔍</span>
      <h1 className="text-6xl font-extrabold text-gray-900 mt-4">404</h1>
      <h2 className="text-2xl font-bold text-gray-700 mt-2">Page Not Found</h2>
      <p className="text-gray-500 mt-4 max-w-md">
        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
      </p>
      <Link
        to="/"
        className="mt-8 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow transition duration-200"
      >
        Go Back Home
      </Link>
    </div>
  );
};

export default NotFound;
