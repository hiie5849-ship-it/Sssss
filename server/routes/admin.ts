import { Router, Response } from 'express';
import { db, Category, Coupon } from '../db.js';
import { requireAdmin, AuthenticatedRequest, logAudit } from '../auth.js';

export const adminRouter = Router();

// GET /api/admin/metrics - High level executive overview
adminRouter.get('/metrics', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const totalOrders = db.orders.length;
  const nonCancelledOrders = db.orders.filter(o => o.orderStatus !== 'cancelled');

  const gmv = nonCancelledOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalSubOrders = db.subOrders.filter(s => s.status !== 'cancelled');
  const marketplaceCommissions = totalSubOrders.reduce((sum, s) => sum + s.commissionAmount, 0);
  const sellerPayoutsSettled = totalSubOrders.reduce((sum, s) => sum + s.sellerEarnings, 0);

  const totalCustomers = db.users.filter(u => u.role === 'customer').length;
  const totalSellers = db.sellerProfiles.length;
  const pendingSellers = db.sellerProfiles.filter(s => s.approvalStatus === 'pending').length;
  const totalProducts = db.products.length;
  const lowStockProducts = db.products.filter(p => p.stock <= 5).length;
  const pendingPayoutsCount = db.sellerPayouts.filter(p => p.status === 'pending').length;

  res.json({
    metrics: {
      gmv,
      marketplaceCommissions,
      sellerPayoutsSettled,
      totalOrders,
      totalCustomers,
      totalSellers,
      pendingSellers,
      totalProducts,
      lowStockProducts,
      pendingPayoutsCount,
    },
    recentOrders: db.orders.slice(0, 10),
    recentAuditLogs: db.auditLogs.slice(0, 10),
  });
});

// GET /api/admin/sellers - List all sellers with filters
adminRouter.get('/sellers', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const sellers = db.sellerProfiles.map(s => {
    const user = db.users.find(u => u.id === s.userId);
    const sellerProducts = db.products.filter(p => p.sellerId === s.userId);
    const sellerOrders = db.subOrders.filter(sub => sub.sellerId === s.userId);
    return {
      ...s,
      email: user?.email || '',
      phone: user?.phone || '',
      userStatus: user?.status || 'active',
      productCount: sellerProducts.length,
      orderCount: sellerOrders.length,
    };
  });

  res.json({ sellers });
});

// PUT /api/admin/sellers/:id/approval - Approve / Reject / Suspend Seller
adminRouter.put('/sellers/:id/approval', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status, commissionRate } = req.body;

  const seller = db.sellerProfiles.find(s => s.userId === id);
  if (!seller) {
    return res.status(404).json({ error: 'Seller profile not found.' });
  }

  if (status && ['pending', 'approved', 'rejected', 'suspended'].includes(status)) {
    seller.approvalStatus = status;

    // Update corresponding user status
    const user = db.users.find(u => u.id === seller.userId);
    if (user) {
      user.status = status === 'suspended' ? 'suspended' : 'active';
    }

    // Send notification to seller
    db.notifications.push({
      id: `notif_${Date.now()}`,
      userId: seller.userId,
      title: `Seller Account Status: ${status.toUpperCase()}`,
      message: status === 'approved'
        ? 'Congratulations! Your seller store has been approved by Super Admin. You can now add products and accept orders.'
        : `Your seller account status was updated to ${status}.`,
      type: 'seller',
      read: false,
      link: '/seller/dashboard',
      createdAt: new Date().toISOString(),
    });
  }

  if (commissionRate !== undefined) {
    const rate = Number(commissionRate);
    if (!isNaN(rate) && rate >= 0 && rate <= 100) {
      seller.commissionRate = rate;
    }
  }

  seller.updatedAt = new Date().toISOString();
  db.save();

  logAudit(
    { id: req.user!.userId, email: req.user!.email, role: req.user!.role },
    'SELLER_APPROVAL_STATUS_CHANGED',
    'sellerProfile',
    seller.userId,
    { status, commissionRate: seller.commissionRate }
  );

  res.json({ message: 'Seller status updated successfully', seller });
});

// GET /api/admin/orders - All marketplace orders
adminRouter.get('/orders', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const orders = db.orders.map(o => {
    const subOrders = db.subOrders.filter(s => s.parentOrderId === o.id);
    return {
      ...o,
      subOrders,
    };
  });
  res.json({ orders });
});

// PUT /api/admin/orders/:id/status - Admin status override
adminRouter.put('/orders/:id/status', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { orderStatus, paymentStatus, refundAmount } = req.body;

  const order = db.orders.find(o => o.id === id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found.' });
  }

  if (orderStatus) {
    order.orderStatus = orderStatus;
  }
  if (paymentStatus) {
    order.paymentStatus = paymentStatus;
  }
  order.updatedAt = new Date().toISOString();

  // If refunding, record payment refund
  if (paymentStatus === 'refunded' || refundAmount) {
    db.payments.push({
      id: `ref_${Date.now()}`,
      orderId: order.id,
      amount: refundAmount ? Number(refundAmount) : order.totalAmount,
      currency: 'INR',
      method: order.paymentMethod,
      status: 'refunded',
      createdAt: new Date().toISOString(),
    });
  }

  db.save();

  logAudit(
    { id: req.user!.userId, email: req.user!.email, role: req.user!.role },
    'ADMIN_ORDER_OVERRIDE',
    'order',
    order.id,
    { orderStatus, paymentStatus }
  );

  res.json({ message: 'Order updated by administrator', order });
});

// GET /api/admin/payouts - View all seller payout requests
adminRouter.get('/payouts', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const payouts = db.sellerPayouts
    .sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
  res.json({ payouts });
});

// PUT /api/admin/payouts/:id/status - Approve / Transfer / Reject Payout
adminRouter.put('/payouts/:id/status', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status, referenceNumber, note } = req.body;

  const payout = db.sellerPayouts.find(p => p.id === id);
  if (!payout) {
    return res.status(404).json({ error: 'Payout request not found.' });
  }

  if (!['approved', 'transferred', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Status must be approved, transferred, or rejected.' });
  }

  payout.status = status;
  if (referenceNumber) payout.referenceNumber = referenceNumber.trim();
  if (note) payout.note = note.trim();
  payout.processedAt = new Date().toISOString();

  // Notify seller
  db.notifications.push({
    id: `notif_${Date.now()}`,
    userId: payout.sellerId,
    title: `Payout Request ${status.toUpperCase()}`,
    message: status === 'transferred'
      ? `Your payout of ₹${payout.amount.toLocaleString()} has been transferred (Ref: ${payout.referenceNumber || 'NEFT-PROCESSED'}).`
      : `Your payout of ₹${payout.amount.toLocaleString()} status is now ${status}.`,
    type: 'seller',
    read: false,
    link: '/seller/payouts',
    createdAt: new Date().toISOString(),
  });

  db.save();

  logAudit(
    { id: req.user!.userId, email: req.user!.email, role: req.user!.role },
    'SELLER_PAYOUT_STATUS_CHANGED',
    'payout',
    payout.id,
    { status, referenceNumber }
  );

  res.json({ message: 'Payout updated successfully', payout });
});

// GET /api/admin/customers - Manage customer accounts
adminRouter.get('/customers', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const customers = db.users
    .filter(u => u.role === 'customer')
    .map(u => {
      const orders = db.orders.filter(o => o.customerId === u.id);
      const spent = orders.filter(o => o.orderStatus !== 'cancelled').reduce((sum, o) => sum + o.totalAmount, 0);
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        status: u.status,
        createdAt: u.createdAt,
        totalOrders: orders.length,
        totalSpent: spent,
      };
    });

  res.json({ customers });
});

// PUT /api/admin/customers/:id/status - Suspend / Reactivate customer
adminRouter.put('/customers/:id/status', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  const user = db.users.find(u => u.id === id && u.role === 'customer');
  if (!user) {
    return res.status(404).json({ error: 'Customer not found.' });
  }

  if (['active', 'suspended'].includes(status)) {
    user.status = status;
    db.save();

    logAudit(
      { id: req.user!.userId, email: req.user!.email, role: req.user!.role },
      'CUSTOMER_STATUS_TOGGLED',
      'user',
      user.id,
      { status }
    );
  }

  res.json({ message: 'Customer status updated', user: { id: user.id, status: user.status } });
});

// CATEGORIES MANAGEMENT
// POST /api/admin/categories - Add category
adminRouter.post('/categories', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { name, icon, description, image } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Category name is required.' });
  }

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  const newCat: Category = {
    id: `cat_${Date.now()}`,
    name: name.trim(),
    slug,
    icon: icon || 'Tag',
    description: description || '',
    image: image || 'https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=500&q=80',
    displayOrder: db.categories.length + 1,
    isActive: true,
  };

  db.categories.push(newCat);
  db.save();

  logAudit(
    { id: req.user!.userId, email: req.user!.email, role: req.user!.role },
    'CATEGORY_CREATED',
    'category',
    newCat.id,
    { name: newCat.name }
  );

  res.status(201).json({ message: 'Category created', category: newCat });
});

// PUT /api/admin/categories/:id - Edit category
adminRouter.put('/categories/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { name, icon, description, image, isActive, displayOrder } = req.body;

  const cat = db.categories.find(c => c.id === id);
  if (!cat) {
    return res.status(404).json({ error: 'Category not found.' });
  }

  if (name) {
    cat.name = name.trim();
    cat.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  }
  if (icon) cat.icon = icon;
  if (description !== undefined) cat.description = description;
  if (image) cat.image = image;
  if (isActive !== undefined) cat.isActive = Boolean(isActive);
  if (displayOrder !== undefined) cat.displayOrder = Number(displayOrder);

  db.save();
  res.json({ message: 'Category updated', category: cat });
});

// COUPONS MANAGEMENT
// GET /api/admin/coupons
adminRouter.get('/coupons', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  res.json({ coupons: db.coupons });
});

// POST /api/admin/coupons
adminRouter.post('/coupons', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { code, discountType, discountValue, minOrderAmount, maxDiscount, validUntil, usageLimit } = req.body;

  if (!code || !discountType || discountValue === undefined) {
    return res.status(400).json({ error: 'Code, discountType, and discountValue are required.' });
  }

  const newCoupon: Coupon = {
    id: `cpn_${Date.now()}`,
    code: code.trim().toUpperCase(),
    discountType: discountType === 'flat' ? 'flat' : 'percentage',
    discountValue: Number(discountValue),
    minOrderAmount: Number(minOrderAmount) || 0,
    maxDiscount: maxDiscount ? Number(maxDiscount) : undefined,
    validUntil: validUntil || '2028-12-31T23:59:59.000Z',
    timesUsed: 0,
    usageLimit: Number(usageLimit) || 1000,
    isActive: true,
  };

  db.coupons.push(newCoupon);
  db.save();

  logAudit(
    { id: req.user!.userId, email: req.user!.email, role: req.user!.role },
    'COUPON_CREATED',
    'coupon',
    newCoupon.id,
    { code: newCoupon.code }
  );

  res.status(201).json({ message: 'Coupon created successfully', coupon: newCoupon });
});

// PUT /api/admin/coupons/:id
adminRouter.put('/coupons/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const coupon = db.coupons.find(c => c.id === id);
  if (!coupon) {
    return res.status(404).json({ error: 'Coupon not found.' });
  }

  const { isActive, discountValue, minOrderAmount, usageLimit } = req.body;
  if (isActive !== undefined) coupon.isActive = Boolean(isActive);
  if (discountValue !== undefined) coupon.discountValue = Number(discountValue);
  if (minOrderAmount !== undefined) coupon.minOrderAmount = Number(minOrderAmount);
  if (usageLimit !== undefined) coupon.usageLimit = Number(usageLimit);

  db.save();
  res.json({ message: 'Coupon updated', coupon });
});

// APP SETTINGS
// GET /api/admin/settings
adminRouter.get('/settings', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  res.json({ settings: db.appSettings });
});

// PUT /api/admin/settings
adminRouter.put('/settings', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const {
    marketplaceName,
    defaultCommissionRate,
    freeShippingThreshold,
    flatShippingFee,
    allowCod,
    supportEmail,
    supportPhone,
    returnWindowDays,
    banners,
  } = req.body;

  const s = db.appSettings;
  if (marketplaceName) s.marketplaceName = marketplaceName.trim();
  if (defaultCommissionRate !== undefined) s.defaultCommissionRate = Number(defaultCommissionRate);
  if (freeShippingThreshold !== undefined) s.freeShippingThreshold = Number(freeShippingThreshold);
  if (flatShippingFee !== undefined) s.flatShippingFee = Number(flatShippingFee);
  if (allowCod !== undefined) s.allowCod = Boolean(allowCod);
  if (supportEmail) s.supportEmail = supportEmail.trim();
  if (supportPhone) s.supportPhone = supportPhone.trim();
  if (returnWindowDays !== undefined) s.returnWindowDays = Number(returnWindowDays);
  if (Array.isArray(banners)) s.banners = banners;

  db.save();

  logAudit(
    { id: req.user!.userId, email: req.user!.email, role: req.user!.role },
    'SETTINGS_UPDATED',
    'settings',
    'appSettings'
  );

  res.json({ message: 'Marketplace settings saved successfully', settings: db.appSettings });
});

// AUDIT LOGS
// GET /api/admin/audit-logs
adminRouter.get('/audit-logs', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  res.json({ auditLogs: db.auditLogs.slice(0, 200) });
});
