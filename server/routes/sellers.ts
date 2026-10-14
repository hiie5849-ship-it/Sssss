import { Router, Response } from 'express';
import { db, SellerPayout } from '../db.js';
import { requireSeller, AuthenticatedRequest, logAudit } from '../auth.js';

export const sellersRouter = Router();

// Public: Get seller public store info and catalog
sellersRouter.get('/store/:slugOrId', (req, res) => {
  const { slugOrId } = req.params;
  const seller = db.sellerProfiles.find(s => s.userId === slugOrId || s.storeSlug === slugOrId);
  if (!seller) {
    return res.status(404).json({ error: 'Store not found.' });
  }

  const products = db.products.filter(p => p.sellerId === seller.userId && p.status === 'active');
  res.json({
    store: {
      userId: seller.userId,
      storeName: seller.storeName,
      storeSlug: seller.storeSlug,
      storeDescription: seller.storeDescription,
      storeLogo: seller.storeLogo,
      storeBanner: seller.storeBanner,
      rating: seller.rating,
      numRatings: seller.numRatings,
      createdAt: seller.createdAt,
    },
    products,
  });
});

// Seller Private: Dashboard Metrics
sellersRouter.get('/dashboard', requireSeller, (req: AuthenticatedRequest, res: Response) => {
  const sellerId = req.user!.userId;
  const seller = db.sellerProfiles.find(s => s.userId === sellerId);
  if (!seller && req.user!.role !== 'admin') {
    return res.status(404).json({ error: 'Seller profile not found.' });
  }

  const myProducts = db.products.filter(p => p.sellerId === sellerId);
  const mySubOrders = db.subOrders.filter(s => s.sellerId === sellerId);

  const totalRevenue = mySubOrders
    .filter(s => s.status !== 'cancelled')
    .reduce((sum, s) => sum + s.subtotal, 0);

  const totalEarnings = mySubOrders
    .filter(s => s.status !== 'cancelled')
    .reduce((sum, s) => sum + s.sellerEarnings, 0);

  const totalCommissions = mySubOrders
    .filter(s => s.status !== 'cancelled')
    .reduce((sum, s) => sum + s.commissionAmount, 0);

  const pendingShipments = mySubOrders.filter(s => ['placed', 'confirmed', 'processing'].includes(s.status)).length;
  const completedOrders = mySubOrders.filter(s => s.status === 'delivered').length;
  const lowStockCount = myProducts.filter(p => p.stock > 0 && p.stock <= 5).length;
  const outOfStockCount = myProducts.filter(p => p.stock === 0).length;

  res.json({
    sellerProfile: seller,
    stats: {
      totalProducts: myProducts.length,
      activeProducts: myProducts.filter(p => p.status === 'active').length,
      totalOrders: mySubOrders.length,
      pendingShipments,
      completedOrders,
      lowStockCount,
      outOfStockCount,
      totalRevenue,
      totalEarnings,
      totalCommissions,
      commissionRate: seller ? seller.commissionRate : 10,
    },
    recentSubOrders: mySubOrders.slice(0, 10),
  });
});

// Seller Private: My Products List
sellersRouter.get('/products', requireSeller, (req: AuthenticatedRequest, res: Response) => {
  const sellerId = req.user!.userId;
  const products = db.products.filter(p => p.sellerId === sellerId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json({ products });
});

// Seller Private: My Assigned Sub-Orders only (Security: Strict seller isolation)
sellersRouter.get('/sub-orders', requireSeller, (req: AuthenticatedRequest, res: Response) => {
  const sellerId = req.user!.userId;
  const subOrders = db.subOrders
    .filter(s => s.sellerId === sellerId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Attach shipping address information from parent order for fulfillment
  const enriched = subOrders.map(sub => {
    const parent = db.orders.find(o => o.id === sub.parentOrderId);
    return {
      ...sub,
      orderNumber: parent ? parent.orderNumber : 'N/A',
      customerName: parent ? parent.customerName : 'Customer',
      customerPhone: parent ? parent.customerPhone : '',
      shippingAddress: parent ? parent.shippingAddress : null,
      paymentMethod: parent ? parent.paymentMethod : 'N/A',
      paymentStatus: parent ? parent.paymentStatus : 'pending',
    };
  });

  res.json({ subOrders: enriched });
});

// Seller Private: Update Sub-Order Shipping / Status
sellersRouter.put('/sub-orders/:id/status', requireSeller, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status, carrier, trackingNumber, cancellationReason } = req.body;
  const sellerId = req.user!.userId;

  const subOrder = db.subOrders.find(s => s.id === id);
  if (!subOrder) {
    return res.status(404).json({ error: 'Order not found.' });
  }

  // Security Check: Must be assigned seller or Admin
  if (subOrder.sellerId !== sellerId && req.user!.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized: This order item is not assigned to your store.' });
  }

  const validTransitions: Record<string, string[]> = {
    placed: ['confirmed', 'cancelled'],
    confirmed: ['processing', 'cancelled'],
    processing: ['shipped', 'cancelled'],
    shipped: ['delivered', 'returned'],
    delivered: ['returned'],
    cancelled: [],
    returned: [],
  };

  const allowed = validTransitions[subOrder.status] || [];
  if (req.user!.role !== 'admin' && !allowed.includes(status)) {
    return res.status(400).json({
      error: `Invalid status transition from "${subOrder.status}" to "${status}". Allowed: ${allowed.join(', ') || 'None (Terminal state)'}`
    });
  }

  if (status === 'shipped' && (!trackingNumber || !carrier)) {
    return res.status(400).json({ error: 'Carrier name and tracking number are required when marking as shipped.' });
  }

  subOrder.status = status;
  if (carrier) subOrder.carrier = carrier.trim();
  if (trackingNumber) subOrder.trackingNumber = trackingNumber.trim();
  if (cancellationReason) subOrder.cancellationReason = cancellationReason.trim();
  subOrder.updatedAt = new Date().toISOString();

  // If status is cancelled, restock seller's product items
  if (status === 'cancelled') {
    for (const item of subOrder.items) {
      const prod = db.products.find(p => p.id === item.productId);
      if (prod) {
        prod.stock += item.quantity;
      }
    }
  }

  // Also check if parent order status should be updated
  const parentOrder = db.orders.find(o => o.id === subOrder.parentOrderId);
  if (parentOrder) {
    const allSiblings = db.subOrders.filter(s => s.parentOrderId === parentOrder.id);
    const allDelivered = allSiblings.every(s => s.status === 'delivered');
    const allCancelled = allSiblings.every(s => s.status === 'cancelled');
    const anyShipped = allSiblings.some(s => s.status === 'shipped' || s.status === 'delivered');

    if (allDelivered) {
      parentOrder.orderStatus = 'delivered';
    } else if (allCancelled) {
      parentOrder.orderStatus = 'cancelled';
    } else if (anyShipped) {
      parentOrder.orderStatus = 'shipped';
    } else {
      parentOrder.orderStatus = 'processing';
    }
    parentOrder.updatedAt = new Date().toISOString();

    // Notify customer
    db.notifications.push({
      id: `notif_${Date.now()}`,
      userId: parentOrder.customerId,
      title: `Order Update #${parentOrder.orderNumber}`,
      message: `Item(s) from "${subOrder.storeName}" are now marked as ${status.toUpperCase()}${trackingNumber ? ` (Tracking: ${trackingNumber} via ${carrier})` : ''}.`,
      type: 'order',
      read: false,
      link: `/orders/${parentOrder.id}`,
      createdAt: new Date().toISOString(),
    });
  }

  db.save();

  logAudit(
    { id: req.user!.userId, email: req.user!.email, role: req.user!.role },
    'SUB_ORDER_STATUS_UPDATED',
    'subOrder',
    subOrder.id,
    { newStatus: status, trackingNumber, carrier }
  );

  res.json({ message: 'Order status updated successfully', subOrder });
});

// Seller Private: Request Payout
sellersRouter.post('/payout-request', requireSeller, (req: AuthenticatedRequest, res: Response) => {
  const sellerId = req.user!.userId;
  const { amount, note } = req.body;
  const seller = db.sellerProfiles.find(s => s.userId === sellerId);
  if (!seller) {
    return res.status(404).json({ error: 'Seller profile not found.' });
  }

  const numAmount = Number(amount);
  if (isNaN(numAmount) || numAmount <= 100) {
    return res.status(400).json({ error: 'Minimum payout withdrawal request is ₹100.' });
  }

  const mySubOrders = db.subOrders.filter(s => s.sellerId === sellerId && s.status === 'delivered');
  const earnedTotal = mySubOrders.reduce((sum, s) => sum + s.sellerEarnings, 0);

  const existingPayouts = db.sellerPayouts
    .filter(p => p.sellerId === sellerId && ['pending', 'approved', 'transferred'].includes(p.status))
    .reduce((sum, p) => sum + p.amount, 0);

  const availableBalance = Math.max(0, earnedTotal - existingPayouts);

  if (numAmount > availableBalance) {
    return res.status(400).json({
      error: `Requested amount (₹${numAmount.toLocaleString()}) exceeds your available settled balance of ₹${availableBalance.toLocaleString()}.`
    });
  }

  const payout: SellerPayout = {
    id: `pay_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    sellerId,
    storeName: seller.storeName,
    amount: numAmount,
    status: 'pending',
    requestedAt: new Date().toISOString(),
    note: note || 'Standard seller withdrawal request',
  };

  db.sellerPayouts.push(payout);

  // Notify admin
  db.notifications.push({
    id: `notif_${Date.now()}`,
    userId: 'usr_admin_1',
    title: 'New Seller Payout Request',
    message: `${seller.storeName} requested a payout transfer of ₹${numAmount.toLocaleString()}.`,
    type: 'seller',
    read: false,
    link: '/admin/payouts',
    createdAt: new Date().toISOString(),
  });

  db.save();

  logAudit(
    { id: req.user!.userId, email: req.user!.email, role: req.user!.role },
    'SELLER_PAYOUT_REQUESTED',
    'payout',
    payout.id,
    { amount: numAmount }
  );

  res.status(201).json({ message: 'Payout request submitted to Super Admin for verification', payout, availableBalance });
});

// Seller Private: View My Payouts History
sellersRouter.get('/payouts', requireSeller, (req: AuthenticatedRequest, res: Response) => {
  const sellerId = req.user!.userId;
  const payouts = db.sellerPayouts
    .filter(p => p.sellerId === sellerId)
    .sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());

  const myDelivered = db.subOrders.filter(s => s.sellerId === sellerId && s.status === 'delivered');
  const earnedTotal = myDelivered.reduce((sum, s) => sum + s.sellerEarnings, 0);
  const withdrawnTotal = payouts
    .filter(p => ['approved', 'transferred'].includes(p.status))
    .reduce((sum, p) => sum + p.amount, 0);
  const pendingTotal = payouts
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + p.amount, 0);

  res.json({
    payouts,
    financialSummary: {
      totalEarnedSettled: earnedTotal,
      totalWithdrawn: withdrawnTotal,
      pendingRequests: pendingTotal,
      availableBalance: Math.max(0, earnedTotal - withdrawnTotal - pendingTotal),
    }
  });
});

// Seller Private: Update Store Profile
sellersRouter.put('/profile', requireSeller, (req: AuthenticatedRequest, res: Response) => {
  const sellerId = req.user!.userId;
  const seller = db.sellerProfiles.find(s => s.userId === sellerId);
  if (!seller) {
    return res.status(404).json({ error: 'Seller profile not found.' });
  }

  const {
    storeName,
    storeDescription,
    storeLogo,
    storeBanner,
    businessAddress,
    gstin,
    pan,
    bankAccount,
    ifsc
  } = req.body;

  if (storeName) {
    seller.storeName = storeName.trim();
    seller.storeSlug = storeName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  }
  if (storeDescription) seller.storeDescription = storeDescription.trim();
  if (storeLogo) seller.storeLogo = storeLogo.trim();
  if (storeBanner) seller.storeBanner = storeBanner.trim();
  if (businessAddress) seller.businessAddress = businessAddress.trim();
  if (gstin) seller.gstin = gstin.trim();
  if (pan) seller.pan = pan.trim();
  if (bankAccount) seller.bankAccount = bankAccount.trim();
  if (ifsc) seller.ifsc = ifsc.trim();
  seller.updatedAt = new Date().toISOString();

  db.save();

  logAudit(
    { id: req.user!.userId, email: req.user!.email, role: req.user!.role },
    'SELLER_PROFILE_UPDATED',
    'sellerProfile',
    seller.userId
  );

  res.json({ message: 'Store profile updated successfully', sellerProfile: seller });
});
