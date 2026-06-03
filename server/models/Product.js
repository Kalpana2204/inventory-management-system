const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a product name'],
      trim: true,
    },
    sku: {
      type: String,
      required: [true, 'Please provide a unique SKU'],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    baseUnit: {
      type: String,
      required: [true, 'Please provide a base unit'],
      enum: ['g', 'kg', 'L', 'mL', 'items'],
    },
    pricePerBaseUnit: {
      type: Number,
      required: [true, 'Please provide the base price in INR'],
      min: [0, 'Price cannot be negative'],
    },
    stockQuantity: {
      type: Number,
      required: [true, 'Please provide the stock quantity'],
      min: [0, 'Stock cannot be negative'],
      default: 0,
    },
    category: {
      type: String,
      trim: true,
      default: 'General',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Product', productSchema);
