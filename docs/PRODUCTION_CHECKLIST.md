# ZappKart — Production Launch Readiness Checklist

The application includes functional, fully implemented local and sandbox workflows. For a public commercial launch, configure the following external services:

| Component | Current State | External Service Required for Production | Action Required |
|---|---|---|---|
| **Payment Gateway** | Functional with sandbox simulation & test credentials | Official Razorpay / Cashfree / Stripe Merchant Account | Complete merchant onboarding, obtain live API Key & Secret, set in `.env` |
| **SMS OTP / Order Alerts** | In-app notification center & server notifications | Twilio / Gupshup / Fast2SMS | Hook SMS gateway API in `server/routes/orders.ts` to dispatch transactional SMS |
| **Shipping & Courier Partner** | Manual tracking assignment with carrier & tracking numbers | Shiprocket / Delhivery / Bluedart API | Integrate logistics courier webhook to generate shipping labels automatically |
| **Cloud Storage** | Base64 and secure URL storage | AWS S3 / Cloudflare R2 / Firebase Cloud Storage | Configure CDN bucket for merchant photo asset delivery |
| **Transactional Email** | Server notification logging | SendGrid / AWS SES / Resend | Connect SMTP / API key to dispatch HTML invoices and password reset emails |
| **GST Invoicing** | Automatic tax calculation (5%) | ClearTax / GST Suvidha Provider (GSP) | Connect official e-Invoicing API for B2B merchant invoices exceeding threshold |
| **Google Play Release** | Capacitor config & web bundle ready | Google Play Console Developer Account ($25 fee) | Generate signed keystore `.aab` file and upload to Google Play Store |
