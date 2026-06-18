import React, { useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout, isAdmin } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            {/* Logo */}
            <Link to="/" className="flex-shrink-0 flex items-center gap-2">
              <span className="text-2xl font-black tracking-tight text-emerald-600">GiveHope</span>
            </Link>

            {/* Nav Links */}
            <div className="hidden sm:ml-8 sm:flex sm:space-x-6">
              <Link
                to="/"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition duration-200 ${
                  isActive('/')
                    ? 'border-emerald-600 text-emerald-600 font-semibold'
                    : 'border-transparent text-gray-500 hover:border-emerald-400 hover:text-gray-700'
                }`}
              >
                Home
              </Link>
              <Link
                to="/campaigns"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition duration-200 ${
                  isActive('/campaigns') || location.pathname.startsWith('/campaigns/')
                    ? 'border-emerald-600 text-emerald-600 font-semibold'
                    : 'border-transparent text-gray-500 hover:border-emerald-400 hover:text-gray-700'
                }`}
              >
                Campaigns
              </Link>
              <Link
                to="/stories"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition duration-200 ${
                  isActive('/stories')
                    ? 'border-emerald-600 text-emerald-600 font-semibold'
                    : 'border-transparent text-gray-500 hover:border-emerald-400 hover:text-gray-700'
                }`}
              >
                Stories
              </Link>
              {user && (
                <Link
                  to="/dashboard"
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition duration-200 ${
                    isActive('/dashboard')
                      ? 'border-emerald-600 text-emerald-600 font-semibold'
                      : 'border-transparent text-gray-500 hover:border-emerald-400 hover:text-gray-700'
                  }`}
                >
                  Dashboard
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* User Session Interface */}
            {user ? (
              <>
                <div className="flex flex-col items-end text-xs text-gray-500 hidden md:block">
                  <span className="font-semibold text-gray-900 capitalize text-sm">{user.name}</span>
                  {isAdmin() && <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded text-[10px] uppercase">Admin</span>}
                </div>
                {isAdmin() && (
                  <Link
                    to="/dashboard"
                    className="px-3.5 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100 font-semibold rounded-xl text-sm transition"
                  >
                    Admin Panel
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 border border-gray-200 hover:border-gray-300 rounded-xl text-sm font-semibold text-gray-600 hover:text-gray-800 transition"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-600 hover:text-gray-900 font-semibold text-sm">
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 border border-transparent rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none transition shadow-sm hover:shadow"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
