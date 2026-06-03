const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  quantity: {
    type: Number,
    required: [true, 'Please provide an order quantity'],
    min: [0.0001, 'Quantity must be greater than zero'],
  },
  unit: {
    type: String,
    required: [true, 'Please provide the ordered unit'],
    enum: ['g', 'kg', 'L', 'mL', 'items'],
  },
  calculatedPrice: {
    type: Number,
    required: true,
    min: [0, 'Calculated price cannot be negative'],
  },
});

const orderSchema = new mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    items: [orderItemSchema],
    totalAmount: {
      type: Number,
      required: true,
      min: [0, 'Total amount cannot be negative'],
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'completed', 'rejected'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Order', orderSchema);
