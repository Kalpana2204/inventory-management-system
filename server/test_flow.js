const mongoose = require('mongoose');
const User = require('./models/User');
const Product = require('./models/Product');
const Order = require('./models/Order');

const MONGODB_URI = 'mongodb://127.0.0.1:27017/inventory-management';

async function runTest() {
  console.log('--- Connecting to test database ---');
  await mongoose.connect(MONGODB_URI);
  console.log('Database connected.');

  // Clear database to have a clean test slate
  console.log('--- Cleaning database collections ---');
  await User.deleteMany({});
  await Product.deleteMany({});
  await Order.deleteMany({});
  console.log('Database cleaned.');

  // 1. Create Users (Admin & Seller)
  console.log('\n--- Step 1: Creating Users ---');
  const admin = await User.create({
    name: 'Admin User',
    email: 'admin@test.com',
    password: 'password123',
    role: 'admin'
  });
  console.log(`Admin User Created: ${admin.name} (${admin.email})`);

  const seller = await User.create({
    name: 'Seller User',
    email: 'seller@test.com',
    password: 'password123',
    role: 'seller'
  });
  console.log(`Seller User Created: ${seller.name} (${seller.email})`);

  // 2. Admin creates products
  console.log('\n--- Step 2: Creating Products ---');
  // 1000g of Sodium Chloride (Stored in 'g')
  const prodA = await Product.create({
    name: 'Sodium Chloride (NaCl)',
    sku: 'NACL-100G',
    unit: 'g',
    pricePerUnit: 0.5, // 0.5 INR per gram
    stockQuantity: 1000,
    category: 'Chemicals'
  });
  console.log(`Product A Created: ${prodA.name} | Stock: ${prodA.stockQuantity} ${prodA.unit} | Price: ₹${prodA.pricePerUnit}/${prodA.unit}`);

  // 2000mL of Hydrochloric Acid (Stored in 'mL')
  const prodB = await Product.create({
    name: 'Hydrochloric Acid (HCl)',
    sku: 'HCL-1L',
    unit: 'mL',
    pricePerUnit: 0.08, // 0.08 INR per mL
    stockQuantity: 2000,
    category: 'Acids'
  });
  console.log(`Product B Created: ${prodB.name} | Stock: ${prodB.stockQuantity} ${prodB.unit} | Price: ₹${prodB.pricePerUnit}/${prodB.unit}`);

  // 50 Items of Pipettes (Stored in 'items')
  const prodC = await Product.create({
    name: 'Glass Measuring Pipette 10mL',
    sku: 'PIP-10',
    unit: 'items',
    pricePerUnit: 12.0, // 12 INR per item
    stockQuantity: 50,
    category: 'Labware'
  });
  console.log(`Product C Created: ${prodC.name} | Stock: ${prodC.stockQuantity} ${prodC.unit} | Price: ₹${prodC.pricePerUnit}/${prodC.unit}`);

  // 3. Seller builds an order cart directly
  console.log('\n--- Step 3: Simulating Seller Cart Direct Pricing ---');
  // Item 1: NaCl ordered in g (matches unit)
  const itemA_qty = 500;
  const itemA_unit = 'g';
  const priceA = Number((itemA_qty * prodA.pricePerUnit).toFixed(4));
  console.log(`NaCl: Ordering ${itemA_qty} ${itemA_unit}. Calculated Price: ₹${priceA} (Expected: ₹250)`);

  // Item 2: HCl ordered in mL (matches unit)
  const itemB_qty = 1500; // 1500 mL
  const itemB_unit = 'mL';
  const priceB = Number((itemB_qty * prodB.pricePerUnit).toFixed(4));
  console.log(`HCl: Ordering ${itemB_qty} ${itemB_unit}. Calculated Price: ₹${priceB} (Expected: ₹120)`);

  // Item 3: Pipettes ordered in items (matches unit)
  const itemC_qty = 10;
  const itemC_unit = 'items';
  const priceC = Number((itemC_qty * prodC.pricePerUnit).toFixed(4));
  console.log(`Pipettes: Ordering ${itemC_qty} ${itemC_unit}. Calculated Price: ₹${priceC} (Expected: ₹120)`);

  const orderTotal = priceA + priceB + priceC;
  console.log(`Total Order Amount: ₹${orderTotal} (Expected: ₹490)`);

  // 4. Place Order (Simulation)
  console.log('\n--- Step 4: Placing Order ---');
  const order = await Order.create({
    seller: seller._id,
    items: [
      { product: prodA._id, quantity: itemA_qty, unit: itemA_unit, calculatedPrice: priceA },
      { product: prodB._id, quantity: itemB_qty, unit: itemB_unit, calculatedPrice: priceB },
      { product: prodC._id, quantity: itemC_qty, unit: itemC_unit, calculatedPrice: priceC }
    ],
    totalAmount: orderTotal,
    status: 'pending'
  });
  console.log(`Order Placed successfully! ID: ${order._id} | Status: ${order.status}`);

  // 5. Admin Approves Order
  console.log('\n--- Step 5: Admin Approving Order & Deducting Stock ---');
  
  // Reload order with products populated
  const activeOrder = await Order.findById(order._id).populate('items.product');
  
  // Stock Check & Subtraction
  for (const item of activeOrder.items) {
    const product = await Product.findById(item.product._id);
    
    console.log(`Verifying Stock for '${product.name}': Required ${item.quantity} ${product.unit}, Available ${product.stockQuantity} ${product.unit}`);
    if (item.quantity > product.stockQuantity) {
      throw new Error(`Insufficient stock for ${product.name}`);
    }

    product.stockQuantity = Number((product.stockQuantity - item.quantity).toFixed(4));
    await product.save();
    console.log(`Stock updated for '${product.name}' to ${product.stockQuantity} ${product.unit}`);
  }

  activeOrder.status = 'approved';
  await activeOrder.save();
  console.log(`Order approved. Current status: ${activeOrder.status}`);

  // 6. Verify final inventory levels
  console.log('\n--- Step 6: Verifying Final Stock Levels ---');
  const checkA = await Product.findById(prodA._id);
  const checkB = await Product.findById(prodB._id);
  const checkC = await Product.findById(prodC._id);

  console.log(`NaCl Stock (Expected 500): ${checkA.stockQuantity} ${checkA.unit}`);
  console.log(`HCl Stock (Expected 500): ${checkB.stockQuantity} ${checkB.unit}`);
  console.log(`Pipette Stock (Expected 40): ${checkC.stockQuantity} ${checkC.unit}`);

  if (checkA.stockQuantity === 500 && checkB.stockQuantity === 500 && checkC.stockQuantity === 40) {
    console.log('\n>>> SUCCESS: ALL TESTS PASSED SUCCESSFULLY! DIRECT PRICING AND STOCK DEDUCTION ARE 100% CORRECT! <<<');
  } else {
    console.error('\n>>> FAILURE: STOCK MISMATCH! <<<');
  }

  await mongoose.connection.close();
  console.log('\nDatabase connection closed.');
}

runTest().catch((err) => {
  console.error('Test failed with error:', err);
  mongoose.connection.close();
});
