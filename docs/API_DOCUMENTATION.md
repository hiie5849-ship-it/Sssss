# ZappKart Marketplace — API Documentation

This document describes all secure REST API endpoints provided by the ZappKart backend engine.

---

## 1. Authentication & User Profile (`/api/auth`)

### `POST /api/auth/register`
Registers a new customer or merchant seller account.
- **Payload:**
  ```json
  {
    "name": "Arun Kumar",
    "email": "arun@example.com",
    "password": "Password123!",
    "phone": "+91 98765 43210",
    "role": "customer" | "seller",
    "sellerInfo": {
      "storeName": "Arun Retailers",
      "storeDescription": "Quality apparel and home goods",
      "businessAddress": "Bengaluru, KA"
    }
  }
  ```
- **Response `201`:** `{ "token": "jwt...", "user": {...}, "sellerProfile": {...} }`
- **Security:** New sellers default to `approvalStatus: "pending"`. Super Admin must approve before products can be published.

### `POST /api/auth/login`
- **Payload:** `{ "email": "admin@zappkart.com", "password": "AdminSecurePassword123!" }`
- **Response `200`:** Returns JWT session token, user details, and seller profile (if role is seller).

### `GET /api/auth/me`
- **Headers:** `Authorization: Bearer <token>`
- **Response `200`:** Current authenticated user profile with active status.

---

## 2. Products Catalog & Inventory (`/api/products`)

### `GET /api/products`
Public product search, multi-faceted filtering, sorting, and pagination.
- **Query Parameters:**
  - `q`: Search keyword (matched against title, description, SKU, brand, category)
  - `category`: Category slug (e.g., `electronics`, `fashion`)
  - `minPrice`, `maxPrice`: Numerical price boundaries
  - `minRating`: Minimum average star rating (e.g., `4`)
  - `inStock`: `true` to filter out out-of-stock items
  - `sellerId`: Filter by specific seller store
  - `sortBy`: `newest` | `price_asc` | `price_desc` | `rating` | `popular`
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 20)

### `GET /api/products/:id`
Returns full product details, seller profile, and customer reviews.

### `POST /api/products`
- **Headers:** `Authorization: Bearer <token>` (Seller or Admin)
- **Validation:** Seller must have `approvalStatus: "approved"`. Positive prices, stock `>= 0`.

### `PUT /api/products/:id`
- **Headers:** `Authorization: Bearer <token>`
- **Authorization:** Only the owner seller or Super Admin can edit.

### `DELETE /api/products/:id`
- **Headers:** `Authorization: Bearer <token>`
- Removes or deactivates product.

---

## 3. Cart, Wishlist & Addresses (`/api`)

- `GET /api/cart`: Live cart items with database prices, images, and current stock.
- `POST /api/cart/add`: Add `{ productId, quantity }` (rejects if exceeding stock).
- `PUT /api/cart/update`: Update quantity or remove.
- `DELETE /api/cart/item/:productId`: Remove item.
- `DELETE /api/cart/clear`: Empty cart.
- `GET /api/wishlist`: Customer wishlist items.
- `POST /api/wishlist/toggle`: Add or remove product ID.
- `GET /api/addresses`: Saved delivery addresses.
- `POST /api/addresses`: Add new delivery address.

---

## 4. Orders & Multi-Seller Workflow (`/api/orders`)

### `POST /api/orders/preview`
Authoritative server-side price calculation.
- Checks stock for all items.
- Computes subtotal from database prices.
- Validates coupon code and expiration.
- Calculates shipping fee and taxes.

### `POST /api/orders/place`
Creates master order and seller-specific sub-orders.
- **Payload:**
  ```json
  {
    "addressId": "addr_123",
    "paymentMethod": "cod" | "razorpay",
    "couponCode": "WELCOME10",
    "razorpayPaymentId": "pay_xxx",
    "razorpayOrderId": "order_xxx",
    "razorpaySignature": "hmac_hex",
    "idempotencyKey": "uuid_v4"
  }
  ```
- **Operations:**
  - Locks and decrements inventory in real-time.
  - Splits order items by `sellerId`.
  - Generates SubOrders for each seller with their respective commission & payout earnings.
  - Emits notifications to customer and sellers.

### `GET /api/orders`
Customer order history with delivery timeline.

### `POST /api/orders/:id/cancel`
Cancels order if placed/confirmed, restores inventory, and initiates refund.

### `POST /api/orders/:id/return`
Submits return request for delivered orders within the return window.

---

## 5. Seller Portal (`/api/sellers`)

- `GET /api/sellers/dashboard`: Real-time analytics, revenue, orders count, low stock count.
- `GET /api/sellers/products`: Seller's inventory catalog.
- `GET /api/sellers/sub-orders`: Seller's assigned orders only (Strict isolation: cannot see items from other sellers).
- `PUT /api/sellers/sub-orders/:id/status`: Update status (`processing`, `shipped` with tracking & carrier, `delivered`).
- `POST /api/sellers/payout-request`: Request withdrawal of settled earnings.
- `GET /api/sellers/payouts`: Payout history and balance.

---

## 6. Super Admin (`/api/admin`)

- `GET /api/admin/metrics`: Platform GMV, orders count, seller counts, commission revenue.
- `GET /api/admin/sellers`: Review all merchants.
- `PUT /api/admin/sellers/:id/approval`: Approve, reject, or suspend seller; adjust commission rate.
- `GET /api/admin/orders`: Marketplace-wide order supervisor.
- `PUT /api/admin/payouts/:id/status`: Transfer or reject seller payouts with reference numbers.
- `GET /api/admin/audit-logs`: Immutable log of administrative and sensitive actions.
- `PUT /api/admin/settings`: Marketplace policy configuration (commissions, shipping rules, COD toggle).

---

## 7. Payments (`/api/payments`)

- `GET /api/payments/config`: Public gateway parameters and active payment modes.
- `POST /api/payments/razorpay/create-order`: Generate backend Razorpay order.
- `POST /api/payments/razorpay/verify`: Validates HMAC-SHA256 signature.
