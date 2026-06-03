import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AppContext = createContext();

export const useApp = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);

  const API_URL = 'http://localhost:5000/api';

  // Configure default Axios headers if token exists
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('token', token);
    } else {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }, [token]);

  // Load user profile on mount if token exists
  useEffect(() => {
    const fetchMe = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await axios.get(`${API_URL}/auth/me`);
        setUser(res.data);
      } catch (err) {
        console.error('Failed to load user', err);
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchMe();
  }, [token]);

  // Show Toast Message Helper
  const showToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 4000);
  };

  // Login handler
  const login = async (email, password) => {
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { email, password });
      setToken(res.data.token);
      setUser({
        _id: res.data._id,
        name: res.data.name,
        email: res.data.email,
        role: res.data.role,
      });
      showToast(`Welcome back, ${res.data.name}!`, 'success');
      return { success: true };
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Login failed';
      showToast(errMsg, 'error');
      return { success: false, error: errMsg };
    }
  };

  // Register handler
  const register = async (name, email, password, role) => {
    try {
      const res = await axios.post(`${API_URL}/auth/register`, {
        name,
        email,
        password,
        role,
      });
      setToken(res.data.token);
      setUser({
        _id: res.data._id,
        name: res.data.name,
        email: res.data.email,
        role: res.data.role,
      });
      showToast(`Account created successfully! Welcome, ${res.data.name}`, 'success');
      return { success: true };
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Registration failed';
      showToast(errMsg, 'error');
      return { success: false, error: errMsg };
    }
  };

  // Logout handler
  const logout = () => {
    setToken(null);
    setUser(null);
    showToast('Logged out successfully', 'info');
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    toasts,
    showToast,
    API_URL,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
