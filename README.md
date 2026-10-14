# ZappKart — Production-Ready Multi-Vendor Marketplace

**ZappKart** is a production-oriented, full-stack multi-vendor e-commerce marketplace platform (architected similar to Amazon and Flipkart). It includes dedicated portals for **Customers**, independent **Sellers**, and the **Super Administrator**, supported by real server-side pricing validation, transactional inventory management, multi-vendor order routing, and Indian payment gateway integration.

---

## 🌟 Key Architecture & Capabilities

### 1. Customer Shopping Application
- **Dynamic Catalog**: Full-text search, multi-faceted filtering (categories, price range slider, star ratings, in-stock only), and multiple sorting options.
- **Product Details**: Multi-angle image galleries, technical specifications, live warehouse availability, customer star ratings, and review submission.
- **Cart & Wishlist**: Real-time stock reservation, quantity adjustments, and single-click move to wishlist.
- **3-Step Checkout**:
  - Saved delivery address selection or new location addition.
  - Server-side authoritative price verification & coupon application (`WELCOME10`, `ZAPP500`).
  - Payment method selection: Cash on Delivery (COD) or Razorpay Instant Gateway with test simulation.
- **Live Order Tracking**: Visual 5-step status progression (`Placed` → `Confirmed` → `Processing` → `Shipped` with carrier name & tracking number → `Delivered`).
- **Self-Service Returns & Cancellations**: Restocks inventory automatically and schedules pickup within the 7-day return window.

### 2. Merchant Seller Panel
- **Seller Onboarding**: Merchant registration with store name, logo, business address, and GSTIN.
- **Verification Gate**: New sellers remain in `pending` status until approved by Super Admin.
- **Product Lifecycle Management**: Add, edit, deactivate, or delete listings with multiple image URLs, SKUs, and inventory thresholds.
- **Multi-Tenant Sub-Order Fulfillment**: Each merchant only accesses order items assigned to their store; view recipient shipping address and dispatch with carrier & AWB tracking numbers.
- **Financial Settlements**: Monitor gross sales, platform commission deductions, settled earnings, and submit payout withdrawal requests directly to Super Admin.

### 3. Super Admin Command Center
- **Executive KPIs**: Marketplace Gross Merchandise Value (GMV), platform commission earnings, total orders, active sellers, and customers.
- **Seller Approval System**: Review pending seller applications, approve, reject, suspend, or reactivate merchants, and configure custom commission rates (e.g., 8%, 10%, 15%).
- **Marketplace Policy Controls**: Configure default platform commission, free shipping threshold (default ₹999), flat shipping fee (default ₹79), and COD availability.
- **Coupon Manager**: Create promo discount codes (percentage or flat discounts, minimum order threshold, and usage limits).
- **Security Audit Logs**: Immutable chronological record of all administrative decisions, seller approvals, and order status overrides.
- **Built-in Verification Test Runner**: Execute 17 automated acceptance tests directly from the dashboard.

---

## 🔑 Pre-Provisioned Persona Accounts

For instant evaluation, the platform includes pre-configured persona accounts with encrypted credentials:

| Persona Role | Email Address | Password | Description |
|---|---|---|---|
| **Super Administrator** | `admin@zappkart.com` | `AdminSecurePassword123!` | Complete administrative authority |
| **Approved Seller (Tech)** | `nexus@techhub.in` | `SellerPass123!` | Nexus Gadgets & Electronics (Authorized dealer) |
| **Approved Seller (Fashion)** | `care@urbanthreads.com` | `SellerPass123!` | Urban Threads Studio (Artisanal apparel) |
| **Pending Seller (Review)** | `organic@greenroots.in` | `SellerPass123!` | Green Roots Botanicals (Awaiting admin approval) |
| **Verified Customer** | `customer@example.com` | `CustomerPass123!` | Rahul Sharma (Active shopper with saved address) |

*You can also use the **Persona Switcher** dropdown in the top utility bar to switch accounts in one click.*

---

## 🚀 Getting Started & Local Development

### Prerequisites
- Node.js v18 or higher (v22 recommended)
- npm or bun

### 1. Installation
```bash
git clone <repository-url>
cd zappkart
npm install
```

### 2. Environment Configuration
Copy the template configuration:
```bash
cp .env.example .env
```
*(The defaults are pre-configured for local development and sandbox simulation).*

### 3. Run Development Server
```bash
npm run dev
```
The server will start at `http://localhost:3000` serving both the Express backend API and Vite React frontend.

### 4. Running the Automated Acceptance Test Suite
```bash
npm test
```
Verifies all 17 security assertions, RBAC checks, seller data isolation, and pricing integrity invariants.

---

## 📦 Deliverables & Source Code Download

- **Direct ZIP Download**: Download the complete project archive at any time via `/api/download-project-zip` or by clicking the **"Download ZIP"** button in the header.
- **Android APK Build**: Follow the detailed guide in `docs/ANDROID_BUILD_GUIDE.md` to package the app using Capacitor and Android Studio.
- **Firebase Deployment**: See `docs/FIREBASE_SETUP.md` for Cloud Firestore and Firebase Auth configuration.
- **Payment Gateway**: See `docs/PAYMENTS_SETUP.md` for live Razorpay credentials and webhook setup.
- **Production Checklist**: See `docs/PRODUCTION_CHECKLIST.md` for commercial launch readiness.
