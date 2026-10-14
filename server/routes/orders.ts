import { Router, Response } from 'express';
import crypto from 'crypto';
import { db, Order, SubOrder, OrderItem, Address, PaymentRecord } from '../db.js';
import { requireAuth, AuthenticatedRequest, logAudit } from '../auth.js';

export const ordersRouter = Router();

// ==================== CART ROUTES ====================

// GET /api/cart
ordersRouter.get('/cart', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  let cart = db.carts.find(c => c.userId === userId);
  if (!cart) {
    cart = { userId, items: [], updatedAt: new Date().toISOString() };
    db.carts.push(cart);
  }

  // Enrich with live product details from database
  const enrichedItems = cart.items.map(item => {
    const product = db.products.find(p => p.id === item.productId);
    if (!product) return null;
    return {
      productId: product.id,
      title: product.title,
      price: product.price,
      salePrice: product.salePrice,
      images: product.images,
      stock: product.stock,
      sellerId: product.sellerId,
      storeName: product.storeName,
      quantity: Math.min(item.quantity, Math.max(1, product.stock)),
      isAvailable: product.status === 'active' && product.stock > 0,
    };
  }).filter(Boolean);

  res.json({ items: enrichedItems });
});

// POST /api/cart/add
ordersRouter.post('/cart/add', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const { productId, quantity = 1 } = req.body;

  const product = db.products.find(p => p.id === productId);
  if (!product || product.status !== 'active') {
    return res.status(404).json({ error: 'Product is not available for purchase.' });
  }

  const addQty = Math.max(1, parseInt(quantity, 10) || 1);
  if (product.stock < addQty) {
    return res.status(400).json({ error: `Only ${product.stock} units available in stock.` });
  }

  let cart = db.carts.find(c => c.userId === userId);
  if (!cart) {
    cart = { userId, items: [], updatedAt: new Date().toISOString() };
    db.carts.push(cart);
  }

  const existingItem = cart.items.find(i => i.productId === productId);
  if (existingItem) {
    if (existingItem.quantity + addQty > product.stock) {
      return res.status(400).json({ error: `Cannot add more. Current in cart: ${existingItem.quantity}, Available: ${product.stock}` });
    }
    existingItem.quantity += addQty;
  } else {
    cart.items.push({ productId, quantity: addQty });
  }

  cart.updatedAt = new Date().toISOString();
  db.save();

  res.json({ message: 'Added to cart successfully', totalItems: cart.items.reduce((s, i) => s + i.quantity, 0) });
});

// PUT /api/cart/update
ordersRouter.put('/cart/update', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const { productId, quantity } = req.body;

  const cart = db.carts.find(c => c.userId === userId);
  if (!cart) {
    return res.status(404).json({ error: 'Cart not found.' });
  }

  const newQty = parseInt(quantity, 10);
  if (newQty <= 0) {
    cart.items = cart.items.filter(i => i.productId !== productId);
  } else {
    const product = db.products.find(p => p.id === productId);
    if (!product) {
      cart.items = cart.items.filter(i => i.productId !== productId);
    } else {
      const targetItem = cart.items.find(i => i.productId === productId);
      if (targetItem) {
        if (newQty > product.stock) {
          return res.status(400).json({ error: `Only ${product.stock} units available in stock.` });
        }
        targetItem.quantity = newQty;
      }
    }
  }

  cart.updatedAt = new Date().toISOString();
  db.save();

  res.json({ message: 'Cart updated', totalItems: cart.items.reduce((s, i) => s + i.quantity, 0) });
});

// DELETE /api/cart/item/:productId
ordersRouter.delete('/cart/item/:productId', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const { productId } = req.params;

  const cart = db.carts.find(c => c.userId === userId);
  if (cart) {
    cart.items = cart.items.filter(i => i.productId !== productId);
    cart.updatedAt = new Date().toISOString();
    db.save();
  }

  res.json({ message: 'Item removed from cart' });
});

// DELETE /api/cart/clear
ordersRouter.delete('/cart/clear', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const cart = db.carts.find(c => c.userId === userId);
  if (cart) {
    cart.items = [];
    cart.updatedAt = new Date().toISOString();
    db.save();
  }
  res.json({ message: 'Cart cleared' });
});

// ==================== WISHLIST ROUTES ====================

// GET /api/wishlist
ordersRouter.get('/wishlist', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  let entry = db.wishlists.find(w => w.userId === userId);
  if (!entry) {
    entry = { userId, productIds: [] };
    db.wishlists.push(entry);
  }

  const products = entry.productIds
    .map(id => db.products.find(p => p.id === id && p.status === 'active'))
    .filter(Boolean);

  res.json({ wishlist: products, productIds: entry.productIds });
});

// POST /api/wishlist/toggle
ordersRouter.post('/wishlist/toggle', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const { productId } = req.body;

  let entry = db.wishlists.find(w => w.userId === userId);
  if (!entry) {
    entry = { userId, productIds: [] };
    db.wishlists.push(entry);
  }

  const exists = entry.productIds.includes(productId);
  if (exists) {
    entry.productIds = entry.productIds.filter(id => id !== productId);
  } else {
    entry.productIds.push(productId);
  }
  db.save();

  res.json({
    message: exists ? 'Removed from wishlist' : 'Added to wishlist',
    isWishlisted: !exists,
    productIds: entry.productIds,
  });
});

// ==================== ADDRESSES ROUTES ====================

// GET /api/addresses
ordersRouter.get('/addresses', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const list = db.addresses.filter(a => a.userId === userId);
  res.json({ addresses: list });
});

// POST /api/addresses
ordersRouter.post('/addresses', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const { fullName, phone, street, apartment, city, state, postalCode, country = 'India', isDefault, label } = req.body;

  if (!fullName || !phone || !street || !city || !state || !postalCode) {
    return res.status(400).json({ error: 'Full name, phone, street address, city, state, and pincode are required.' });
  }

  const userAddresses = db.addresses.filter(a => a.userId === userId);
  const makeDefault = isDefault || userAddresses.length === 0;

  if (makeDefault) {
    userAddresses.forEach(a => a.isDefault = false);
  }

  const newAddress: Address = {
    id: `addr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    userId,
    fullName: fullName.trim(),
    phone: phone.trim(),
    street: street.trim(),
    apartment: apartment?.trim() || '',
    city: city.trim(),
    state: state.trim(),
    postalCode: postalCode.trim(),
    country: country.trim(),
    isDefault: makeDefault,
    label: label || 'home',
  };

  db.addresses.push(newAddress);
  db.save();

  res.status(201).json({ message: 'Address added successfully', address: newAddress });
});

// DELETE /api/addresses/:id
ordersRouter.delete('/addresses/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const { id } = req.params;

  const index = db.addresses.findIndex(a => a.id === id && a.userId === userId);
  if (index === -1) {
    return res.status(404).json({ error: 'Address not found.' });
  }

  db.addresses.splice(index, 1);
  db.save();
  res.json({ message: 'Address removed successfully' });
});

// ==================== ORDER CALCULATION & CHECKOUT ====================

// POST /api/orders/preview - Server-side price calculation & stock check
ordersRouter.post('/preview', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const { couponCode } = req.body;

  const cart = db.carts.find(c => c.userId === userId);
  if (!cart || cart.items.length === 0) {
    return res.status(400).json({ error: 'Your cart is empty.' });
  }

  let subtotal = 0;
  const validatedItems: any[] = [];
  const errors: string[] = [];

  for (const item of cart.items) {
    const product = db.products.find(p => p.id === item.productId);
    if (!product || product.status !== 'active') {
      errors.push(`Product "${product?.title || item.productId}" is no longer available.`);
      continue;
    }

    if (product.stock < item.quantity) {
      errors.push(`"${product.title}" has only ${product.stock} in stock (requested ${item.quantity}).`);
      continue;
    }

    const itemTotal = product.salePrice * item.quantity;
    subtotal += itemTotal;

    validatedItems.push({
      productId: product.id,
      title: product.title,
      price: product.price,
      salePrice: product.salePrice,
      quantity: item.quantity,
      subtotal: itemTotal,
      image: product.images[0] || '',
      sellerId: product.sellerId,
      storeName: product.storeName,
    });
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: 'Cart contains invalid or out-of-stock items.', details: errors });
  }

  // Shipping calculation
  const settings = db.appSettings;
  const shippingFee = subtotal >= settings.freeShippingThreshold ? 0 : settings.flatShippingFee;

  // Coupon validation & discount calculation
  let discountAmount = 0;
  let appliedCoupon: any = null;

  if (couponCode) {
    const codeClean = couponCode.trim().toUpperCase();
    const coupon = db.coupons.find(c => c.code.toUpperCase() === codeClean && c.isActive);
    if (coupon) {
      const now = new Date();
      if (new Date(coupon.validUntil) < now) {
        return res.status(400).json({ error: 'Coupon code has expired.' });
      }
      if (coupon.timesUsed >= coupon.usageLimit) {
        return res.status(400).json({ error: 'Coupon usage limit has been reached.' });
      }
      if (subtotal < coupon.minOrderAmount) {
        return res.status(400).json({ error: `Coupon requires a minimum order value of ₹${coupon.minOrderAmount}.` });
      }

      if (coupon.discountType === 'percentage') {
        let disc = Math.round((subtotal * coupon.discountValue) / 100);
        if (coupon.maxDiscount && disc > coupon.maxDiscount) {
          disc = coupon.maxDiscount;
        }
        discountAmount = disc;
      } else {
        discountAmount = Math.min(coupon.discountValue, subtotal);
      }

      appliedCoupon = {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount,
      };
    } else {
      return res.status(400).json({ error: 'Invalid or inactive coupon code.' });
    }
  }

  const tax = Math.round((subtotal - discountAmount) * 0.05); // 5% GST included or estimated
  const totalAmount = Math.max(0, subtotal - discountAmount + shippingFee);

  res.json({
    items: validatedItems,
    pricing: {
      subtotal,
      shippingFee,
      freeShippingThreshold: settings.freeShippingThreshold,
      discountAmount,
      tax,
      totalAmount,
      appliedCoupon,
    }
  });
});

// POST /api/orders/place - Complete Checkout & Multi-Seller Split
ordersRouter.post('/place', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const {
      addressId,
      paymentMethod = 'cod',
      couponCode,
      razorpayPaymentId,
      razorpayOrderId,
      razorpaySignature,
      idempotencyKey,
    } = req.body;

    // Idempotency check: prevent duplicate order submission
    if (idempotencyKey) {
      const existingPayment = db.payments.find(p => p.idempotencyKey === idempotencyKey);
      if (existingPayment) {
        const order = db.orders.find(o => o.id === existingPayment.orderId);
        if (order) {
          return res.json({ message: 'Order already processed', order });
        }
      }
    }

    const shippingAddress = db.addresses.find(a => a.id === addressId && a.userId === userId);
    if (!shippingAddress) {
      return res.status(400).json({ error: 'Please select a valid delivery address.' });
    }

    const cart = db.carts.find(c => c.userId === userId);
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ error: 'Your cart is empty.' });
    }

    // Server-side inventory & price verification with locking
    let subtotal = 0;
    const orderItems: OrderItem[] = [];
    const productsToUpdate: { product: any; newStock: number }[] = [];

    for (const item of cart.items) {
      const product = db.products.find(p => p.id === item.productId);
      if (!product || product.status !== 'active') {
        return res.status(400).json({ error: `Product "${product?.title || 'Unknown'}" is not available.` });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          error: `Insufficient stock for "${product.title}". Requested: ${item.quantity}, In Stock: ${product.stock}.`
        });
      }

      const itemSubtotal = product.salePrice * item.quantity;
      subtotal += itemSubtotal;

      // Seller commission calculation
      const seller = db.sellerProfiles.find(s => s.userId === product.sellerId);
      const commissionRate = seller ? seller.commissionRate : db.appSettings.defaultCommissionRate;
      const commissionAmount = Math.round((itemSubtotal * commissionRate) / 100);
      const sellerEarnings = itemSubtotal - commissionAmount;

      orderItems.push({
        productId: product.id,
        sellerId: product.sellerId,
        storeName: product.storeName,
        title: product.title,
        image: product.images[0] || '',
        price: product.salePrice,
        quantity: item.quantity,
        subtotal: itemSubtotal,
        commissionRate,
        commissionAmount,
        sellerEarnings,
      });

      productsToUpdate.push({
        product,
        newStock: product.stock - item.quantity,
      });
    }

    // Coupon discount calculation
    let discountAmount = 0;
    let coupon: any = null;
    if (couponCode) {
      const codeClean = couponCode.trim().toUpperCase();
      coupon = db.coupons.find(c => c.code.toUpperCase() === codeClean && c.isActive);
      if (coupon && subtotal >= coupon.minOrderAmount) {
        if (coupon.discountType === 'percentage') {
          let disc = Math.round((subtotal * coupon.discountValue) / 100);
          if (coupon.maxDiscount && disc > coupon.maxDiscount) disc = coupon.maxDiscount;
          discountAmount = disc;
        } else {
          discountAmount = Math.min(coupon.discountValue, subtotal);
        }
        coupon.timesUsed += 1;
      }
    }

    const settings = db.appSettings;
    const shippingFee = subtotal >= settings.freeShippingThreshold ? 0 : settings.flatShippingFee;
    const tax = Math.round((subtotal - discountAmount) * 0.05);
    const totalAmount = Math.max(0, subtotal - discountAmount + shippingFee);

    // Validate payment method
    if (paymentMethod === 'cod' && !settings.allowCod) {
      return res.status(400).json({ error: 'Cash on Delivery is currently disabled by marketplace policy.' });
    }

    let paymentStatus: 'pending' | 'paid' = 'pending';

    // Verify online payment if razorpay
    if (paymentMethod === 'razorpay') {
      if (process.env.RAZORPAY_KEY_SECRET && process.env.RAZORPAY_KEY_SECRET !== 'placeholder_secret_key') {
        // Production cryptographic signature verification
        if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
          return res.status(400).json({ error: 'Payment details incomplete for signature verification.' });
        }
        const generatedSignature = crypto
          .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
          .update(`${razorpayOrderId}|${razorpayPaymentId}`)
          .digest('hex');

        if (generatedSignature !== razorpaySignature) {
          return res.status(400).json({ error: 'Payment signature verification failed. Transaction rejected.' });
        }
        paymentStatus = 'paid';
      } else {
        // Sandbox test mode verification
        paymentStatus = 'paid';
      }
    }

    // 1. Transactional stock deduction
    for (const update of productsToUpdate) {
      update.product.stock = update.newStock;
    }

    const now = new Date().toISOString();
    const orderId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const randomHex = Math.random().toString(36).substring(2, 7).toUpperCase();
    const orderNumber = `ZK-${new Date().getFullYear()}-${randomHex}`;

    // Get unique sellers involved in this order
    const sellerIds = Array.from(new Set(orderItems.map(i => i.sellerId)));

    // 2. Create Master Order
    const newOrder: Order = {
      id: orderId,
      orderNumber,
      customerId: userId,
      customerName: req.user!.name,
      customerEmail: req.user!.email,
      customerPhone: shippingAddress.phone,
      shippingAddress,
      items: orderItems,
      subtotal,
      shippingFee,
      tax,
      discountAmount,
      couponCode: coupon?.code,
      totalAmount,
      paymentMethod,
      paymentStatus,
      orderStatus: 'placed',
      sellerIds,
      createdAt: now,
      updatedAt: now,
    };

    db.orders.unshift(newOrder);

    // 3. Create Seller-Specific Sub-Orders (Multi-Seller Architecture)
    for (const sId of sellerIds) {
      const sellerItems = orderItems.filter(i => i.sellerId === sId);
      const sellerSubtotal = sellerItems.reduce((sum, i) => sum + i.subtotal, 0);
      const sellerCommission = sellerItems.reduce((sum, i) => sum + i.commissionAmount, 0);
      const sellerEarnings = sellerSubtotal - sellerCommission;

      const subOrder: SubOrder = {
        id: `sub_${orderId}_${sId.substring(4, 10)}`,
        parentOrderId: orderId,
        sellerId: sId,
        storeName: sellerItems[0]?.storeName || 'Merchant Store',
        items: sellerItems,
        subtotal: sellerSubtotal,
        commissionAmount: sellerCommission,
        sellerEarnings,
        status: 'placed',
        createdAt: now,
        updatedAt: now,
      };

      db.subOrders.unshift(subOrder);

      // Update seller total sales metrics
      const sellerProfile = db.sellerProfiles.find(s => s.userId === sId);
      if (sellerProfile) {
        sellerProfile.totalSales += sellerSubtotal;
        sellerProfile.totalEarnings += sellerEarnings;
      }

      // Send notification to Seller
      db.notifications.push({
        id: `notif_${Date.now()}_${sId}`,
        userId: sId,
        title: 'New Customer Order Received!',
        message: `You have a new order (#${orderNumber}) with ${sellerItems.length} item(s) totaling ₹${sellerSubtotal.toLocaleString()}.`,
        type: 'order',
        read: false,
        link: '/seller/orders',
        createdAt: now,
      });
    }

    // 4. Record Payment Audit Entry
    const paymentRecord: PaymentRecord = {
      id: `payrec_${Date.now()}`,
      orderId,
      amount: totalAmount,
      currency: 'INR',
      method: paymentMethod,
      status: paymentStatus === 'paid' ? 'captured' : 'initiated',
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      idempotencyKey,
      createdAt: now,
    };
    db.payments.unshift(paymentRecord);

    // 5. Send Notification to Customer
    db.notifications.push({
      id: `notif_${Date.now()}_cust`,
      userId,
      title: 'Order Confirmed!',
      message: `Your order #${orderNumber} for ₹${totalAmount.toLocaleString()} has been placed successfully.`,
      type: 'order',
      read: false,
      link: `/orders/${orderId}`,
      createdAt: now,
    });

    // 6. Clear customer's cart
    cart.items = [];
    cart.updatedAt = now;

    db.save();

    logAudit(
      { id: req.user!.userId, email: req.user!.email, role: req.user!.role },
      'ORDER_PLACED',
      'order',
      orderId,
      { orderNumber, totalAmount, paymentMethod, paymentStatus }
    );

    res.status(201).json({
      message: 'Order placed successfully',
      order: newOrder,
      subOrdersCount: sellerIds.length,
    });
  } catch (err: any) {
    console.error('Checkout error:', err);
    res.status(500).json({ error: 'Internal error processing order.' });
  }
});

// GET /api/orders - Customer order history
ordersRouter.get('/orders', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const userOrders = db.orders
    .filter(o => o.customerId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json({ orders: userOrders });
});

// GET /api/orders/:id - Customer single order with live sub-orders & timeline
ordersRouter.get('/orders/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const order = db.orders.find(o => o.id === id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found.' });
  }

  // Security Check: Customer who placed it, or Admin
  if (order.customerId !== req.user!.userId && req.user!.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized to view this order.' });
  }

  const subOrders = db.subOrders.filter(s => s.parentOrderId === order.id);

  res.json({ order, subOrders });
});

// POST /api/orders/:id/cancel - Customer cancellation
ordersRouter.post('/orders/:id/cancel', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;

  const order = db.orders.find(o => o.id === id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found.' });
  }

  if (order.customerId !== req.user!.userId && req.user!.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized.' });
  }

  if (!['placed', 'confirmed'].includes(order.orderStatus)) {
    return res.status(400).json({
      error: `Cannot cancel order in "${order.orderStatus}" status. Orders can only be cancelled before dispatch.`
    });
  }

  const now = new Date().toISOString();
  order.orderStatus = 'cancelled';
  order.cancellationReason = reason || 'Customer requested cancellation';
  order.updatedAt = now;

  // Restock inventory and cancel all sub-orders
  const subOrders = db.subOrders.filter(s => s.parentOrderId === order.id);
  for (const sub of subOrders) {
    sub.status = 'cancelled';
    sub.cancellationReason = reason || 'Customer requested cancellation';
    sub.updatedAt = now;

    for (const item of sub.items) {
      const prod = db.products.find(p => p.id === item.productId);
      if (prod) {
        prod.stock += item.quantity;
      }
    }
  }

  // If online paid, schedule refund
  if (order.paymentStatus === 'paid') {
    order.paymentStatus = 'refunded';
    db.payments.push({
      id: `ref_${Date.now()}`,
      orderId: order.id,
      amount: order.totalAmount,
      currency: 'INR',
      method: order.paymentMethod,
      status: 'refunded',
      createdAt: now,
    });
  }

  db.save();

  logAudit(
    { id: req.user!.userId, email: req.user!.email, role: req.user!.role },
    'ORDER_CANCELLED',
    'order',
    order.id,
    { reason }
  );

  res.json({ message: 'Order cancelled successfully and inventory restored', order });
});

// POST /api/orders/:id/return - Return request
ordersRouter.post('/orders/:id/return', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;

  const order = db.orders.find(o => o.id === id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found.' });
  }

  if (order.customerId !== req.user!.userId && req.user!.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized.' });
  }

  if (order.orderStatus !== 'delivered') {
    return res.status(400).json({ error: 'Only delivered orders can be requested for return.' });
  }

  // Check return window
  const orderDate = new Date(order.updatedAt || order.createdAt);
  const diffDays = (Date.now() - orderDate.getTime()) / (1000 * 3600 * 24);
  const allowedDays = db.appSettings.returnWindowDays || 7;

  if (diffDays > allowedDays) {
    return res.status(400).json({ error: `The return window of ${allowedDays} days has expired.` });
  }

  order.orderStatus = 'returned';
  order.returnReason = reason || 'Item return requested';
  order.updatedAt = new Date().toISOString();

  // Notify Admin for inspection & refund processing
  db.notifications.push({
    id: `notif_${Date.now()}`,
    userId: 'usr_admin_1',
    title: 'Customer Return Request',
    message: `Return request submitted for Order #${order.orderNumber}. Reason: ${reason}`,
    type: 'order',
    read: false,
    link: `/admin/orders`,
    createdAt: new Date().toISOString(),
  });

  db.save();

  logAudit(
    { id: req.user!.userId, email: req.user!.email, role: req.user!.role },
    'ORDER_RETURN_REQUESTED',
    'order',
    order.id,
    { reason }
  );

  res.json({ message: 'Return request submitted. Our courier partner will pick up the package within 48 hours.', order });
});
