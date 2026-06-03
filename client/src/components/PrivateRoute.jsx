import React from 'react';
import { Navigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const PrivateRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useApp();

  if (loading) {
    return (
      <div className="flex-align-center flex-between" style={{ justifyContent: 'center', height: '100vh' }}>
        <h2>Loading application...</h2>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Role checking
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect based on their role to avoid loops
    return <Navigate to={user.role === 'admin' ? '/admin' : '/seller'} replace />;
  }

  return children;
};

export default PrivateRoute;
