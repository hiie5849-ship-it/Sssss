export interface User {
  id: string;
  email: string;
  role: 'customer' | 'seller' | 'admin';
  name: string;
  phone?: string;
  status: 'active' | 'suspended';
  createdAt?: string;
}

export interface SellerProfile {
  userId: string;
  storeName: string;
  storeSlug: string;
  storeDescription: string;
  storeLogo?: string;
  storeBanner?: string;
  businessAddress: string;
  gstin?: string;
  pan?: string;
  bankAccount?: string;
  ifsc?: string;
  approvalStatus: 'pending' | 'approved' | 'rejected' | 'suspended';
  commissionRate: number;
  totalSales: number;
  totalEarnings: number;
  rating: number;
  numRatings: number;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
  image: string;
  displayOrder: number;
  isActive: boolean;
}

export interface Product {
  id: string;
  sellerId: string;
  storeName: string;
  title: string;
  slug: string;
  description: string;
  categoryId: string;
  categoryName: string;
  price: number;
  salePrice: number;
  sku: string;
  stock: number;
  images: string[];
  status: 'active' | 'inactive' | 'draft';
  rating: number;
  numReviews: number;
  isFeatured: boolean;
  attributes?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  street: string;
  apartment?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  label?: 'home' | 'work' | 'other';
}

export interface CartItem {
  productId: string;
  title: string;
  price: number;
  salePrice: number;
  images: string[];
  stock: number;
  sellerId: string;
  storeName: string;
  quantity: number;
  isAvailable: boolean;
}

export interface OrderItem {
  productId: string;
  sellerId: string;
  storeName: string;
  title: string;
  image: string;
  price: number;
  quantity: number;
  subtotal: number;
  commissionRate: number;
  commissionAmount: number;
  sellerEarnings: number;
}

export interface SubOrder {
  id: string;
  parentOrderId: string;
  sellerId: string;
  storeName: string;
  items: OrderItem[];
  subtotal: number;
  commissionAmount: number;
  sellerEarnings: number;
  status: 'placed' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
  trackingNumber?: string;
  carrier?: string;
  cancellationReason?: string;
  returnReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: Address;
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  tax: number;
  discountAmount: number;
  couponCode?: string;
  totalAmount: number;
  paymentMethod: 'cod' | 'razorpay' | 'card' | 'upi';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  orderStatus: 'placed' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
  cancellationReason?: string;
  returnReason?: string;
  sellerIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SellerPayout {
  id: string;
  sellerId: string;
  storeName: string;
  amount: number;
  status: 'pending' | 'approved' | 'transferred' | 'rejected';
  requestedAt: string;
  processedAt?: string;
  referenceNumber?: string;
  note?: string;
}

export interface Review {
  id: string;
  productId: string;
  orderId?: string;
  customerId: string;
  customerName: string;
  rating: number;
  title: string;
  comment: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'order' | 'seller' | 'system' | 'promo';
  read: boolean;
  link?: string;
  createdAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'flat';
  discountValue: number;
  minOrderAmount: number;
  maxDiscount?: number;
  validUntil: string;
  timesUsed: number;
  usageLimit: number;
  isActive: boolean;
}

export interface AuditLog {
  id: string;
  actorId: string;
  actorEmail: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string;
  details?: any;
  ip?: string;
  createdAt: string;
}

export interface AppSettings {
  marketplaceName: string;
  defaultCommissionRate: number;
  freeShippingThreshold: number;
  flatShippingFee: number;
  allowCod: boolean;
  testMode: boolean;
  razorpayKeyId: string;
  supportEmail: string;
  supportPhone: string;
  returnWindowDays: number;
  banners: { id: string; title: string; subtitle: string; link: string; image: string; tag: string }[];
}
