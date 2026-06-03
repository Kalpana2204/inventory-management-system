import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { PlusCircle, ClipboardCheck, ClipboardList, RefreshCw, ShoppingCart, UserCheck } from 'lucide-react';

const SellerDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast, API_URL } = useApp();

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/orders`);
      setOrders(res.data.orders);
    } catch (err) {
      console.error(err);
      showToast('Failed to retrieve orders history', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const totalOrdersCount = orders.length;
  const pendingOrders = orders.filter((o) => o.status === 'pending');
  const approvedOrdersValue = orders
    .filter((o) => ['approved', 'completed'].includes(o.status))
    .reduce((sum, o) => sum + o.totalAmount, 0);

  if (loading) {
    return (
      <div className="container text-center">
        <h2>Loading orders board...</h2>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="flex-between mb-6">
        <div>
          <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 700 }}>Seller Dashboard</h1>
          <p className="text-secondary-label">Track and manage your customer order proposals</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchOrders} className="btn btn-secondary">
            <RefreshCw size={16} />
            <span>Refresh</span>
          </button>
          <Link to="/seller/order" className="btn btn-primary">
            <PlusCircle size={16} />
            <span>Create New Order</span>
          </Link>
        </div>
      </div>

      {/* KPI Overview Widgets */}
      <div className="grid-cols-3">
        <div className="card stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>
            <ClipboardCheck size={24} />
          </div>
          <div className="stat-info">
            <h3>{totalOrdersCount}</h3>
            <p>Total Orders Placed</p>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
            <ClipboardList size={24} />
          </div>
          <div className="stat-info">
            <h3 className={pendingOrders.length > 0 ? 'text-warning' : ''}>
              {pendingOrders.length}
            </h3>
            <p>Quotations Pending Admin Review</p>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
            <UserCheck size={24} />
          </div>
          <div className="stat-info">
            <h3>₹{Number(approvedOrdersValue.toFixed(2)).toLocaleString('en-IN')}</h3>
            <p>Approved Revenue (INR)</p>
          </div>
        </div>
      </div>

      {/* Seller Order History Table */}
      <div className="card">
        <div className="flex-align-center gap-2 mb-4">
          <ShoppingCart size={20} className="text-success" />
          <h2 style={{ fontSize: '1.2rem', margin: 0 }}>My Submitted Quotations & Orders</h2>
        </div>

        {orders.length === 0 ? (
          <div className="text-center" style={{ padding: '3rem 1.5rem' }}>
            <p className="text-secondary-label mb-4">
              You haven't submitted any quotations or orders yet.
            </p>
            <Link to="/seller/order" className="btn btn-primary">
              <PlusCircle size={16} />
              <span>Submit First Order</span>
            </Link>
          </div>
        ) : (
          <div className="table-container" style={{ margin: 0 }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Order Date</th>
                  <th>Order Items</th>
                  <th>Ordered Unit & Qty</th>
                  <th>Calculated Price</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order._id}>
                    <td>
                      <div>
                        <strong>{new Date(order.createdAt).toLocaleDateString()}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-col gap-2">
                        {order.items.map((item, idx) => (
                          <div key={idx} style={{ paddingBottom: '4px' }}>
                            <strong>{item.product?.name || 'Deleted Product'}</strong>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-col gap-2">
                        {order.items.map((item, idx) => (
                          <div key={idx} style={{ paddingBottom: '4px' }}>
                            <span>{item.quantity} {item.unit}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-col gap-2">
                        {order.items.map((item, idx) => (
                          <div key={idx} style={{ paddingBottom: '4px' }}>
                            <span>₹{Number(item.calculatedPrice.toFixed(2)).toLocaleString('en-IN')}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td>
                      <strong className="text-success">
                        ₹{Number(order.totalAmount.toFixed(2)).toLocaleString('en-IN')}
                      </strong>
                    </td>
                    <td>
                      <span className={`badge badge-${order.status}`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerDashboard;
