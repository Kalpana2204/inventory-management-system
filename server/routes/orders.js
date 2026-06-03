const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const { protect, authorize } = require('../middleware/auth');
const { calculatePrice, convertQuantity, areUnitsCompatible } = require('../utils/unitConverter');

// @route   POST /api/orders
// @desc    Place a new quotation/order
// @access  Private (Seller/User only)
router.post('/', protect, authorize('seller'), async (req, res) => {
  const { items } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ success: false, message: 'No items in order' });
  }

  try {
    let totalAmount = 0;
    const orderItems = [];

    // Validate items and calculate prices
    for (const item of items) {
      const { productId, quantity, unit } = item;

      // Find product
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ success: false, message: `Product not found: ${productId}` });
      }

      // Check unit compatibility
      if (!areUnitsCompatible(unit, product.baseUnit)) {
        return res.status(400).json({
          success: false,
          message: `Incompatible unit '${unit}' for product '${product.name}' (base unit: '${product.baseUnit}')`,
        });
      }

      // Calculate quantity converted to base unit to check stock
      const qtyInBaseUnit = convertQuantity(quantity, unit, product.baseUnit);
      if (qtyInBaseUnit > product.stockQuantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for product '${product.name}'. Available: ${product.stockQuantity} ${product.baseUnit}, Requested: ${qtyInBaseUnit} ${product.baseUnit} (equivalent to ${quantity} ${unit})`,
        });
      }

      // Calculate price
      const calculatedPrice = calculatePrice(quantity, unit, product.baseUnit, product.pricePerBaseUnit);
      totalAmount += calculatedPrice;

      orderItems.push({
        product: productId,
        quantity,
        unit,
        calculatedPrice,
      });
    }

    // Create Order
    const order = await Order.create({
      seller: req.user._id,
      items: orderItems,
      totalAmount: Number(totalAmount.toFixed(4)),
    });

    res.status(201).json({ success: true, order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
});

// @route   GET /api/orders
// @desc    Get orders (Admin: all orders, Seller: their own orders)
// @access  Private (Seller and Admin)
router.get('/', protect, async (req, res) => {
  try {
    let query = {};
    
    // If not admin, restrict to self
    if (req.user.role !== 'admin') {
      query.seller = req.user._id;
    }

    const orders = await Order.find(query)
      .populate('seller', 'name email')
      .populate('items.product', 'name sku baseUnit pricePerBaseUnit')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: orders.length, orders });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
});

// @route   PUT /api/orders/:id/status
// @desc    Update order/quotation status (Admin only)
// @access  Private (Admin only)
router.put('/:id/status', protect, authorize('admin'), async (req, res) => {
  const { status } = req.body;

  if (!['approved', 'completed', 'rejected', 'pending'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status' });
  }

  try {
    const order = await Order.findById(req.params.id)
      .populate('items.product');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Handle stock changes on approval
    if (status === 'approved' && order.status !== 'approved') {
      // 1. Check if we have sufficient stock for all items
      for (const item of order.items) {
        const product = await Product.findById(item.product._id);
        if (!product) {
          return res.status(404).json({
            success: false,
            message: `Product not found: ${item.product.name}`,
          });
        }

        const qtyInBaseUnit = convertQuantity(item.quantity, item.unit, product.baseUnit);
        if (qtyInBaseUnit > product.stockQuantity) {
          return res.status(400).json({
            success: false,
            message: `Cannot approve order. Product '${product.name}' has insufficient stock. Available: ${product.stockQuantity} ${product.baseUnit}, Order requires: ${qtyInBaseUnit} ${product.baseUnit}`,
          });
        }
      }

      // 2. Deduct stock
      for (const item of order.items) {
        const product = await Product.findById(item.product._id);
        const qtyInBaseUnit = convertQuantity(item.quantity, item.unit, product.baseUnit);
        product.stockQuantity = Number((product.stockQuantity - qtyInBaseUnit).toFixed(4));
        await product.save();
      }
    }

    // Handle returning stock if moving away from approved/completed/pending back to rejected
    if (status === 'rejected' && order.status === 'approved') {
      // Revert stock deductions
      for (const item of order.items) {
        const product = await Product.findById(item.product._id);
        if (product) {
          const qtyInBaseUnit = convertQuantity(item.quantity, item.unit, product.baseUnit);
          product.stockQuantity = Number((product.stockQuantity + qtyInBaseUnit).toFixed(4));
          await product.save();
        }
      }
    }

    order.status = status;
    await order.save();

    res.json({ success: true, order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
});

module.exports = router;
