import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Search, ShoppingCart, Trash2, ArrowLeft, Send, Check } from 'lucide-react';

const CreateOrder = () => {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  // Cart state: array of { product, quantity, unit, calculatedPrice, error }
  const [cart, setCart] = useState([]);

  const { showToast, API_URL } = useApp();
  const navigate = useNavigate();

  // Load products list
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/products`, {
        params: { search, category: categoryFilter },
      });
      setProducts(res.data.products);
    } catch (err) {
      console.error(err);
      showToast('Failed to load products catalogue', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [search, categoryFilter]);

  // Add item to cart
  const addToCart = (product) => {
    const existing = cart.find((item) => item.product._id === product._id);
    if (existing) {
      showToast(`${product.name} is already in your order items list`, 'info');
      return;
    }

    if (product.stockQuantity <= 0) {
      showToast(`${product.name} is currently out of stock`, 'warning');
      return;
    }

    // Default configuration: direct multiplication
    const defaultQty = 1;
    const initialPrice = Number((defaultQty * product.pricePerUnit).toFixed(4));

    setCart((prev) => [
      ...prev,
      {
        product,
        quantity: defaultQty,
        unit: product.unit,
        calculatedPrice: initialPrice,
        error: '',
      },
    ]);
  };

  // Remove item from cart
  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((item) => item.product._id !== productId));
  };

  // Update cart item quantity directly
  const updateCartItem = (productId, field, value) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.product._id !== productId) return item;

        const updatedItem = { ...item };
        if (field === 'quantity') {
          updatedItem.quantity = value === '' ? '' : parseFloat(value);
        }

        // Live validations and calculations
        if (updatedItem.quantity > 0) {
          if (updatedItem.quantity > item.product.stockQuantity) {
            updatedItem.error = `Exceeds stock: Only ${item.product.stockQuantity} ${item.product.unit} available.`;
          } else {
            updatedItem.error = '';
          }

          // Calculate price directly: Qty * Price
          updatedItem.calculatedPrice = Number((updatedItem.quantity * item.product.pricePerUnit).toFixed(4));
        } else {
          updatedItem.calculatedPrice = 0;
          updatedItem.error = 'Quantity must be greater than 0';
        }

        return updatedItem;
      })
    );
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;

    // Check for errors
    const hasErrors = cart.some((item) => item.error || !item.quantity || item.quantity <= 0);
    if (hasErrors) {
      showToast('Please correct the quantities and errors in your order items list before submitting', 'error');
      return;
    }

    const orderItems = cart.map((item) => ({
      productId: item.product._id,
      quantity: item.quantity,
      unit: item.unit,
    }));

    try {
      const res = await axios.post(`${API_URL}/orders`, { items: orderItems });
      if (res.data.success) {
        showToast('Your quotation has been submitted successfully!', 'success');
        navigate('/seller');
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to submit order';
      showToast(errMsg, 'error');
    }
  };

  const orderTotal = cart.reduce((sum, item) => sum + item.calculatedPrice, 0);
  const categories = ['All', ...new Set(products.map((p) => p.category).filter(Boolean))];

  return (
    <div className="container">
      <div className="flex-between mb-4">
        <button onClick={() => navigate('/seller')} className="btn btn-secondary flex-align-center">
          <ArrowLeft size={16} />
          <span>Back to Dashboard</span>
        </button>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 700 }}>Build Order Quotation</h1>
        </div>
      </div>

      <div className="order-builder-layout">
        {/* Left Side: Product Selector Search */}
        <div>
          <div className="card mb-4" style={{ padding: '1rem' }}>
            <div className="flex" style={{ gap: '0.75rem' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input
                  type="text"
                  className="form-control"
                  style={{ paddingLeft: '2.5rem' }}
                  placeholder="Search catalogue items..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <select
                className="form-control"
                style={{ width: '130px' }}
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                {categories.map((cat, i) => (
                  <option key={i} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="card">
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', fontWeight: 600 }}>Product Catalogue</h3>

            {loading ? (
              <p className="text-center text-secondary-label">Loading products...</p>
            ) : products.length === 0 ? (
              <p className="text-center text-secondary-label">No items available</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {products.map((prod) => {
                  const isInCart = cart.some((c) => c.product._id === prod._id);
                  return (
                    <div key={prod._id} className="product-search-item">
                      <div>
                        <strong style={{ fontSize: '0.95rem', display: 'block' }}>{prod.name}</strong>
                        <span className="text-secondary-label" style={{ fontSize: '0.75rem' }}>
                          SKU: <code>{prod.sku}</code> | Rate: <strong>₹{prod.pricePerUnit}</strong> / {prod.unit}
                        </span>
                        <div style={{ fontSize: '0.75rem', marginTop: '2px' }}>
                          Stock: <span className={prod.stockQuantity <= 10 ? 'text-warning' : 'text-success'} style={{ fontWeight: 600 }}>
                            {prod.stockQuantity} {prod.unit}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => addToCart(prod)}
                        disabled={prod.stockQuantity <= 0 || isInCart}
                        className={`btn btn-sm ${isInCart ? 'btn-secondary' : 'btn-primary'}`}
                        style={{ height: '36px' }}
                      >
                        {isInCart ? <Check size={14} /> : null}
                        <span>{isInCart ? 'Added' : 'Select'}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Proposal Basket */}
        <div>
          <div className="card" style={{ sticky: 'top', top: '90px' }}>
            <div className="flex-align-center gap-2 mb-4">
              <ShoppingCart size={20} className="text-primary" />
              <h3 style={{ fontSize: '1.1rem', margin: 0, fontWeight: 600 }}>Selected Proposal Items ({cart.length})</h3>
            </div>

            {cart.length === 0 ? (
              <div className="text-center text-secondary-label" style={{ padding: '3rem 0' }}>
                Select products from the catalogue on the left to add them to this proposal.
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem', maxHeight: '420px', overflowY: 'auto', paddingRight: '4px' }}>
                  {cart.map((item) => {
                    return (
                      <div key={item.product._id} style={{ padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'rgba(0,0,0,0.1)' }}>
                        <div className="flex-between mb-2">
                          <strong style={{ fontSize: '0.9rem' }}>{item.product.name}</strong>
                          <button
                            onClick={() => removeFromCart(item.product._id)}
                            style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}
                            title="Remove item"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>

                        <div className="flex" style={{ gap: '0.5rem', alignItems: 'center' }}>
                          {/* Input quantity */}
                          <div style={{ flex: 1 }}>
                            <label className="form-label" style={{ fontSize: '0.7rem', marginBottom: '2px' }}>Order Qty</label>
                            <input
                              type="number"
                              step="0.0001"
                              className="form-control"
                              style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
                              value={item.quantity}
                              onChange={(e) => updateCartItem(item.product._id, 'quantity', e.target.value)}
                              placeholder="Qty"
                              min="0"
                            />
                          </div>

                          {/* Unit display */}
                          <div style={{ width: '80px' }}>
                            <label className="form-label" style={{ fontSize: '0.7rem', marginBottom: '2px' }}>Unit</label>
                            <div className="form-control text-center" style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem', background: 'rgba(0, 0, 0, 0.4)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                              {item.product.unit}
                            </div>
                          </div>
                        </div>

                        {item.error ? (
                          <div className="text-error" style={{ fontSize: '0.75rem', marginTop: '6px', lineHeight: 1.2 }}>
                            {item.error}
                          </div>
                        ) : (
                          <div className="flex-between" style={{ marginTop: '8px', fontSize: '0.8rem' }}>
                            <span className="text-secondary-label">
                              Rate: ₹{item.product.pricePerUnit}/{item.product.unit}
                            </span>
                            <span className="text-success" style={{ fontWeight: 600 }}>
                              Price: ₹{Number(item.calculatedPrice.toFixed(2)).toLocaleString('en-IN')}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Pricing Summary */}
                <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                  <div className="flex-between mb-4">
                    <strong style={{ fontSize: '1rem' }}>Total Proposal Price:</strong>
                    <strong className="text-success" style={{ fontSize: '1.3rem' }}>
                      ₹{Number(orderTotal.toFixed(2)).toLocaleString('en-IN')}
                    </strong>
                  </div>

                  <button
                    onClick={handlePlaceOrder}
                    disabled={cart.some((item) => item.error || !item.quantity || item.quantity <= 0)}
                    className="btn btn-primary"
                    style={{ width: '100%' }}
                  >
                    <Send size={16} />
                    <span>Submit Quotation Request</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateOrder;
