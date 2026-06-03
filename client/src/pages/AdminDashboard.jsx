import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useApp } from '../context/AppContext';
import { ShoppingBag, AlertTriangle, ClipboardList, CheckCircle, XCircle, RefreshCw, Layers } from 'lucide-react';

const AdminDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast, API_URL } = useApp();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordersRes, productsRes] = await Promise.all([
        axios.get(`${API_URL}/orders`),
        axios.get(`${API_URL}/products`),
      ]);
      setOrders(ordersRes.data.orders);
      setProducts(productsRes.data.products);
    } catch (error) {
      console.error(error);
      showToast('Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const res = await axios.put(`${API_URL}/orders/${orderId}/status`, { status: newStatus });
      if (res.data.success) {
        showToast(`Order status updated to ${newStatus}`, 'success');
        fetchData(); // Refresh all stats & counts
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to update order status';
      showToast(errMsg, 'error');
    }
  };

  // Stats Calculations
  const pendingOrders = orders.filter((o) => o.status === 'pending');
  const lowStockProducts = products.filter((p) => p.stockQuantity <= 10);
  const totalSales = orders
    .filter((o) => ['approved', 'completed'].includes(o.status))
    .reduce((sum, o) => sum + o.totalAmount, 0);

  if (loading) {
    return (
      <div className="container text-center">
        <h2>Loading admin dashboard...</h2>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="flex-between mb-6">
        <div>
          <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 700 }}>Admin Dashboard</h1>
          <p className="text-secondary-label">Overview of inventory health and seller orders</p>
        </div>
        <button onClick={fetchData} className="btn btn-secondary">
          <RefreshCw size={16} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* KPI Overview Widgets */}
      <div className="grid-cols-3">
        <div className="card stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>
            <Layers size={24} />
          </div>
          <div className="stat-info">
            <h3>{products.length}</h3>
            <p>Total Products</p>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
            <AlertTriangle size={24} />
          </div>
          <div className="stat-info">
            <h3 className={lowStockProducts.length > 0 ? 'text-warning' : ''}>
              {lowStockProducts.length}
            </h3>
            <p>Low Stock Items (&le; 10 units)</p>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
            <ShoppingBag size={24} />
          </div>
          <div className="stat-info">
            <h3>₹{Number(totalSales.toFixed(2)).toLocaleString('en-IN')}</h3>
            <p>Approved Orders Value</p>
          </div>
        </div>
      </div>

      {/* Main Quotations/Orders Table */}
      <div className="card">
        <div className="flex-align-center gap-2 mb-4">
          <ClipboardList size={20} className="text-success" />
          <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Incoming Quotations & Orders ({orders.length})</h2>
        </div>

        {orders.length === 0 ? (
          <p className="text-center text-secondary-label" style={{ padding: '2rem 0' }}>
            No orders or quotations have been submitted yet.
          </p>
        ) : (
          <div className="table-container" style={{ margin: 0 }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Seller</th>
                  <th>Order Items & Units</th>
                  <th>Calculated Price</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order._id}>
                    <td>
                      <div>
                        <strong style={{ display: 'block' }}>{order.seller?.name || 'Unknown'}</strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {order.seller?.email || 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-col gap-2">
                        {order.items.map((item, idx) => {
                          const product = item.product || {};
                          return (
                            <div key={idx} style={{ borderBottom: idx < order.items.length - 1 ? '1px dashed var(--border-color)' : 'none', paddingBottom: '4px' }}>
                              <span>{product.name || 'Deleted Product'}</span>
                              <span className="text-secondary-label" style={{ fontSize: '0.8rem', marginLeft: '6px' }}>
                                ({item.quantity} {item.unit})
                              </span>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                Rate: ₹{product.pricePerBaseUnit || 0} per {product.baseUnit || ''}
                              </div>
                            </div>
                          );
                        })}
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
                    <td className="text-right">
                      <div className="flex gap-2" style={{ justifyContent: 'flex-end' }}>
                        {order.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(order._id, 'approved')}
                              className="btn btn-success btn-sm"
                              title="Approve order (deducts stock)"
                            >
                              <CheckCircle size={14} />
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(order._id, 'rejected')}
                              className="btn btn-danger btn-sm"
                              title="Reject order"
                            >
                              <XCircle size={14} />
                              <span>Reject</span>
                            </button>
                          </>
                        )}
                        {order.status === 'approved' && (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(order._id, 'completed')}
                              className="btn btn-primary btn-sm"
                              title="Mark as completed"
                            >
                              <CheckCircle size={14} />
                              <span>Complete</span>
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(order._id, 'rejected')}
                              className="btn btn-danger btn-sm"
                              title="Cancel & Revert Stock"
                            >
                              <XCircle size={14} />
                              <span>Reject</span>
                            </button>
                          </>
                        )}
                        {order.status === 'completed' && (
                          <span className="text-secondary-label" style={{ fontSize: '0.85rem' }}>
                            Fulfilled
                          </span>
                        )}
                        {order.status === 'rejected' && (
                          <span className="text-error" style={{ fontSize: '0.85rem' }}>
                            Cancelled
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Low Stock Watch Grid */}
      {lowStockProducts.length > 0 && (
        <div className="card mt-4" style={{ border: '1px solid rgba(245, 158, 11, 0.3)', backgroundColor: 'rgba(245, 158, 11, 0.02)' }}>
          <div className="flex-align-center gap-2 mb-4">
            <AlertTriangle size={18} className="text-warning" />
            <h2 style={{ fontSize: '1.1rem', margin: 0 }}>Low Stock Alert Watchlist</h2>
          </div>
          <div className="grid-cols-3">
            {lowStockProducts.map((p) => (
              <div key={p._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 1rem', background: 'rgba(0,0,0,0.1)', borderRadius: '6px' }}>
                <span>{p.name}</span>
                <strong className="text-warning">
                  {p.stockQuantity} {p.baseUnit}
                </strong>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
