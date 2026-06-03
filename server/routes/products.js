const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/products
// @desc    Get all products (with optional search and category filters)
// @access  Private (Both Seller and Admin)
router.get('/', protect, async (req, res) => {
  try {
    const { search, category } = req.query;
    let query = {};

    // Search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
      ];
    }

    // Category filter
    if (category && category !== 'All') {
      query.category = category;
    }

    const products = await Product.find(query).sort({ name: 1 });
    res.json({ success: true, count: products.length, products });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
});

// @route   GET /api/products/:id
// @desc    Get a single product
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, product });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
});

// @route   POST /api/products
// @desc    Create a product
// @access  Private (Admin Only)
router.post('/', protect, authorize('admin'), async (req, res) => {
  const { name, sku, description, unit, pricePerUnit, stockQuantity, category } = req.body;

  try {
    // Check if SKU exists
    const skuExists = await Product.findOne({ sku });
    if (skuExists) {
      return res.status(400).json({ success: false, message: 'Product SKU already exists' });
    }

    const product = await Product.create({
      name,
      sku,
      description,
      unit,
      pricePerUnit,
      stockQuantity: stockQuantity || 0,
      category,
    });

    res.status(201).json({ success: true, product });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
});

// @route   PUT /api/products/:id
// @desc    Update a product
// @access  Private (Admin Only)
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  const { name, sku, description, unit, pricePerUnit, stockQuantity, category } = req.body;

  try {
    let product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Check SKU conflicts
    if (sku && sku !== product.sku) {
      const skuExists = await Product.findOne({ sku });
      if (skuExists) {
        return res.status(400).json({ success: false, message: 'Product SKU already exists' });
      }
    }

    // Update fields
    product.name = name || product.name;
    product.sku = sku || product.sku;
    product.description = description !== undefined ? description : product.description;
    product.unit = unit || product.unit;
    product.pricePerUnit = pricePerUnit !== undefined ? pricePerUnit : product.pricePerUnit;
    product.stockQuantity = stockQuantity !== undefined ? stockQuantity : product.stockQuantity;
    product.category = category || product.category;

    await product.save();
    res.json({ success: true, product });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
});

// @route   DELETE /api/products/:id
// @desc    Delete a product
// @access  Private (Admin Only)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    await Product.deleteOne({ _id: req.params.id });
    res.json({ success: true, message: 'Product removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
});

module.exports = router;
