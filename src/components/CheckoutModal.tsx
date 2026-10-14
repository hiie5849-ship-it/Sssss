import React, { useState, useEffect } from 'react';
import {
  X,
  MapPin,
  Plus,
  CreditCard,
  Truck,
  ShieldCheck,
  CheckCircle2,
  Tag,
  ArrowRight,
  AlertCircle,
  Smartphone,
  Store,
} from 'lucide-react';
import { Address, Order } from '../types';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderSuccess: (order: Order) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  onOrderSuccess,
}) => {
  if (!isOpen) return null;

  const { user, token } = useAuth();
  const { items, clearCart } = useCart();

  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Address, 2: Review, 3: Payment
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);

  // New Address Form
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newFullName, setNewFullName] = useState(user?.name || '');
  const [newPhone, setNewPhone] = useState(user?.phone || '+91 98765 44444');
  const [newStreet, setNewStreet] = useState('');
  const [newApartment, setNewApartment] = useState('');
  const [newCity, setNewCity] = useState('Bengaluru');
  const [newState, setNewState] = useState('Karnataka');
  const [newPostalCode, setNewPostalCode] = useState('560038');

  // Coupon & Order Preview
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [pricing, setPricing] = useState<any>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // Payment Selection & Submission
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'razorpay'>('razorpay');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  // Razorpay Gateway Simulation Modal
  const [showRazorpayModal, setShowRazorpayModal] = useState(false);
  const [simulatedUpiId, setSimulatedUpiId] = useState('user@okhdfcbank');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Fetch addresses on mount
  useEffect(() => {
    if (token) {
      fetchAddresses();
    }
  }, [token]);

  const fetchAddresses = async () => {
    try {
      setIsLoadingAddresses(true);
      const res = await fetch('/api/addresses', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAddresses(data.addresses || []);
        const defaultAddr = data.addresses.find((a: Address) => a.isDefault) || data.addresses[0];
        if (defaultAddr) setSelectedAddressId(defaultAddr.id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingAddresses(false);
    }
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/addresses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName: newFullName,
          phone: newPhone,
          street: newStreet,
          apartment: newApartment,
          city: newCity,
          state: newState,
          postalCode: newPostalCode,
          isDefault: true,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setAddresses([...addresses, data.address]);
        setSelectedAddressId(data.address.id);
        setShowAddAddress(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Preview Order & Server Calculations
  const fetchOrderPreview = async (codeToApply?: string) => {
    setIsLoadingPreview(true);
    setPreviewError(null);
    try {
      const res = await fetch('/api/orders/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ couponCode: codeToApply ?? couponCode }),
      });
      const data = await res.json();
      if (res.ok) {
        setPricing(data.pricing);
        setAppliedCoupon(data.pricing.appliedCoupon);
      } else {
        setPreviewError(data.error || 'Failed to calculate order');
        if (codeToApply) {
          setAppliedCoupon(null);
        }
      }
    } catch (err: any) {
      setPreviewError(err.message || 'Network error');
    } finally {
      setIsLoadingPreview(false);
    }
  };

  useEffect(() => {
    if (step === 2 && token) {
      fetchOrderPreview();
    }
  }, [step]);

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) return;
    fetchOrderPreview(couponCode.trim());
  };

  const handleRemoveCoupon = () => {
    setCouponCode('');
    fetchOrderPreview('');
  };

  // Order Placement Execution
  const executeOrderPlacement = async (paymentDetails?: any) => {
    setIsSubmittingOrder(true);
    setOrderError(null);
    try {
      const idempotencyKey = `idemp_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const res = await fetch('/api/orders/place', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          addressId: selectedAddressId,
          paymentMethod,
          couponCode: appliedCoupon?.code,
          idempotencyKey,
          ...paymentDetails,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setOrderError(data.error || 'Failed to complete order.');
        return;
      }

      await clearCart();
      setShowRazorpayModal(false);
      onClose();
      onOrderSuccess(data.order);
    } catch (err: any) {
      setOrderError(err.message || 'Payment processing error');
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const handleProceedToPayment = () => {
    if (paymentMethod === 'cod') {
      executeOrderPlacement();
    } else {
      setShowRazorpayModal(true);
    }
  };

  // Simulate Razorpay Gateway authorization
  const handleSimulateRazorpaySuccess = () => {
    setIsProcessingPayment(true);
    setTimeout(() => {
      setIsProcessingPayment(false);
      const mockPaymentId = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const mockOrderId = `order_${Date.now()}`;
      executeOrderPlacement({
        razorpayPaymentId: mockPaymentId,
        razorpayOrderId: mockOrderId,
        razorpaySignature: 'simulated_test_hmac_signature',
      });
    }, 1200);
  };

  // Unique sellers in this order
  const uniqueSellers = Array.from(new Set(items.map(i => i.storeName)));

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="relative bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col border border-slate-200">
        {/* Header with Steps */}
        <div className="p-4 sm:p-6 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            <h2 className="font-extrabold text-slate-900 text-lg">Secure Checkout</h2>
            <div className="flex items-center gap-2 mt-1.5 text-xs font-semibold">
              <span className={step >= 1 ? 'text-blue-600' : 'text-slate-400'}>1. Address</span>
              <span className="text-slate-300">→</span>
              <span className={step >= 2 ? 'text-blue-600' : 'text-slate-400'}>2. Order Review</span>
              <span className="text-slate-300">→</span>
              <span className={step === 3 ? 'text-blue-600' : 'text-slate-400'}>3. Payment</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200/70 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* STEP 1: Address Selection */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  <span>Select Delivery Address</span>
                </h3>
                {!showAddAddress && (
                  <button
                    onClick={() => setShowAddAddress(true)}
                    className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add New</span>
                  </button>
                )}
              </div>

              {isLoadingAddresses ? (
                <div className="py-8 text-center text-xs text-slate-500">Loading saved addresses...</div>
              ) : (
                <div className="space-y-3">
                  {addresses.map((addr) => (
                    <label
                      key={addr.id}
                      className={`block p-4 rounded-2xl border-2 transition cursor-pointer relative ${
                        selectedAddressId === addr.id
                          ? 'border-blue-600 bg-blue-50/40 ring-2 ring-blue-100'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <input
                        type="radio"
                        name="delivery_address"
                        value={addr.id}
                        checked={selectedAddressId === addr.id}
                        onChange={() => setSelectedAddressId(addr.id)}
                        className="sr-only"
                      />
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-slate-900 text-sm">{addr.fullName}</span>
                            <span className="text-[10px] uppercase font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                              {addr.label || 'Home'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            {addr.street}, {addr.apartment && `${addr.apartment}, `}{addr.city}, {addr.state} - {addr.postalCode}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">Phone: {addr.phone}</p>
                        </div>
                        {selectedAddressId === addr.id && (
                          <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              )}

              {/* Add Address Sub-Form */}
              {showAddAddress && (
                <form onSubmit={handleSaveAddress} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-3 mt-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="font-bold text-slate-800">New Delivery Location</span>
                    <button
                      type="button"
                      onClick={() => setShowAddAddress(false)}
                      className="text-slate-400 hover:text-slate-600 font-bold"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-600 mb-1 font-semibold">Full Name</label>
                      <input
                        type="text"
                        required
                        value={newFullName}
                        onChange={(e) => setNewFullName(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2 outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 mb-1 font-semibold">Phone Number</label>
                      <input
                        type="text"
                        required
                        value={newPhone}
                        onChange={(e) => setNewPhone(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2 outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1 font-semibold">Street & House / Flat No.</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 104, Sunrise Heights, 80 Feet Road"
                      value={newStreet}
                      onChange={(e) => setNewStreet(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-600 mb-1 font-semibold">City</label>
                      <input
                        type="text"
                        required
                        value={newCity}
                        onChange={(e) => setNewCity(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2 outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 mb-1 font-semibold">State</label>
                      <input
                        type="text"
                        required
                        value={newState}
                        onChange={(e) => setNewState(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2 outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 mb-1 font-semibold">PIN Code</label>
                      <input
                        type="text"
                        required
                        value={newPostalCode}
                        onChange={(e) => setNewPostalCode(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2 outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg transition"
                  >
                    Save & Deliver Here
                  </button>
                </form>
              )}
            </div>
          )}

          {/* STEP 2: Order Review & Coupon */}
          {step === 2 && (
            <div className="space-y-4">
              {/* Multi-Seller Notice */}
              <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200 text-xs">
                <div className="flex items-center gap-2 font-bold text-blue-900 mb-1">
                  <Store className="w-4 h-4 text-blue-700" />
                  <span>Multi-Vendor Fulfillment</span>
                </div>
                <p className="text-blue-800 leading-relaxed">
                  Your order contains items from <strong>{uniqueSellers.join(' & ')}</strong>. You will receive separate tracking numbers from each verified store.
                </p>
              </div>

              {/* Items summary */}
              <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto pr-1">
                {items.map((item) => (
                  <div key={item.productId} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <img src={item.images[0]} alt="" className="w-12 h-12 rounded-lg object-cover bg-slate-100 shrink-0" />
                      <div>
                        <p className="font-semibold text-slate-900 line-clamp-1">{item.title}</p>
                        <p className="text-slate-500 text-[11px]">Qty: {item.quantity} • Store: {item.storeName}</p>
                      </div>
                    </div>
                    <span className="font-bold text-slate-900">
                      ₹{(item.salePrice * item.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              {/* Coupon Box */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-slate-900 mb-2">
                  <Tag className="w-4 h-4 text-orange-600" />
                  <span>Apply Promotional Coupon</span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter code (e.g. WELCOME10 or ZAPP500)"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs uppercase font-semibold outline-none focus:border-blue-500"
                  />
                  {appliedCoupon ? (
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold px-3 py-2 rounded-xl"
                    >
                      Remove
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl"
                    >
                      Apply
                    </button>
                  )}
                </div>

                {appliedCoupon && (
                  <p className="text-emerald-700 font-semibold mt-2 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Coupon <strong>{appliedCoupon.code}</strong> applied! You saved ₹{appliedCoupon.discountAmount}.</span>
                  </p>
                )}

                {previewError && (
                  <p className="text-rose-600 font-medium mt-2">{previewError}</p>
                )}
              </div>

              {/* Verified Pricing Breakdown */}
              {pricing && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                  <div className="flex justify-between text-slate-600">
                    <span>Items Subtotal</span>
                    <span className="font-semibold text-slate-900">₹{pricing.subtotal.toLocaleString()}</span>
                  </div>
                  {pricing.discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-semibold">
                      <span>Promotional Discount</span>
                      <span>-₹{pricing.discountAmount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-600">
                    <span>Delivery Charges</span>
                    <span className={pricing.shippingFee === 0 ? 'text-emerald-600 font-bold' : 'font-semibold text-slate-900'}>
                      {pricing.shippingFee === 0 ? 'FREE' : `₹${pricing.shippingFee}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Estimated GST (5%)</span>
                    <span>₹{pricing.tax.toLocaleString()}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline text-sm">
                    <span className="font-bold text-slate-900">Total Amount Payable</span>
                    <span className="text-xl font-black text-slate-900">₹{pricing.totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Payment Options */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="font-bold text-slate-900 text-sm mb-2">Select Payment Method</h3>

              {/* Razorpay Option */}
              <label
                className={`block p-4 rounded-2xl border-2 transition cursor-pointer ${
                  paymentMethod === 'razorpay'
                    ? 'border-blue-600 bg-blue-50/40 ring-2 ring-blue-100'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="payment_method"
                  value="razorpay"
                  checked={paymentMethod === 'razorpay'}
                  onChange={() => setPaymentMethod('razorpay')}
                  className="sr-only"
                />
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shrink-0">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">Razorpay Secure Online</span>
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">Instant</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">UPI (GPay, PhonePe, Paytm), Credit/Debit Cards, NetBanking</p>
                    </div>
                  </div>
                  {paymentMethod === 'razorpay' && <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />}
                </div>
              </label>

              {/* Cash on Delivery Option */}
              <label
                className={`block p-4 rounded-2xl border-2 transition cursor-pointer ${
                  paymentMethod === 'cod'
                    ? 'border-blue-600 bg-blue-50/40 ring-2 ring-blue-100'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="payment_method"
                  value="cod"
                  checked={paymentMethod === 'cod'}
                  onChange={() => setPaymentMethod('cod')}
                  className="sr-only"
                />
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">Cash on Delivery (COD)</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">Pay in cash or UPI when your order is delivered to your doorstep.</p>
                    </div>
                  </div>
                  {paymentMethod === 'cod' && <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />}
                </div>
              </label>

              {orderError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{orderError}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 sm:p-6 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          {step > 1 ? (
            <button
              onClick={() => setStep((s) => (s - 1) as any)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              ← Back
            </button>
          ) : (
            <div />
          )}

          {step === 1 && (
            <button
              onClick={() => setStep(2)}
              disabled={!selectedAddressId}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs py-3 px-6 rounded-xl flex items-center gap-2 shadow-md transition"
            >
              <span>Continue to Review</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {step === 2 && (
            <button
              onClick={() => setStep(3)}
              disabled={isLoadingPreview}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-3 px-6 rounded-xl flex items-center gap-2 shadow-md transition"
            >
              <span>Select Payment</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {step === 3 && (
            <button
              onClick={handleProceedToPayment}
              disabled={isSubmittingOrder}
              className="bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-bold text-xs py-3 px-8 rounded-xl flex items-center gap-2 shadow-lg shadow-orange-600/25 transition active:scale-98"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isSubmittingOrder ? 'Placing Order...' : (paymentMethod === 'cod' ? 'Confirm COD Order' : 'Pay via Razorpay')}</span>
            </button>
          )}
        </div>
      </div>

      {/* RAZORPAY GATEWAY MODAL SIMULATION */}
      {showRazorpayModal && (
        <div className="fixed inset-0 z-60 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 animate-scaleUp">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded bg-blue-600 text-white font-extrabold flex items-center justify-center text-xs">
                  R
                </div>
                <span className="font-extrabold text-slate-900 text-sm">Razorpay Checkout</span>
              </div>
              <button onClick={() => setShowRazorpayModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 text-center">
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Amount to Pay</span>
              <h2 className="text-2xl font-black text-slate-900 mt-0.5">
                ₹{pricing ? pricing.totalAmount.toLocaleString() : '0'}
              </h2>
              <span className="inline-block mt-1 text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                Test Mode Sandbox
              </span>
            </div>

            <div className="space-y-3 mb-6 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-semibold text-slate-800 block mb-1">Simulated UPI Handle</span>
                <div className="flex items-center gap-2 bg-white px-2.5 py-1.5 rounded-lg border border-slate-300">
                  <Smartphone className="w-4 h-4 text-blue-600" />
                  <input
                    type="text"
                    value={simulatedUpiId}
                    onChange={(e) => setSimulatedUpiId(e.target.value)}
                    className="flex-1 outline-none font-medium text-slate-900 text-xs"
                  />
                </div>
              </div>

              <div className="text-[11px] text-slate-500 leading-tight">
                Clicking <strong>Authorize Payment</strong> simulates a successful HMAC signature callback from Razorpay servers.
              </div>
            </div>

            <button
              onClick={handleSimulateRazorpaySuccess}
              disabled={isProcessingPayment}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition cursor-pointer"
            >
              {isProcessingPayment ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verifying HMAC Signature...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Authorize & Pay</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
