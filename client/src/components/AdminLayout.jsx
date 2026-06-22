import React, { useContext, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const AdminLayout = ({ children }) => {
  const location = useLocation();
  const { user } = useContext(AuthContext);

  // Load collapsible state from localStorage to persist user preference
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('adminSidebarCollapsed') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('adminSidebarCollapsed', isCollapsed);
  }, [isCollapsed]);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const menuItems = [
    { name: 'Dashboard', path: '/admin', icon: '📊' },
    { name: 'Campaigns', path: '/admin/campaigns', icon: '🎗️' },
    { name: 'Donations', path: '/admin/donations', icon: '💰' },
    { name: 'Users', path: '/admin/users', icon: '👥' },
    { name: 'Audit Logs', path: '/admin/audits', icon: '📋' },
    { name: 'Manage Stories', path: '/admin/stories', icon: '📸' },
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans">
      {/* Sidebar navigation */}
      <aside 
        className={`w-full md:h-screen md:sticky md:top-0 bg-white border-r border-gray-200 flex flex-col shrink-0 transition-all duration-300 ease-in-out ${
          isCollapsed ? 'md:w-20' : 'md:w-64'
        }`}
      >
        {/* Header */}
        <div className={`p-5 border-b border-gray-100 flex items-center transition-all duration-300 ${
          isCollapsed ? 'flex-col gap-2 justify-center px-2' : 'justify-between'
        }`}>
          <Link to="/" className="flex items-center gap-2 overflow-hidden whitespace-nowrap">
            {isCollapsed ? (
              <span className="text-base font-black text-emerald-600 bg-emerald-50 w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-emerald-100">IB</span>
            ) : (
              <span className="text-xl font-black text-emerald-600 tracking-tight transition-all duration-300">iBTIDAA Admin</span>
            )}
          </Link>
          {/* Toggle Button (Hidden on Mobile) */}
          <button 
            onClick={toggleSidebar} 
            className="hidden md:flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition cursor-pointer shrink-0"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? '▶' : '◀'}
          </button>
        </div>

        {/* User Stats summary */}
        {user && (
          <div 
            className={`transition-all duration-300 flex items-center bg-emerald-50/50 rounded-xl border border-emerald-100/50 overflow-hidden ${
              isCollapsed ? 'p-2 my-4 mx-auto' : 'p-4 m-4 gap-3'
            }`}
          >
            <div className="w-10 h-10 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold shrink-0 shadow-sm">
              {user.name.charAt(0).toUpperCase()}
            </div>
            {!isCollapsed && (
              <div className="overflow-hidden transition-all duration-300">
                <p className="font-semibold text-sm text-gray-900 truncate">{user.name}</p>
                <p className="text-[10px] text-emerald-600 font-extrabold uppercase tracking-wider">Administrator</p>
              </div>
            )}
          </div>
        )}

        {/* Menu Items */}
        <nav className={`flex-grow p-4 space-y-1 overflow-y-auto transition-all duration-300 ${isCollapsed ? 'px-2' : ''}`}>
          {menuItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center rounded-xl text-sm font-semibold transition ${
                isCollapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-4 py-2.5'
              } ${
                isActive(item.path)
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
              title={isCollapsed ? item.name : undefined}
            >
              <span className="text-lg shrink-0">{item.icon}</span>
              {!isCollapsed && <span className="truncate transition-all duration-300">{item.name}</span>}
            </Link>
          ))}
          <hr className="border-gray-100 my-4" />
          <Link
            to="/"
            className={`flex items-center text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-xl text-sm font-semibold transition ${
              isCollapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-4 py-2.5'
            }`}
            title={isCollapsed ? "Back to Portal" : undefined}
          >
            <span className="text-lg shrink-0">🏠</span>
            {!isCollapsed && <span className="truncate transition-all duration-300">Back to Portal</span>}
          </Link>
        </nav>
      </aside>

      {/* Main content area */}
      <main className="flex-grow overflow-x-hidden min-h-screen flex flex-col">
        {/* Mobile Header */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 shrink-0 md:hidden">
          <span className="text-lg font-bold text-emerald-600">iBTIDAA Admin</span>
          <div className="flex gap-4">
            <Link to="/admin" className="text-sm font-bold text-gray-600">Dashboard</Link>
            <Link to="/admin/campaigns" className="text-sm font-bold text-gray-600">Campaigns</Link>
          </div>
        </header>

        <div className="flex-grow p-6 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
