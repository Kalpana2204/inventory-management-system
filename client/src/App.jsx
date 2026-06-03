import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import ManageProducts from './pages/ManageProducts';
import SellerDashboard from './pages/SellerDashboard';
import CreateOrder from './pages/CreateOrder';

// Main App Component with inner routes
const AppContent = () => {
  const { toasts } = useApp();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      
      <main style={{ flex: 1 }}>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Admin Protected Routes */}
          <Route
            path="/admin"
            element={
              <PrivateRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/products"
            element={
              <PrivateRoute allowedRoles={['admin']}>
                <ManageProducts />
              </PrivateRoute>
            }
          />

          {/* Seller Protected Routes */}
          <Route
            path="/seller"
            element={
              <PrivateRoute allowedRoles={['seller']}>
                <SellerDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/seller/order"
            element={
              <PrivateRoute allowedRoles={['seller']}>
                <CreateOrder />
              </PrivateRoute>
            }
          />

          {/* Redirect / Home Route */}
          <Route path="/" element={<HomeRedirect />} />
          
          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Global Toast Alert System */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            <div>{toast.message}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Simple Redirection helper based on user auth role
const HomeRedirect = () => {
  const { user, loading } = useApp();

  if (loading) {
    return (
      <div className="container text-center">
        <h2>Loading portal...</h2>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return user.role === 'admin' ? (
    <Navigate to="/admin" replace />
  ) : (
    <Navigate to="/seller" replace />
  );
};

const App = () => {
  return (
    <AppProvider>
      <Router>
        <AppContent />
      </Router>
    </AppProvider>
  );
};

export default App;
