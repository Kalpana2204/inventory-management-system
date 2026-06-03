# Chemical Inventory & Order Management System

This is a simple B2B inventory and order tracking website built using the MERN stack (MongoDB, Express, React, Node.js). 

It features basic role-based access control with two roles: **Admin** (owner) and **Seller** (sales rep/buyer). 

## How the app works
- **Admin (Owner)**: Can add new products to the inventory, edit prices or stock quantities, and view incoming orders/quotations to approve or reject them. Approving an order automatically deducts the quantities from the warehouse stock.
- **Seller (User/Buyer)**: Can search the product catalog, add items to an order list, and submit a quotation request. Orders are placed in the product's native unit (e.g. grams, items, liters) and the total price is calculated instantly (Quantity * Rate).

---

## Technical Setup

- **Frontend**: React (Vite) styled with clean vanilla CSS.
- **Backend**: Node.js & Express API using JSON Web Tokens (JWT) for user login sessions.
- **Database**: MongoDB (Mongoose schemas).

---

## Database Schema (Mongoose Models)

### 1. User (`models/User.js`)
Stores user login details.
- `name` (String): Display name.
- `email` (String): Unique login email.
- `password` (String): Hashed using bcrypt.
- `role` (String): Can be `admin` or `seller`.

### 2. Product (`models/Product.js`)
Catalog of products available for sale.
- `name` (String): Name of the chemical.
- `sku` (String): Unique SKU code.
- `unit` (String): Unit of measurement (`g`, `kg`, `L`, `mL`, or `items`).
- `pricePerUnit` (Number): Price in INR for one unit.
- `stockQuantity` (Number): How many units are available.
- `category` (String): Filter category (e.g., Chemicals, Acids, Labware).

### 3. Order (`models/Order.js`)
Tracks the orders/quotations submitted.
- `seller` (ObjectId ref User): The seller who placed the order.
- `items`: Array of objects containing:
  - `product` (ObjectId ref Product)
  - `quantity` (Number)
  - `unit` (String)
  - `calculatedPrice` (Number)
- `totalAmount` (Number): Total cost of the order in INR.
- `status` (String): `pending` (default), `approved`, `completed`, or `rejected`.

---

## How to Run the Project Locally

### 1. Prerequisites
Make sure you have **Node.js** and **MongoDB** installed on your system.

### 2. Run the Backend Server
1. Open your terminal and go to the server directory:
   ```bash
   cd server
   ```
2. Create a `.env` file in the `server` folder with these values:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://127.0.0.1:27017/inventory-management
   JWT_SECRET=some_secret_key_123
   ```
3. Start the server:
   ```bash
   npm start
   ```
   The backend will run on `http://localhost:5000`.

### 3. Run the React Frontend
1. Open a new terminal window and go to the client directory:
   ```bash
   cd client
   ```
2. Start the Vite development server:
   ```bash
   npm run dev
   ```
   Open your browser and go to `http://localhost:5173`.

---

## Testing / Seeding Data
We added an automated integration test script that seeds the database with test accounts, products, and a sample order. You can use it to instantly populate your DB:

1. In the `server` folder, run:
   ```bash
   node test_flow.js
   ```
2. It will output `>>> SUCCESS: ALL TESTS PASSED SUCCESSFULLY! <<<` if everything is working fine.

### Test Accounts (Pre-seeded by test_flow.js)
You can log in with these test accounts:
- **Admin**: email `admin@test.com` | password `password123`
- **Seller**: email `seller@test.com` | password `password123`
