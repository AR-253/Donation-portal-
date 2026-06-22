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
            <Link to="/" className="flex-shrink-0 flex items-center gap-3">
              <svg className="w-10 h-10 text-emerald-600" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Outer decorative ring */}
                <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="2.5" strokeDasharray="6 3" />
                {/* Crescent Moon shape */}
                <path d="M72 50C72 61.6 63.6 71.1 52.8 72.8C59.6 70.8 64.6 64.6 64.6 57.2C64.6 48.1 56.4 40.8 46.2 40.8C42.8 40.8 39.6 41.7 36.8 43.2C40.6 34.6 49.6 28.8 60 28.8C72 28.8 72 38.4 72 50Z" fill="currentColor" opacity="0.15" />
                {/* Stylized Dome/Minaret & Hands emblem */}
                <path d="M50 22C46 32 40 38 32 44C38 48 45 49 50 62C55 49 62 48 68 44C60 38 54 32 50 22Z" fill="currentColor" />
                <path d="M35 60C45 62 55 62 65 60C62 68 56 74 50 78C44 74 38 68 35 60Z" fill="#ca8a04" />
                {/* Heart outline in center */}
                <path d="M50 56C48.5 54 44 50 44 47C44 45 45.5 43.5 47.5 43.5C48.8 43.5 49.5 44.5 50 45C50.5 44.5 51.2 43.5 52.5 43.5C54.5 43.5 56 45 56 47C56 50 51.5 54 50 56Z" fill="white" />
              </svg>
              <div className="flex flex-col">
                <span className="text-xl font-black tracking-tight text-emerald-600 leading-none">iBTIDAA</span>
                <span className="text-[9px] font-bold text-gray-500 tracking-widest uppercase mt-0.5 leading-none">Welfare Foundation</span>
                <span className="text-[7px] text-gold-600 font-extrabold tracking-wider uppercase mt-0.5 leading-none">Respecting Humanity</span>
              </div>
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
