import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Package, ShoppingCart, LogOut, PlusCircle, User, LayoutDashboard, Database } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <Package size={24} className="text-success" />
          <span>AasaMedChem <strong>IMS</strong></span>
        </Link>

        {user ? (
          <div className="navbar-links">
            {/* Admin Links */}
            {user.role === 'admin' && (
              <>
                <Link to="/admin" className={isActive('/admin') ? 'active' : ''}>
                  <div className="flex-align-center gap-1">
                    <LayoutDashboard size={16} />
                    <span>Dashboard</span>
                  </div>
                </Link>
                <Link to="/admin/products" className={isActive('/admin/products') ? 'active' : ''}>
                  <div className="flex-align-center gap-1">
                    <Database size={16} />
                    <span>Inventory CRUD</span>
                  </div>
                </Link>
              </>
            )}

            {/* Seller Links */}
            {user.role === 'seller' && (
              <>
                <Link to="/seller" className={isActive('/seller') ? 'active' : ''}>
                  <div className="flex-align-center gap-1">
                    <LayoutDashboard size={16} />
                    <span>My Dashboard</span>
                  </div>
                </Link>
                <Link to="/seller/order" className={isActive('/seller/order') ? 'active' : ''}>
                  <div className="flex-align-center gap-1">
                    <PlusCircle size={16} />
                    <span>Create Order</span>
                  </div>
                </Link>
              </>
            )}

            {/* User Session Info */}
            <div className="user-info">
              <div className="flex-align-center gap-2">
                <User size={16} className="text-secondary-label" />
                <span style={{ fontWeight: 500 }}>{user.name}</span>
                <span className={`user-role-badge ${user.role}`}>{user.role}</span>
              </div>
              <button onClick={handleLogout} className="btn btn-secondary btn-sm" title="Log Out">
                <LogOut size={14} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="navbar-links">
            <Link to="/login" className={isActive('/login') ? 'active' : ''}>Login</Link>
            <Link to="/register" className={isActive('/register') ? 'active' : ''}>Register</Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
