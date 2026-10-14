import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  role: 'customer' | 'seller' | 'admin';
  name: string;
  phone?: string;
  status: 'active' | 'suspended';
  createdAt: string;
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
  commissionRate: number; // e.g. 10 means 10%
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
  quantity: number;
  selectedAttributes?: Record<string, string>;
}

export interface Cart {
  userId: string;
  items: CartItem[];
  updatedAt: string;
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

export interface PaymentRecord {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  method: string;
  status: 'initiated' | 'authorized' | 'captured' | 'failed' | 'refunded';
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  idempotencyKey?: string;
  createdAt: string;
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

export interface DatabaseSchema {
  users: User[];
  sellerProfiles: SellerProfile[];
  categories: Category[];
  products: Product[];
  addresses: Address[];
  carts: Cart[];
  wishlists: { userId: string; productIds: string[] }[];
  orders: Order[];
  subOrders: SubOrder[];
  payments: PaymentRecord[];
  sellerPayouts: SellerPayout[];
  coupons: Coupon[];
  reviews: Review[];
  notifications: Notification[];
  auditLogs: AuditLog[];
  appSettings: AppSettings;
}

const DATA_DIR = path.resolve(process.cwd(), '.data');
const DB_FILE = path.join(DATA_DIR, 'zappkart_database.json');

class DatabaseEngine {
  private data: DatabaseSchema;
  private isSaving: boolean = false;
  private pendingSave: boolean = false;

  constructor() {
    this.ensureDirectory();
    this.data = this.loadDatabase();
  }

  private ensureDirectory() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private loadDatabase(): DatabaseSchema {
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw);
      } catch (err) {
        console.error('Failed to parse database file, re-initializing...', err);
      }
    }
    const initial = this.getInitialSeedData();
    this.saveFileSync(initial);
    return initial;
  }

  public save() {
    if (this.isSaving) {
      this.pendingSave = true;
      return;
    }
    this.isSaving = true;
    const jsonString = JSON.stringify(this.data, null, 2);
    const tmpFile = `${DB_FILE}.tmp`;
    fs.promises.writeFile(tmpFile, jsonString, 'utf-8')
      .then(() => fs.promises.rename(tmpFile, DB_FILE))
      .catch((err) => console.error('Error saving database:', err))
      .finally(() => {
        this.isSaving = false;
        if (this.pendingSave) {
          this.pendingSave = false;
          this.save();
        }
      });
  }

  private saveFileSync(data: DatabaseSchema) {
    this.ensureDirectory();
    const jsonString = JSON.stringify(data, null, 2);
    const tmpFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tmpFile, jsonString, 'utf-8');
    fs.renameSync(tmpFile, DB_FILE);
  }

  // Schema Accessors
  public get users() { return this.data.users; }
  public get sellerProfiles() { return this.data.sellerProfiles; }
  public get categories() { return this.data.categories; }
  public get products() { return this.data.products; }
  public get addresses() { return this.data.addresses; }
  public get carts() { return this.data.carts; }
  public get wishlists() { return this.data.wishlists; }
  public get orders() { return this.data.orders; }
  public get subOrders() { return this.data.subOrders; }
  public get payments() { return this.data.payments; }
  public get sellerPayouts() { return this.data.sellerPayouts; }
  public get coupons() { return this.data.coupons; }
  public get reviews() { return this.data.reviews; }
  public get notifications() { return this.data.notifications; }
  public get auditLogs() { return this.data.auditLogs; }
  public get appSettings() { return this.data.appSettings; }

  // Initial Seed Data with Verified Super Admin, Sample Sellers, Categories, and Products
  private getInitialSeedData(): DatabaseSchema {
    const defaultPasswordHash = bcrypt.hashSync('AdminSecurePassword123!', 10);
    const sellerPasswordHash = bcrypt.hashSync('SellerPass123!', 10);
    const customerPasswordHash = bcrypt.hashSync('CustomerPass123!', 10);

    const now = new Date().toISOString();

    const users: User[] = [
      {
        id: 'usr_admin_1',
        email: 'admin@zappkart.com',
        passwordHash: defaultPasswordHash,
        role: 'admin',
        name: 'Super Administrator',
        phone: '+91 98765 00000',
        status: 'active',
        createdAt: now,
      },
      {
        id: 'usr_seller_tech',
        email: 'nexus@techhub.in',
        passwordHash: sellerPasswordHash,
        role: 'seller',
        name: 'Nexus Electronics Store',
        phone: '+91 98765 11111',
        status: 'active',
        createdAt: now,
      },
      {
        id: 'usr_seller_fashion',
        email: 'care@urbanthreads.com',
        passwordHash: sellerPasswordHash,
        role: 'seller',
        name: 'Urban Threads Apparel',
        phone: '+91 98765 22222',
        status: 'active',
        createdAt: now,
      },
      {
        id: 'usr_seller_pending',
        email: 'organic@greenroots.in',
        passwordHash: sellerPasswordHash,
        role: 'seller',
        name: 'Green Roots Botanicals',
        phone: '+91 98765 33333',
        status: 'active',
        createdAt: now,
      },
      {
        id: 'usr_customer_1',
        email: 'customer@example.com',
        passwordHash: customerPasswordHash,
        role: 'customer',
        name: 'Rahul Sharma',
        phone: '+91 98765 44444',
        status: 'active',
        createdAt: now,
      }
    ];

    const sellerProfiles: SellerProfile[] = [
      {
        userId: 'usr_seller_tech',
        storeName: 'Nexus Gadgets & Electronics',
        storeSlug: 'nexus-electronics',
        storeDescription: 'Authorized premium distributor of cutting-edge smartphones, audio gear, and ultra-high-speed compute accessories.',
        storeLogo: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=200&q=80',
        storeBanner: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
        businessAddress: 'Plot 42, Electronic City Phase 1, Bengaluru, KA 560100',
        gstin: '29ABCDE1234F1Z5',
        pan: 'ABCDE1234F',
        bankAccount: '918273645012',
        ifsc: 'HDFC0001234',
        approvalStatus: 'approved',
        commissionRate: 8,
        totalSales: 142000,
        totalEarnings: 130640,
        rating: 4.8,
        numRatings: 64,
        createdAt: now,
        updatedAt: now,
      },
      {
        userId: 'usr_seller_fashion',
        storeName: 'Urban Threads Studio',
        storeSlug: 'urban-threads',
        storeDescription: 'Contemporary Indian streetwear, pure linen shirts, designer casuals, and sustainable everyday fashion essentials.',
        storeLogo: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=200&q=80',
        storeBanner: 'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1200&q=80',
        businessAddress: '104 Fashion Street, Bandra West, Mumbai, MH 400050',
        gstin: '27FGHIJ5678K1Z2',
        pan: 'FGHIJ5678K',
        bankAccount: '112233445566',
        ifsc: 'ICIC0005678',
        approvalStatus: 'approved',
        commissionRate: 12,
        totalSales: 89000,
        totalEarnings: 78320,
        rating: 4.7,
        numRatings: 42,
        createdAt: now,
        updatedAt: now,
      },
      {
        userId: 'usr_seller_pending',
        storeName: 'Green Roots Organics',
        storeSlug: 'green-roots-organics',
        storeDescription: 'Certified organic cold-pressed oils, ayurvedic teas, and natural wellness skincare.',
        storeLogo: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=200&q=80',
        businessAddress: 'Sector 18, Noida, UP 201301',
        gstin: '09KLMNO9012P1Z8',
        approvalStatus: 'pending', // Pending Super Admin approval!
        commissionRate: 10,
        totalSales: 0,
        totalEarnings: 0,
        rating: 5.0,
        numRatings: 0,
        createdAt: now,
        updatedAt: now,
      }
    ];

    const categories: Category[] = [
      {
        id: 'cat_electronics',
        name: 'Electronics',
        slug: 'electronics',
        icon: 'Smartphone',
        description: 'Smartphones, Audio, Laptops, Wearables & Smart Home',
        image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=500&q=80',
        displayOrder: 1,
        isActive: true,
      },
      {
        id: 'cat_fashion',
        name: 'Fashion',
        slug: 'fashion',
        icon: 'Shirt',
        description: 'Men, Women, Footwear, Accessories & Ethnic Wear',
        image: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=500&q=80',
        displayOrder: 2,
        isActive: true,
      },
      {
        id: 'cat_home',
        name: 'Home & Kitchen',
        slug: 'home-kitchen',
        icon: 'Home',
        description: 'Cookware, Home Decor, Furniture & Appliances',
        image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=500&q=80',
        displayOrder: 3,
        isActive: true,
      },
      {
        id: 'cat_beauty',
        name: 'Beauty & Personal Care',
        slug: 'beauty',
        icon: 'Sparkles',
        description: 'Skincare, Haircare, Fragrances & Grooming',
        image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=500&q=80',
        displayOrder: 4,
        isActive: true,
      },
      {
        id: 'cat_sports',
        name: 'Sports & Fitness',
        slug: 'sports',
        icon: 'Activity',
        description: 'Gym Equipment, Athleisure, Outdoor & Nutrition',
        image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=500&q=80',
        displayOrder: 5,
        isActive: true,
      }
    ];

    const products: Product[] = [
      {
        id: 'prod_1',
        sellerId: 'usr_seller_tech',
        storeName: 'Nexus Gadgets & Electronics',
        title: 'Sony WH-1000XM5 Wireless Noise Cancelling Headphones',
        slug: 'sony-wh-1000xm5-wireless-noise-cancelling-headphones',
        description: 'Industry-leading noise cancellation optimized with two processors and 8 microphones. Ultra-comfortable lightweight design with soft fit leather. Up to 30-hour battery life with quick charging (3 min charge for 3 hours of playback). Crystal clear hands-free calling with 4 beamforming microphones.',
        categoryId: 'cat_electronics',
        categoryName: 'Electronics',
        price: 29990,
        salePrice: 24990,
        sku: 'SNY-XM5-BLK',
        stock: 35,
        images: [
          'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=800&q=80'
        ],
        status: 'active',
        rating: 4.8,
        numReviews: 128,
        isFeatured: true,
        attributes: { Color: 'Midnight Black', Connectivity: 'Bluetooth 5.2' },
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'prod_2',
        sellerId: 'usr_seller_tech',
        storeName: 'Nexus Gadgets & Electronics',
        title: 'Apple Watch Series 9 GPS 45mm Midnight Aluminum',
        slug: 'apple-watch-series-9-gps-45mm',
        description: 'S9 SiP enables a supersunny display and a magical new way to interact with your watch without touching the screen. Advanced health, safety, and activity features provide powerful insights and help when you need it.',
        categoryId: 'cat_electronics',
        categoryName: 'Electronics',
        price: 44900,
        salePrice: 41900,
        sku: 'APL-W9-45M',
        stock: 18,
        images: [
          'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=800&q=80'
        ],
        status: 'active',
        rating: 4.9,
        numReviews: 89,
        isFeatured: true,
        attributes: { Size: '45mm', Case: 'Midnight Aluminum' },
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'prod_3',
        sellerId: 'usr_seller_fashion',
        storeName: 'Urban Threads Studio',
        title: 'Handcrafted Pure Organic Linen Resort Shirt',
        slug: 'pure-organic-linen-resort-shirt',
        description: 'Woven from 100% sustainably cultivated French flax linen. Relaxed camp collar silhouette tailored for maximum breathability in warm climates. Pre-washed for heirloom softness from day one.',
        categoryId: 'cat_fashion',
        categoryName: 'Fashion',
        price: 3499,
        salePrice: 2199,
        sku: 'UBT-LNN-WHT',
        stock: 50,
        images: [
          'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80'
        ],
        status: 'active',
        rating: 4.6,
        numReviews: 45,
        isFeatured: true,
        attributes: { Size: 'L', Material: '100% Linen' },
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'prod_4',
        sellerId: 'usr_seller_fashion',
        storeName: 'Urban Threads Studio',
        title: 'Minimalist Raw Indigo Selvedge Denim Jacket',
        slug: 'minimalist-raw-selvedge-denim-jacket',
        description: 'Crafted with 14.5oz Japanese shuttle-loom selvedge denim. Features antique brass hardware, custom chain-stitched seams, and interior stash pockets.',
        categoryId: 'cat_fashion',
        categoryName: 'Fashion',
        price: 5999,
        salePrice: 4299,
        sku: 'UBT-SLV-JKT',
        stock: 22,
        images: [
          'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=800&q=80'
        ],
        status: 'active',
        rating: 4.7,
        numReviews: 31,
        isFeatured: false,
        attributes: { Fit: 'Regular', Fabric: '14.5oz Selvedge' },
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'prod_5',
        sellerId: 'usr_seller_tech',
        storeName: 'Nexus Gadgets & Electronics',
        title: 'Anker Prime 20,000mAh Power Bank (200W Output)',
        slug: 'anker-prime-20000mah-200w-powerbank',
        description: 'Equipped with two high-powered USB-C ports and one USB-A port totaling 200W output. Quickly charge two 14-inch laptops simultaneously at 100W each. Smart digital display delivers real-time output and remaining battery stats.',
        categoryId: 'cat_electronics',
        categoryName: 'Electronics',
        price: 11999,
        salePrice: 8999,
        sku: 'ANK-PRM-20K',
        stock: 40,
        images: [
          'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=800&q=80'
        ],
        status: 'active',
        rating: 4.9,
        numReviews: 76,
        isFeatured: true,
        attributes: { Capacity: '20,000mAh', MaxOutput: '200W' },
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'prod_6',
        sellerId: 'usr_seller_fashion',
        storeName: 'Urban Threads Studio',
        title: 'Premium Italian Leather Weekend Duffle Bag',
        slug: 'premium-italian-leather-duffle-bag',
        description: 'Full-grain vegetable tanned Tuscan leather duffle with reinforced brass studs, YKK metal zippers, and detachable padded shoulder strap. Airport carry-on compliant.',
        categoryId: 'cat_fashion',
        categoryName: 'Fashion',
        price: 9999,
        salePrice: 6999,
        sku: 'UBT-LTH-BAG',
        stock: 14,
        images: [
          'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80'
        ],
        status: 'active',
        rating: 4.9,
        numReviews: 24,
        isFeatured: true,
        attributes: { Color: 'Cognac Brown', Dimensions: '52 x 28 x 26 cm' },
        createdAt: now,
        updatedAt: now,
      }
    ];

    const addresses: Address[] = [
      {
        id: 'addr_c1_default',
        userId: 'usr_customer_1',
        fullName: 'Rahul Sharma',
        phone: '+91 98765 44444',
        street: 'Apt 4B, Silver Oak Residences, 14th Main Road',
        apartment: 'Indiranagar 1st Stage',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560038',
        country: 'India',
        isDefault: true,
        label: 'home'
      }
    ];

    const coupons: Coupon[] = [
      {
        id: 'cpn_welcome',
        code: 'WELCOME10',
        discountType: 'percentage',
        discountValue: 10,
        minOrderAmount: 999,
        maxDiscount: 500,
        validUntil: '2028-12-31T23:59:59.000Z',
        timesUsed: 14,
        usageLimit: 1000,
        isActive: true,
      },
      {
        id: 'cpn_flat500',
        code: 'ZAPP500',
        discountType: 'flat',
        discountValue: 500,
        minOrderAmount: 2999,
        validUntil: '2028-12-31T23:59:59.000Z',
        timesUsed: 8,
        usageLimit: 500,
        isActive: true,
      }
    ];

    const appSettings: AppSettings = {
      marketplaceName: 'ZappKart',
      defaultCommissionRate: 10,
      freeShippingThreshold: 999,
      flatShippingFee: 79,
      allowCod: true,
      testMode: true,
      razorpayKeyId: 'rzp_test_zappkart_gateway',
      supportEmail: 'support@zappkart.com',
      supportPhone: '+91 1800 200 4545',
      returnWindowDays: 7,
      banners: [
        {
          id: 'ban_1',
          title: 'Mega Electronics Festival',
          subtitle: 'Up to 40% Off Flagship Audio, Wearables & Smart Home',
          link: '/category/electronics',
          image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
          tag: 'Limited Time Deal'
        },
        {
          id: 'ban_2',
          title: 'Urban Streetwear & Linen Arrivals',
          subtitle: 'Fresh curated styles crafted by verified independent ateliers',
          link: '/category/fashion',
          image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1200&q=80',
          tag: 'Trending Now'
        }
      ]
    };

    return {
      users,
      sellerProfiles,
      categories,
      products,
      addresses,
      carts: [],
      wishlists: [],
      orders: [],
      subOrders: [],
      payments: [],
      sellerPayouts: [],
      coupons,
      reviews: [
        {
          id: 'rev_1',
          productId: 'prod_1',
          customerId: 'usr_customer_1',
          customerName: 'Rahul S.',
          rating: 5,
          title: 'Pure audio bliss and insane battery!',
          comment: 'The noise cancellation completely blocks out traffic and cabin noise. Highly recommend buying through Nexus store!',
          createdAt: now,
        }
      ],
      notifications: [
        {
          id: 'notif_welcome',
          userId: 'usr_customer_1',
          title: 'Welcome to ZappKart!',
          message: 'Explore thousands of verified multi-vendor products. Use coupon WELCOME10 for 10% off your first order.',
          type: 'promo',
          read: false,
          createdAt: now,
        }
      ],
      auditLogs: [
        {
          id: 'log_init',
          actorId: 'system',
          actorEmail: 'system@zappkart.com',
          actorRole: 'system',
          action: 'MARKETPLACE_INITIALIZED',
          entityType: 'marketplace',
          entityId: 'zappkart',
          details: { version: '1.0.0', initializedAt: now },
          createdAt: now,
        }
      ],
      appSettings
    };
  }
}

export const db = new DatabaseEngine();
