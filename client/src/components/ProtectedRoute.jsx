import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading, isAdmin } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!user) {
    // Redirect to login if user not authenticated
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin()) {
    // Redirect to dashboard if route requires admin and user is donor
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
