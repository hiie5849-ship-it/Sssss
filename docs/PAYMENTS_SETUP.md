# Payment Gateway Setup & Credentials Guide

ZappKart supports official Indian payment gateway integration with Razorpay (supporting UPI, Cards, Netbanking, Wallets) along with Cash on Delivery (COD).

---

## 1. Obtaining Razorpay Test Credentials

1. Register an account on [Razorpay](https://razorpay.com).
2. Once inside the Dashboard, ensure the toggle at the top is set to **Test Mode**.
3. Navigate to **Settings > API Keys**.
4. Click **Generate Key**.
5. You will receive:
   - **Key ID**: starts with `rzp_test_...`
   - **Key Secret**: a 24-character secret key.
6. Copy these into your `.env` file:
   ```env
   RAZORPAY_KEY_ID="rzp_test_your_key_id"
   RAZORPAY_KEY_SECRET="your_key_secret"
   ENABLE_TEST_PAYMENTS="true"
   ```

---

## 2. Testing Payment Scenarios

In sandbox test mode, you can test cards and UPI:

### Test UPI ID
- Success: `success@razorpay`
- Failure: `failure@razorpay`

### Test Cards
- **Card Number**: `4111 1111 1111 1111` (Visa)
- **Expiry**: Any future date (e.g. `12/28`)
- **CVV**: `123`
- **OTP**: Enter `123456` or click **Success** on the Razorpay simulation modal.

---

## 3. Server-Side HMAC SHA256 Signature Verification

In `server/routes/orders.ts` and `server/routes/payments.ts`, signatures are verified server-side:
```typescript
const generatedSignature = crypto
  .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
  .update(`${razorpayOrderId}|${razorpayPaymentId}`)
  .digest('hex');

if (generatedSignature !== razorpaySignature) {
  throw new Error('Payment signature verification failed.');
}
```
This guarantees that an attacker cannot spoof client requests or fake a paid order.

---

## 4. Going Live (Live Mode Requirements)

To accept real currency payments:
1. Complete Business KYC onboarding on Razorpay (GSTIN, Business PAN, Bank Account).
2. Switch toggle to **Live Mode**.
3. Generate Live API Keys (`rzp_live_...`).
4. Set webhook endpoint to `https://your-domain.com/api/payments/razorpay/webhook`.
5. Update server environment variables with live keys and restart the application.
