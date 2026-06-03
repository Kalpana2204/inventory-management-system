import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useApp } from '../context/AppContext';
import { Plus, Edit2, Trash2, Search, X, Archive } from 'lucide-react';

const ManageProducts = () => {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [description, setDescription] = useState('');
  const [unit, setUnit] = useState('items');
  const [pricePerUnit, setPricePerUnit] = useState('');
  const [stockQuantity, setStockQuantity] = useState('');
  const [category, setCategory] = useState('');

  const { showToast, API_URL } = useApp();

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/products`, {
        params: { search, category: categoryFilter },
      });
      setProducts(res.data.products);
    } catch (err) {
      console.error(err);
      showToast('Failed to load products list', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [search, categoryFilter]);

  const openCreateModal = () => {
    setEditingId(null);
    setName('');
    setSku('');
    setDescription('');
    setUnit('items');
    setPricePerUnit('');
    setStockQuantity('');
    setCategory('General');
    setIsModalOpen(true);
  };

  const openEditModal = (product) => {
    setEditingId(product._id);
    setName(product.name);
    setSku(product.sku);
    setDescription(product.description || '');
    setUnit(product.unit);
    setPricePerUnit(product.pricePerUnit);
    setStockQuantity(product.stockQuantity);
    setCategory(product.category || 'General');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !sku || !pricePerUnit || stockQuantity === '') {
      showToast('Please fill out all required fields', 'error');
      return;
    }

    const payload = {
      name,
      sku,
      description,
      unit,
      pricePerUnit: parseFloat(pricePerUnit),
      stockQuantity: parseFloat(stockQuantity),
      category: category || 'General',
    };

    try {
      if (editingId) {
        // Edit product
        const res = await axios.put(`${API_URL}/products/${editingId}`, payload);
        if (res.data.success) {
          showToast('Product updated successfully', 'success');
        }
      } else {
        // Create product
        const res = await axios.post(`${API_URL}/products`, payload);
        if (res.data.success) {
          showToast('Product created successfully', 'success');
        }
      }
      closeModal();
      fetchProducts();
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Save failed';
      showToast(errMsg, 'error');
    }
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      const res = await axios.delete(`${API_URL}/products/${productId}`);
      if (res.data.success) {
        showToast('Product deleted successfully', 'success');
        fetchProducts();
      }
    } catch (err) {
      showToast('Failed to delete product', 'error');
    }
  };

  const categories = ['All', ...new Set(products.map((p) => p.category).filter(Boolean))];

  return (
    <div className="container">
      <div className="flex-between mb-6">
        <div>
          <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 700 }}>Inventory CRUD</h1>
          <p className="text-secondary-label">Create, update, and manage your products and prices</p>
        </div>
        <button onClick={openCreateModal} className="btn btn-primary">
          <Plus size={18} />
          <span>Add Product</span>
        </button>
      </div>

      {/* Searching and Filtering Controls */}
      <div className="card mb-4" style={{ padding: '1rem 1.5rem' }}>
        <div className="flex-between" style={{ gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input
              type="text"
              className="form-control"
              style={{ paddingLeft: '2.5rem' }}
              placeholder="Search products by name or SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex-align-center gap-2">
            <span className="text-secondary-label" style={{ fontSize: '0.9rem', whiteSpace: 'nowrap' }}>Category:</span>
            <select
              className="form-control"
              style={{ width: '160px' }}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              {categories.map((cat, i) => (
                <option key={i} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Products Inventory Table */}
      <div className="card">
        <div className="flex-align-center gap-2 mb-4">
          <Archive size={20} className="text-success" />
          <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Product Inventory Catalogue ({products.length})</h2>
        </div>

        {loading ? (
          <p className="text-center text-secondary-label" style={{ padding: '2rem 0' }}>Loading items...</p>
        ) : products.length === 0 ? (
          <p className="text-center text-secondary-label" style={{ padding: '2rem 0' }}>
            No products found matching filters.
          </p>
        ) : (
          <div className="table-container" style={{ margin: 0 }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Product Details</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Unit</th>
                  <th>Price per Unit (INR)</th>
                  <th>Available Stock</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((prod) => (
                  <tr key={prod._id}>
                    <td>
                      <div>
                        <strong>{prod.name}</strong>
                        {prod.description && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', maxWidth: '280px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                            {prod.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <code style={{ fontSize: '0.8rem' }}>{prod.sku}</code>
                    </td>
                    <td>
                      <span className="badge btn-secondary btn-sm" style={{ textTransform: 'none' }}>
                        {prod.category || 'General'}
                      </span>
                    </td>
                    <td>
                      <strong>{prod.unit}</strong>
                    </td>
                    <td>
                      <strong>₹{Number(prod.pricePerUnit.toFixed(4))}</strong>
                    </td>
                    <td>
                      <span className={prod.stockQuantity <= 10 ? 'text-warning' : 'text-success'} style={{ fontWeight: 600 }}>
                        {prod.stockQuantity} {prod.unit}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="flex gap-2" style={{ justifyContent: 'flex-end' }}>
                        <button onClick={() => openEditModal(prod)} className="btn btn-secondary btn-sm" title="Edit Product">
                          <Edit2 size={14} />
                          <span>Edit</span>
                        </button>
                        <button onClick={() => handleDelete(prod._id)} className="btn btn-danger btn-sm" title="Delete Product">
                          <Trash2 size={14} />
                          <span>Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Dialog Overlay Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingId ? 'Edit Product Profile' : 'Register New Product'}</h3>
              <button onClick={closeModal} className="modal-close"><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Product Name *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Sodium Chloride"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="grid-cols-2" style={{ gap: '1rem', marginBottom: 0 }}>
                <div className="form-group">
                  <label className="form-label">Unique SKU *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. NACL-100G"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Category</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Chemical / Reagent"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Product Description</label>
                <textarea
                  className="form-control"
                  placeholder="Details, chemical formula, or storage criteria..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="grid-cols-3" style={{ gap: '1rem', marginBottom: 0 }}>
                <div className="form-group">
                  <label className="form-label">Unit *</label>
                  <select
                    className="form-control"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                  >
                    <option value="items">items</option>
                    <option value="g">grams (g)</option>
                    <option value="kg">kilograms (kg)</option>
                    <option value="L">liters (L)</option>
                    <option value="mL">milliliters (mL)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Price per Unit *</label>
                  <input
                    type="number"
                    step="0.0001"
                    className="form-control"
                    placeholder="INR Rate"
                    value={pricePerUnit}
                    onChange={(e) => setPricePerUnit(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Initial Stock *</label>
                  <input
                    type="number"
                    step="0.0001"
                    className="form-control"
                    placeholder="Quantity"
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-4" style={{ justifyContent: 'flex-end' }}>
                <button type="button" onClick={closeModal} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">
                  {editingId ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageProducts;
