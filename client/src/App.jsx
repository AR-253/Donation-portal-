import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Campaigns from './pages/Campaigns';
import CampaignDetail from './pages/CampaignDetail';
import Dashboard from './pages/Dashboard';
import NotFound from './pages/NotFound';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminCampaigns from './pages/admin/Campaigns';
import AdminDonations from './pages/admin/Donations';
import AdminUsers from './pages/admin/Users';
import AdminAudits from './pages/admin/Audits';
import AdminManageStories from './pages/admin/ManageStories';

import SuccessStories from './pages/SuccessStories';

function App() {
  return (
    <AuthProvider>
      {/* Global Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#ffffff',
            color: '#1f2937',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
          },
        }}
      />
      <Router>
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
          <Routes>
            {/* Separate Admin panel paths (sidebar layout) */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute adminOnly={true}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/campaigns"
              element={
                <ProtectedRoute adminOnly={true}>
                  <AdminCampaigns />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/donations"
              element={
                <ProtectedRoute adminOnly={true}>
                  <AdminDonations />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute adminOnly={true}>
                  <AdminUsers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/audits"
              element={
                <ProtectedRoute adminOnly={true}>
                  <AdminAudits />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/stories"
              element={
                <ProtectedRoute adminOnly={true}>
                  <AdminManageStories />
                </ProtectedRoute>
              }
            />

            {/* Main Portal View routes */}
            <Route
              path="/*"
              element={
                <>
                  <Navbar />
                  <main className="flex-grow">
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/login" element={<Login />} />
                      <Route path="/register" element={<Register />} />
                      <Route path="/campaigns" element={<Campaigns />} />
                      <Route path="/campaigns/:id" element={<CampaignDetail />} />
                      <Route path="/stories" element={<SuccessStories />} />
                      <Route
                        path="/dashboard"
                        element={
                          <ProtectedRoute>
                            <Dashboard />
                          </ProtectedRoute>
                        }
                      />
                      {/* Catch-all 404 Route inside main portal layout */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </main>
                  <footer className="bg-white border-t border-gray-100 py-8 text-center text-sm text-gray-500">
                    <div className="max-w-7xl mx-auto px-4">
                      <p className="font-bold text-emerald-600">iBTIDAA Welfare Foundation</p>
                      <p className="mt-1 text-gray-400">Respecting Humanity — Bringing hope and support to those who need it most.</p>
                      <p className="mt-4 text-xs text-gray-300">&copy; {new Date().getFullYear()} iBTIDAA Welfare Foundation. All rights reserved.</p>
                    </div>
                  </footer>
                </>
              }
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
