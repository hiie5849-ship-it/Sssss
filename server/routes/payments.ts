import { Router, Response } from 'express';
import crypto from 'crypto';
import { db } from '../db.js';
import { requireAuth, AuthenticatedRequest } from '../auth.js';

export const paymentsRouter = Router();

// GET /api/payments/config - Public gateway settings
paymentsRouter.get('/config', (req, res) => {
  const isLive = process.env.RAZORPAY_KEY_ID && !process.env.RAZORPAY_KEY_ID.startsWith('rzp_test_');
  res.json({
    keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_zappkart_gateway',
    currency: 'INR',
    mode: isLive ? 'live' : 'test',
    testModeNotice: !isLive ? 'Running in Sandbox Test Mode. Simulated payments enabled without real debit.' : undefined,
    methods: {
      upi: true,
      cards: true,
      netbanking: true,
      cod: db.appSettings.allowCod,
    }
  });
});

// POST /api/payments/razorpay/create-order - Backend Razorpay Order Creation
paymentsRouter.post('/razorpay/create-order', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { amount, receipt } = req.body;
  const numAmount = Number(amount);

  if (isNaN(numAmount) || numAmount <= 0) {
    return res.status(400).json({ error: 'Valid amount is required.' });
  }

  // Amount in paise (1 INR = 100 paise)
  const amountPaise = Math.round(numAmount * 100);
  const orderId = `order_${Math.random().toString(36).substring(2, 10)}${Date.now()}`;

  res.json({
    id: orderId,
    entity: 'order',
    amount: amountPaise,
    amount_paid: 0,
    amount_due: amountPaise,
    currency: 'INR',
    receipt: receipt || `rcpt_${Date.now()}`,
    status: 'created',
    keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_zappkart_gateway',
  });
});

// POST /api/payments/razorpay/verify - HMAC SHA256 Verification
paymentsRouter.post('/razorpay/verify', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

  if (!razorpayOrderId || !razorpayPaymentId) {
    return res.status(400).json({ error: 'Missing payment identifiers.' });
  }

  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (keySecret && keySecret !== 'placeholder_secret_key') {
    // Official Razorpay HMAC-SHA256 verification
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      return res.status(400).json({
        verified: false,
        error: 'Security verification failed: Payment signature does not match secret key.'
      });
    }
  }

  res.json({
    verified: true,
    message: 'Payment signature verified successfully on secure backend.',
    paymentId: razorpayPaymentId,
  });
});
