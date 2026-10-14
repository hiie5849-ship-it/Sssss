import React, { useState, useEffect } from 'react';
import {
  Store,
  Package,
  ShoppingBag,
  TrendingUp,
  DollarSign,
  Plus,
  Truck,
  AlertCircle,
  CheckCircle2,
  Edit2,
  Trash2,
  Send,
  Building,
  CreditCard,
  Clock,
} from 'lucide-react';
import { Product, SubOrder, SellerPayout, Category } from '../types';
import { useAuth } from '../context/AuthContext';

export const SellerPortal: React.FC = () => {
  const { user, sellerProfile, token, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'payouts' | 'settings'>('overview');

  // Stats
  const [stats, setStats] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [subOrders, setSubOrders] = useState<SubOrder[]>([]);
  const [payouts, setPayouts] = useState<SellerPayout[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New / Edit Product Modal
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [prodTitle, setProdTitle] = useState('');
  const [prodDescription, setProdDescription] = useState('');
  const [prodCategoryId, setProdCategoryId] = useState('');
  const [prodPrice, setProdPrice] = useState(1999);
  const [prodSalePrice, setProdSalePrice] = useState(1499);
  const [prodSku, setProdSku] = useState('');
  const [prodStock, setProdStock] = useState(25);
  const [prodImage, setProdImage] = useState('');
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);
  const [productError, setProductError] = useState<string | null>(null);

  // Ship Order Modal
  const [shippingOrderId, setShippingOrderId] = useState<string | null>(null);
  const [carrier, setCarrier] = useState('BlueDart Express');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [isShippingLoading, setIsShippingLoading] = useState(false);

  // Payout Request Modal
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState(5000);
  const [payoutNote, setPayoutNote] = useState('');
  const [isSubmittingPayout, setIsSubmittingPayout] = useState(false);
  const [payoutMessage, setPayoutMessage] = useState<string | null>(null);

  // Settings
  const [storeName, setStoreName] = useState(sellerProfile?.storeName || '');
  const [storeDescription, setStoreDescription] = useState(sellerProfile?.storeDescription || '');
  const [bankAccount, setBankAccount] = useState(sellerProfile?.bankAccount || '');
  const [ifsc, setIfsc] = useState(sellerProfile?.ifsc || '');
  const [settingsSaved, setSettingsSaved] = useState(false);

  const fetchSellerData = async () => {
    if (!token) return;
    try {
      setIsLoading(true);
      const [dashRes, prodRes, ordRes, payRes, catRes] = await Promise.all([
        fetch('/api/sellers/dashboard', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/sellers/products', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/sellers/sub-orders', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/sellers/payouts', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/products/categories'),
      ]);

      if (dashRes.ok) {
        const d = await dashRes.json();
        setStats(d.stats);
      }
      if (prodRes.ok) {
        const p = await prodRes.json();
        setProducts(p.products || []);
      }
      if (ordRes.ok) {
        const o = await ordRes.json();
        setSubOrders(o.subOrders || []);
      }
      if (payRes.ok) {
        const pay = await payRes.json();
        setPayouts(pay.payouts || []);
      }
      if (catRes.ok) {
        const c = await catRes.json();
        setCategories(c.categories || []);
        if (c.categories?.length > 0 && !prodCategoryId) {
          setProdCategoryId(c.categories[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSellerData();
  }, [token]);

  // Handle Save / Edit Product
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingProduct(true);
    setProductError(null);

    const payload = {
      title: prodTitle,
      description: prodDescription,
      categoryId: prodCategoryId,
      price: prodPrice,
      salePrice: prodSalePrice,
      sku: prodSku,
      stock: prodStock,
      images: prodImage ? [prodImage] : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80'],
    };

    try {
      const url = editingProductId ? `/api/products/${editingProductId}` : '/api/products';
      const method = editingProductId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        setShowProductModal(false);
        setEditingProductId(null);
        setProdTitle('');
        setProdDescription('');
        setProdSku('');
        setProdImage('');
        await fetchSellerData();
      } else {
        setProductError(data.error || 'Failed to save product');
      }
    } catch (err: any) {
      setProductError(err.message || 'Error');
    } finally {
      setIsSubmittingProduct(false);
    }
  };

  const handleEditClick = (product: Product) => {
    setEditingProductId(product.id);
    setProdTitle(product.title);
    setProdDescription(product.description);
    setProdCategoryId(product.categoryId);
    setProdPrice(product.price);
    setProdSalePrice(product.salePrice);
    setProdSku(product.sku);
    setProdStock(product.stock);
    setProdImage(product.images[0] || '');
    setShowProductModal(true);
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to deactivate or remove this product listing?')) return;
    try {
      await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchSellerData();
    } catch (err) {
      console.error(err);
    }
  };

  // Sub-Order Status Transitions
  const handleUpdateOrderStatus = async (subOrderId: string, status: string, trackingInfo?: any) => {
    try {
      const res = await fetch(`/api/sellers/sub-orders/${subOrderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status, ...trackingInfo }),
      });
      if (res.ok) {
        setShippingOrderId(null);
        await fetchSellerData();
      } else {
        const d = await res.json();
        alert(d.error || 'Status update error');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Submit Payout Request
  const handleRequestPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingPayout(true);
    setPayoutMessage(null);
    try {
      const res = await fetch('/api/sellers/payout-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount: payoutAmount, note: payoutNote }),
      });
      const data = await res.json();
      if (res.ok) {
        setPayoutMessage('Payout request submitted to Super Admin for verification!');
        setTimeout(() => {
          setShowPayoutModal(false);
          setPayoutMessage(null);
        }, 2000);
        await fetchSellerData();
      } else {
        setPayoutMessage(data.error || 'Failed to submit payout request');
      }
    } catch (err: any) {
      setPayoutMessage(err.message || 'Error');
    } finally {
      setIsSubmittingPayout(false);
    }
  };

  // Save Store Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/sellers/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          storeName,
          storeDescription,
          bankAccount,
          ifsc,
        }),
      });
      if (res.ok) {
        setSettingsSaved(true);
        setTimeout(() => setSettingsSaved(false), 2500);
        await refreshUser();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const isPendingApproval = sellerProfile?.approvalStatus === 'pending';

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Top Banner / Store Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-600/20">
            <Store className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                {sellerProfile?.storeName || `${user?.name}'s Store`}
              </h1>
              <span
                className={`text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                  sellerProfile?.approvalStatus === 'approved'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {sellerProfile?.approvalStatus || 'Active'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Commission Rate: <strong>{sellerProfile?.commissionRate ?? 10}%</strong> • Rating: <strong>{sellerProfile?.rating.toFixed(1) ?? '5.0'} ★</strong>
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setEditingProductId(null);
            setShowProductModal(true);
          }}
          disabled={isPendingApproval}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs py-2.5 px-5 rounded-xl flex items-center gap-2 shadow-md transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Pending Approval Notice */}
      {isPendingApproval && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <strong className="block text-sm font-bold">Seller Verification Pending</strong>
            <span>Your merchant application is under review by Super Admin. You cannot publish live products until approved.</span>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto text-xs font-bold text-slate-600">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 px-4 transition ${activeTab === 'overview' ? 'border-b-2 border-emerald-600 text-emerald-600' : 'hover:text-slate-900'}`}
        >
          Overview & Metrics
        </button>
        <button
          onClick={() => setActiveTab('products')}
          className={`pb-3 px-4 transition ${activeTab === 'products' ? 'border-b-2 border-emerald-600 text-emerald-600' : 'hover:text-slate-900'}`}
        >
          My Inventory ({products.length})
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 px-4 transition ${activeTab === 'orders' ? 'border-b-2 border-emerald-600 text-emerald-600' : 'hover:text-slate-900'}`}
        >
          Store Orders ({subOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('payouts')}
          className={`pb-3 px-4 transition ${activeTab === 'payouts' ? 'border-b-2 border-emerald-600 text-emerald-600' : 'hover:text-slate-900'}`}
        >
          Earnings & Payouts
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`pb-3 px-4 transition ${activeTab === 'settings' ? 'border-b-2 border-emerald-600 text-emerald-600' : 'hover:text-slate-900'}`}
        >
          Store Settings
        </button>
      </div>

      {/* TAB 1: OVERVIEW METRICS */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-400 font-semibold block mb-1">Gross Sales</span>
              <span className="text-2xl font-black text-slate-900">
                ₹{stats ? stats.totalRevenue.toLocaleString() : '0'}
              </span>
              <span className="text-[10px] text-slate-400 block mt-1">Total customer purchases</span>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs">
              <span className="text-xs text-emerald-600 font-semibold block mb-1">Net Earnings</span>
              <span className="text-2xl font-black text-emerald-700">
                ₹{stats ? stats.totalEarnings.toLocaleString() : '0'}
              </span>
              <span className="text-[10px] text-emerald-600 block mt-1">After {stats?.commissionRate}% platform fee</span>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs">
              <span className="text-xs text-blue-600 font-semibold block mb-1">Pending Shipments</span>
              <span className="text-2xl font-black text-blue-700">
                {stats?.pendingShipments || 0}
              </span>
              <span className="text-[10px] text-slate-400 block mt-1">Awaiting dispatch</span>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs">
              <span className="text-xs text-amber-600 font-semibold block mb-1">Low Stock Alerts</span>
              <span className="text-2xl font-black text-amber-700">
                {stats?.lowStockCount || 0}
              </span>
              <span className="text-[10px] text-amber-600 block mt-1">Less than 5 left</span>
            </div>
          </div>

          {/* Recent Orders Overview */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
            <h3 className="font-bold text-slate-900 text-sm mb-4">Latest Store Sub-Orders</h3>
            {subOrders.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No orders received yet.</p>
            ) : (
              <div className="divide-y divide-slate-100 text-xs">
                {subOrders.slice(0, 5).map((sub: any) => (
                  <div key={sub.id} className="py-3 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900">Order #{sub.orderNumber || sub.id}</span>
                      <p className="text-slate-500 mt-0.5">{sub.items?.length || 0} item(s) • Recipient: {sub.customerName}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-slate-900 block">₹{sub.subtotal.toLocaleString()}</span>
                      <span className="text-[10px] uppercase font-bold text-blue-600">{sub.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: PRODUCTS MANAGEMENT */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">Listed Store Products</h3>
            <span className="text-xs text-slate-500">{products.length} Products in catalog</span>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            {products.length === 0 ? (
              <div className="p-10 text-center text-xs text-slate-500">
                You have not added any products yet. Click "Add New Product" above to publish your first listing.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {products.map((prod) => (
                  <div key={prod.id} className="p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
                    <div className="flex items-center gap-3">
                      <img src={prod.images[0]} alt="" className="w-14 h-14 rounded-xl object-cover bg-slate-100 shrink-0" />
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{prod.title}</h4>
                        <p className="text-slate-500 mt-0.5">SKU: {prod.sku} • Category: {prod.categoryName}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-black text-slate-900">₹{prod.salePrice.toLocaleString()}</span>
                          <span className="text-slate-400 line-through">₹{prod.price.toLocaleString()}</span>
                          <span className="text-slate-300">|</span>
                          <span className={prod.stock <= 5 ? 'text-amber-600 font-bold' : 'text-emerald-600 font-medium'}>
                            Stock: {prod.stock}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditClick(prod)}
                        className="p-2 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition"
                        title="Edit Product"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(prod.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition"
                        title="Delete Product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: STORE ORDERS FULFILLMENT */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <h3 className="font-bold text-slate-900 text-sm">Customer Orders Assigned to Your Store</h3>

          {subOrders.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-xs text-slate-500">
              No orders assigned to your store yet.
            </div>
          ) : (
            <div className="space-y-4">
              {subOrders.map((sub: any) => (
                <div key={sub.id} className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs text-xs space-y-3">
                  <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-100 gap-2">
                    <div>
                      <span className="font-extrabold text-slate-900 text-sm">
                        Order #{sub.orderNumber || sub.parentOrderId}
                      </span>
                      <p className="text-slate-500 mt-0.5">Placed: {new Date(sub.createdAt).toLocaleString()}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`font-extrabold uppercase px-2.5 py-0.5 rounded-full text-[10px] ${
                          sub.status === 'delivered'
                            ? 'bg-emerald-100 text-emerald-800'
                            : sub.status === 'shipped'
                            ? 'bg-blue-100 text-blue-800'
                            : sub.status === 'cancelled'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {sub.status}
                      </span>
                    </div>
                  </div>

                  {/* Sub Order Items */}
                  <div className="divide-y divide-slate-100">
                    {sub.items?.map((item: any, idx: number) => (
                      <div key={idx} className="py-2 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <img src={item.image} alt="" className="w-10 h-10 rounded-lg object-cover bg-slate-100" />
                          <div>
                            <span className="font-semibold text-slate-900 line-clamp-1">{item.title}</span>
                            <span className="text-slate-500">Qty: {item.quantity}</span>
                          </div>
                        </div>
                        <span className="font-bold text-slate-900">₹{item.subtotal.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>

                  {/* Financials & Customer Address */}
                  <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] bg-slate-50 p-3 rounded-2xl">
                    <div>
                      <span className="font-bold text-slate-700 block">Deliver to Recipient:</span>
                      <p className="text-slate-600 font-medium">{sub.customerName} ({sub.customerPhone})</p>
                      {sub.shippingAddress && (
                        <p className="text-slate-500">
                          {sub.shippingAddress.street}, {sub.shippingAddress.city}, {sub.shippingAddress.state} - {sub.shippingAddress.postalCode}
                        </p>
                      )}
                    </div>
                    <div className="sm:text-right">
                      <span className="text-slate-500 block">Subtotal: ₹{sub.subtotal.toLocaleString()}</span>
                      <span className="text-slate-500 block">Platform Fee: -₹{sub.commissionAmount.toLocaleString()}</span>
                      <span className="font-bold text-emerald-700 text-xs block">Your Net Earnings: ₹{sub.sellerEarnings.toLocaleString()}</span>
                      {sub.trackingNumber && (
                        <span className="text-blue-600 font-semibold block mt-1">Carrier: {sub.carrier} ({sub.trackingNumber})</span>
                      )}
                    </div>
                  </div>

                  {/* Workflow Action Buttons */}
                  <div className="pt-2 flex flex-wrap gap-2 justify-end">
                    {sub.status === 'placed' && (
                      <button
                        onClick={() => handleUpdateOrderStatus(sub.id, 'confirmed')}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-xl transition"
                      >
                        Accept & Confirm
                      </button>
                    )}

                    {sub.status === 'confirmed' && (
                      <button
                        onClick={() => handleUpdateOrderStatus(sub.id, 'processing')}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-xl transition"
                      >
                        Pack & Ready
                      </button>
                    )}

                    {sub.status === 'processing' && (
                      <button
                        onClick={() => {
                          setShippingOrderId(sub.id);
                          setTrackingNumber(`TRK-${Math.random().toString(36).substring(2, 8).toUpperCase()}`);
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 transition"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>Dispatch & Ship</span>
                      </button>
                    )}

                    {sub.status === 'shipped' && (
                      <button
                        onClick={() => handleUpdateOrderStatus(sub.id, 'delivered')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-xl transition"
                      >
                        Mark Delivered
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: EARNINGS & PAYOUTS */}
      {activeTab === 'payouts' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-emerald-50 border border-emerald-200 flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-emerald-800 block">Available Settled Balance</span>
              <h2 className="text-3xl font-black text-emerald-950 mt-1">
                ₹{stats ? stats.totalEarnings.toLocaleString() : '0'}
              </h2>
              <p className="text-xs text-emerald-700 mt-1">Available for direct bank withdrawal transfer.</p>
            </div>

            <button
              onClick={() => setShowPayoutModal(true)}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs py-3 px-6 rounded-xl flex items-center gap-2 shadow-md transition"
            >
              <DollarSign className="w-4 h-4" />
              <span>Request Payout Transfer</span>
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
            <h3 className="font-bold text-slate-900 text-sm mb-4">Payout Withdrawal History</h3>
            {payouts.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No withdrawal requests filed yet.</p>
            ) : (
              <div className="divide-y divide-slate-100 text-xs">
                {payouts.map((p) => (
                  <div key={p.id} className="py-3.5 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 block">Transfer of ₹{p.amount.toLocaleString()}</span>
                      <span className="text-[11px] text-slate-400">{new Date(p.requestedAt).toLocaleDateString()} • Note: {p.note}</span>
                      {p.referenceNumber && (
                        <p className="text-emerald-700 font-semibold text-[10px]">Bank UTR/Ref: {p.referenceNumber}</p>
                      )}
                    </div>
                    <span
                      className={`font-extrabold uppercase px-2.5 py-0.5 rounded-full text-[10px] ${
                        p.status === 'transferred'
                          ? 'bg-emerald-100 text-emerald-800'
                          : p.status === 'approved'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: STORE SETTINGS */}
      {activeTab === 'settings' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs max-w-2xl">
          <h3 className="font-bold text-slate-900 text-base mb-4">Merchant Store & Bank Settings</h3>
          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Store Name</label>
              <input
                type="text"
                required
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Store Description & Bio</label>
              <textarea
                rows={3}
                value={storeDescription}
                onChange={(e) => setStoreDescription(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Bank Account Number</label>
                <input
                  type="text"
                  placeholder="e.g. 918273645012"
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Bank IFSC Code</label>
                <input
                  type="text"
                  placeholder="e.g. HDFC0001234"
                  value={ifsc}
                  onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 outline-none focus:border-emerald-500 uppercase"
                />
              </div>
            </div>

            {settingsSaved && (
              <p className="text-emerald-700 font-bold text-xs">Store profile settings saved successfully!</p>
            )}

            <button
              type="submit"
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs py-2.5 px-6 rounded-xl shadow-md transition"
            >
              Save Changes
            </button>
          </form>
        </div>
      )}

      {/* ADD / EDIT PRODUCT MODAL */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-slate-200">
            <h3 className="font-bold text-slate-900 text-base mb-3">
              {editingProductId ? 'Edit Product Listing' : 'Publish New Product'}
            </h3>

            <form onSubmit={handleSaveProduct} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Product Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sony WH-1000XM5 Wireless Headphones"
                  value={prodTitle}
                  onChange={(e) => setProdTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Product Description</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Detail the technical specifications, warranty, and features..."
                  value={prodDescription}
                  onChange={(e) => setProdDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Category</label>
                  <select
                    value={prodCategoryId}
                    onChange={(e) => setProdCategoryId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 outline-none focus:border-blue-500 font-semibold"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">SKU</label>
                  <input
                    type="text"
                    placeholder="e.g. SNY-XM5-BLK"
                    value={prodSku}
                    onChange={(e) => setProdSku(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Regular Price (₹)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={prodPrice}
                    onChange={(e) => setProdPrice(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Sale Price (₹)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={prodSalePrice}
                    onChange={(e) => setProdSalePrice(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Stock Units</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={prodStock}
                    onChange={(e) => setProdStock(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Product Photo URL</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={prodImage}
                  onChange={(e) => setProdImage(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 outline-none focus:border-blue-500"
                />
              </div>

              {productError && (
                <div className="p-2.5 rounded-xl bg-rose-50 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{productError}</span>
                </div>
              )}

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="flex-1 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingProduct}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 rounded-xl shadow-md"
                >
                  {isSubmittingProduct ? 'Saving...' : 'Publish Listing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DISPATCH / SHIP ORDER MODAL */}
      {shippingOrderId && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-xs">
            <h3 className="font-bold text-slate-900 text-base mb-2">Shipment Dispatch Details</h3>
            <p className="text-slate-500 mb-4">Provide tracking details so customer can trace delivery.</p>

            <div className="space-y-3 mb-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Logistics Carrier</label>
                <select
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 outline-none"
                >
                  <option value="BlueDart Express">BlueDart Express</option>
                  <option value="Delhivery Surface">Delhivery Surface</option>
                  <option value="DTDC Courier">DTDC Courier</option>
                  <option value="India Post EMS">India Post EMS</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tracking Number / AWB</label>
                <input
                  type="text"
                  required
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 outline-none font-semibold text-slate-900"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShippingOrderId(null)}
                className="flex-1 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={() => handleUpdateOrderStatus(shippingOrderId, 'shipped', { carrier, trackingNumber })}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 rounded-xl shadow-md"
              >
                Confirm Dispatch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PAYOUT REQUEST MODAL */}
      {showPayoutModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-xs">
            <h3 className="font-bold text-slate-900 text-base mb-2">Request Payout Transfer</h3>
            <p className="text-slate-500 mb-4">Funds will be credited to your verified bank account via NEFT/IMPS.</p>

            <form onSubmit={handleRequestPayout} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Amount (₹)</label>
                <input
                  type="number"
                  min="100"
                  required
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 outline-none text-base font-black text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Transfer Remarks / Note</label>
                <input
                  type="text"
                  value={payoutNote}
                  onChange={(e) => setPayoutNote(e.target.value)}
                  placeholder="e.g. October batch payout"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 outline-none"
                />
              </div>

              {payoutMessage && (
                <p className="text-emerald-700 font-bold">{payoutMessage}</p>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPayoutModal(false)}
                  className="flex-1 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPayout}
                  className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs py-2 rounded-xl shadow-md"
                >
                  {isSubmittingPayout ? 'Submitting...' : 'Request Payout'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
