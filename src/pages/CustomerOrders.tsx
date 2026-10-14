import React, { useState, useEffect } from 'react';
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  RotateCcw,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Store,
  MapPin,
  Calendar,
} from 'lucide-react';
import { Order, SubOrder } from '../types';
import { useAuth } from '../context/AuthContext';

export const CustomerOrders: React.FC<{ onExplore: () => void }> = ({ onExplore }) => {
  const { token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // Cancellation & Return Dialogs
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('Found a better price elsewhere');
  const [returningOrderId, setReturningOrderId] = useState<string | null>(null);
  const [returnReason, setReturnReason] = useState('Item size does not fit as expected');
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchOrders = async () => {
    if (!token) return;
    try {
      setIsLoading(true);
      const res = await fetch('/api/orders', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
        if (data.orders.length > 0) {
          setExpandedOrderId(data.orders[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [token]);

  const handleCancelOrder = async (orderId: string) => {
    setIsActionLoading(true);
    setActionMessage(null);
    try {
      const res = await fetch(`/api/orders/${orderId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: cancelReason }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage('Order cancelled successfully. Inventory restored.');
        setCancellingOrderId(null);
        await fetchOrders();
      } else {
        setActionMessage(data.error || 'Failed to cancel');
      }
    } catch (err: any) {
      setActionMessage(err.message || 'Error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleReturnOrder = async (orderId: string) => {
    setIsActionLoading(true);
    setActionMessage(null);
    try {
      const res = await fetch(`/api/orders/${orderId}/return`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: returnReason }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage('Return request received. Courier partner will pick up package.');
        setReturningOrderId(null);
        await fetchOrders();
      } else {
        setActionMessage(data.error || 'Failed to request return');
      }
    } catch (err: any) {
      setActionMessage(err.message || 'Error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const getStatusStep = (status: string) => {
    switch (status) {
      case 'placed': return 1;
      case 'confirmed': return 2;
      case 'processing': return 3;
      case 'shipped': return 4;
      case 'delivered': return 5;
      default: return 0;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900">My Orders & Live Tracking</h1>
          <p className="text-xs text-slate-500 mt-1">Track multi-vendor dispatches, manage returns, and check invoices.</p>
        </div>
      </div>

      {actionMessage && (
        <div className="mb-6 p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 text-xs font-semibold flex items-center justify-between">
          <span>{actionMessage}</span>
          <button onClick={() => setActionMessage(null)} className="font-bold">✕</button>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-44 bg-slate-100 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-xs">
          <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-slate-900 text-base mb-1">No orders found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-6">
            You haven't placed any purchases yet. Explore our verified sellers and find incredible deals!
          </p>
          <button
            onClick={onExplore}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 px-6 rounded-full shadow-md"
          >
            Start Shopping
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
            const isExpanded = expandedOrderId === order.id;
            const currentStep = getStatusStep(order.orderStatus);
            const isTerminal = ['cancelled', 'returned'].includes(order.orderStatus);

            return (
              <div
                key={order.id}
                className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden transition"
              >
                {/* Order Top Banner */}
                <div className="p-5 sm:p-6 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold">
                      <Package className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900 text-base">#{order.orderNumber}</span>
                        <span
                          className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                            order.orderStatus === 'delivered'
                              ? 'bg-emerald-100 text-emerald-800'
                              : order.orderStatus === 'cancelled'
                              ? 'bg-rose-100 text-rose-800'
                              : order.orderStatus === 'returned'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {order.orderStatus}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                        </span>
                        <span>•</span>
                        <span>Payment: <strong>{order.paymentMethod.toUpperCase()} ({order.paymentStatus})</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-xs text-slate-400 block font-medium">Order Total</span>
                      <span className="text-lg font-black text-slate-900">
                        ₹{order.totalAmount.toLocaleString()}
                      </span>
                    </div>

                    <button
                      onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                      className="p-2 rounded-full hover:bg-slate-200 text-slate-600 transition"
                      title={isExpanded ? 'Collapse' : 'Expand'}
                    >
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Tracking Progress Bar */}
                {!isTerminal && (
                  <div className="px-6 py-5 bg-white border-b border-slate-100">
                    <div className="flex items-center justify-between text-xs font-bold mb-3">
                      <span className={currentStep >= 1 ? 'text-blue-600' : 'text-slate-400'}>Placed</span>
                      <span className={currentStep >= 2 ? 'text-blue-600' : 'text-slate-400'}>Confirmed</span>
                      <span className={currentStep >= 3 ? 'text-blue-600' : 'text-slate-400'}>Processing</span>
                      <span className={currentStep >= 4 ? 'text-blue-600' : 'text-slate-400'}>Shipped</span>
                      <span className={currentStep >= 5 ? 'text-emerald-600' : 'text-slate-400'}>Delivered</span>
                    </div>

                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-600 h-full transition-all duration-700"
                        style={{ width: `${(currentStep / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="p-6 space-y-6">
                    {/* Items Purchased */}
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs mb-3 uppercase tracking-wider text-slate-400">
                        Purchased Items & Merchant Assignment
                      </h4>
                      <div className="divide-y divide-slate-100">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="py-3 flex items-center justify-between gap-4 text-xs">
                            <div className="flex items-center gap-3">
                              <img src={item.image} alt="" className="w-14 h-14 rounded-xl object-cover bg-slate-100 shrink-0" />
                              <div>
                                <h5 className="font-bold text-slate-900 text-sm line-clamp-1">{item.title}</h5>
                                <p className="text-slate-500 mt-0.5 flex items-center gap-1 font-medium">
                                  <Store className="w-3 h-3 text-slate-400" />
                                  <span>Merchant: <strong>{item.storeName}</strong></span>
                                </p>
                                <p className="text-slate-500">Qty: {item.quantity} × ₹{item.price.toLocaleString()}</p>
                              </div>
                            </div>
                            <span className="font-black text-slate-900 text-sm">
                              ₹{item.subtotal.toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Delivery Address & Actions */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 text-xs">
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                        <div className="flex items-center gap-1.5 font-bold text-slate-900 mb-1">
                          <MapPin className="w-3.5 h-3.5 text-blue-600" />
                          <span>Delivery Destination</span>
                        </div>
                        <p className="text-slate-700 font-medium">{order.shippingAddress.fullName} ({order.shippingAddress.phone})</p>
                        <p className="text-slate-500 mt-0.5 leading-relaxed">
                          {order.shippingAddress.street}, {order.shippingAddress.apartment && `${order.shippingAddress.apartment}, `}
                          {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.postalCode}
                        </p>
                      </div>

                      {/* Order Modification Actions */}
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                        <div>
                          <span className="font-bold text-slate-900 block mb-1">Order Actions</span>
                          <p className="text-slate-500 leading-tight">
                            {['placed', 'confirmed'].includes(order.orderStatus)
                              ? 'Order has not been dispatched yet. You can cancel with full automated refund.'
                              : order.orderStatus === 'delivered'
                              ? 'Delivered orders can be returned within 7 days under standard return policy.'
                              : 'Order is currently under active carrier transit.'}
                          </p>
                        </div>

                        <div className="flex gap-2 mt-3">
                          {['placed', 'confirmed'].includes(order.orderStatus) && (
                            <button
                              onClick={() => setCancellingOrderId(order.id)}
                              className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold px-3 py-1.5 rounded-xl transition"
                            >
                              Cancel Order
                            </button>
                          )}

                          {order.orderStatus === 'delivered' && (
                            <button
                              onClick={() => setReturningOrderId(order.id)}
                              className="bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold px-3 py-1.5 rounded-xl transition"
                            >
                              Request Return
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Cancel Order Dialog Modal */}
      {cancellingOrderId && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="font-bold text-slate-900 text-base mb-2">Cancel Order</h3>
            <p className="text-xs text-slate-500 mb-4">
              Please specify the reason for cancellation. Product inventory will be restored instantly.
            </p>

            <select
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full bg-slate-100 border border-slate-300 rounded-xl p-2.5 text-xs font-semibold mb-4"
            >
              <option value="Found a better price elsewhere">Found a better price elsewhere</option>
              <option value="Ordered by mistake">Ordered by mistake</option>
              <option value="Delivery time is too long">Delivery time is too long</option>
              <option value="Need to change shipping address">Need to change shipping address</option>
            </select>

            <div className="flex gap-2">
              <button
                onClick={() => setCancellingOrderId(null)}
                className="flex-1 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Nevermind
              </button>
              <button
                onClick={() => handleCancelOrder(cancellingOrderId)}
                disabled={isActionLoading}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-2 rounded-xl transition"
              >
                {isActionLoading ? 'Cancelling...' : 'Confirm Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Return Order Dialog Modal */}
      {returningOrderId && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="font-bold text-slate-900 text-base mb-2">Return Request</h3>
            <p className="text-xs text-slate-500 mb-4">
              Our courier will pick up the package within 48 hours for verified refund inspection.
            </p>

            <select
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
              className="w-full bg-slate-100 border border-slate-300 rounded-xl p-2.5 text-xs font-semibold mb-4"
            >
              <option value="Item size does not fit as expected">Item size does not fit as expected</option>
              <option value="Received damaged or defective product">Received damaged or defective product</option>
              <option value="Different item received than ordered">Different item received than ordered</option>
              <option value="Quality not as expected">Quality not as expected</option>
            </select>

            <div className="flex gap-2">
              <button
                onClick={() => setReturningOrderId(null)}
                className="flex-1 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReturnOrder(returningOrderId)}
                disabled={isActionLoading}
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs py-2 rounded-xl transition"
              >
                {isActionLoading ? 'Submitting...' : 'Confirm Return'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
