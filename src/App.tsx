import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider, useCart } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { NotificationProvider } from './context/NotificationContext';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { NotificationsModal } from './components/NotificationsModal';
import { AuthModal } from './components/AuthModal';

// Pages
import { CustomerHome } from './pages/CustomerHome';
import { CustomerOrders } from './pages/CustomerOrders';
import { CustomerWishlist } from './pages/CustomerWishlist';
import { CustomerAddresses } from './pages/CustomerAddresses';
import { SellerPortal } from './pages/SellerPortal';
import { AdminPortal } from './pages/AdminPortal';
import { SellerStorePage } from './pages/SellerStorePage';

import { Product, Order } from './types';
import { ShieldCheck, Truck, RotateCcw, Headphones, Download, Store } from 'lucide-react';

const MainApp: React.FC = () => {
  const { user } = useAuth();
  const { setIsCartOpen } = useCart();

  const [currentView, setCurrentView] = useState<string>('home');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);

  // Modals
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register-customer' | 'register-seller'>('login');
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState<Order | null>(null);

  const handleOpenAuth = (tab: 'login' | 'register-customer' | 'register-seller' = 'login') => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
  };

  const handleSelectStore = (sellerId: string) => {
    setSelectedStoreId(sellerId);
    setCurrentView('store');
  };

  const handleOrderSuccess = (order: Order) => {
    setOrderConfirmed(order);
    setCurrentView('orders');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 pb-16 md:pb-0">
      {/* Top Navbar */}
      <Navbar
        currentView={currentView}
        setCurrentView={(view) => {
          if (view === 'become-seller') {
            handleOpenAuth('register-seller');
          } else {
            setCurrentView(view);
          }
        }}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onOpenAuthModal={() => handleOpenAuth('login')}
        onOpenNotifications={() => setIsNotificationsModalOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1">
        {currentView === 'home' && (
          <CustomerHome
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onSelectProduct={(p) => setSelectedProduct(p)}
            onSelectStore={handleSelectStore}
          />
        )}

        {currentView === 'orders' && (
          <CustomerOrders
            onExplore={() => {
              setCurrentView('home');
              setSearchQuery('');
            }}
          />
        )}

        {currentView === 'wishlist' && (
          <CustomerWishlist
            onSelectProduct={(p) => setSelectedProduct(p)}
            onExplore={() => {
              setCurrentView('home');
              setSearchQuery('');
            }}
          />
        )}

        {currentView === 'addresses' && <CustomerAddresses />}

        {currentView === 'seller' && <SellerPortal />}

        {currentView === 'admin' && <AdminPortal />}

        {currentView === 'store' && selectedStoreId && (
          <SellerStorePage
            sellerId={selectedStoreId}
            onBack={() => setCurrentView('home')}
            onSelectProduct={(p) => setSelectedProduct(p)}
          />
        )}
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 text-xs border-t border-slate-800 mt-12">
        {/* Value Propositions */}
        <div className="border-b border-slate-800 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-slate-800 text-blue-400 flex items-center justify-center mb-2">
                <Truck className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-200">Express Delivery</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Free delivery across India on orders above ₹999</p>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-slate-800 text-emerald-400 flex items-center justify-center mb-2">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-200">100% Genuine Merchants</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Every seller verified by Super Admin with GSTIN KYC</p>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-slate-800 text-orange-400 flex items-center justify-center mb-2">
                <RotateCcw className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-200">7-Day Easy Returns</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Doorstep pickup & direct-to-bank refund processing</p>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-slate-800 text-purple-400 flex items-center justify-center mb-2">
                <Headphones className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-200">24/7 Dedicated Support</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Toll free: 1800 200 4545 • support@zappkart.com</p>
            </div>
          </div>
        </div>

        {/* Brand & Links */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl font-black text-white tracking-tight">
                Zapp<span className="text-orange-500">Kart</span>
              </span>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                v1.0.0 Full-Stack
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              © {new Date().getFullYear()} ZappKart Technologies India Pvt. Ltd. All rights reserved.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <button
              onClick={() => {
                const link = document.createElement('a');
                link.href = '/api/download-project-zip';
                link.download = 'zappkart-marketplace-source.zip';
                link.click();
              }}
              className="text-blue-400 hover:text-blue-300 flex items-center gap-1 font-bold"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Source Code (.ZIP)</span>
            </button>
            <span>•</span>
            <button
              onClick={() => handleOpenAuth('register-seller')}
              className="text-emerald-400 hover:text-emerald-300 font-bold"
            >
              Sell on ZappKart
            </button>
            <span>•</span>
            <button
              onClick={() => setCurrentView('admin')}
              className="text-amber-400 hover:text-amber-300 font-bold"
            >
              Super Admin Access
            </button>
          </div>
        </div>
      </footer>

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onSelectStore={handleSelectStore}
        onProceedToCheckout={() => setIsCheckoutModalOpen(true)}
      />

      {/* Slide-over Cart Drawer */}
      <CartDrawer
        onOpenCheckout={() => setIsCheckoutModalOpen(true)}
        onExploreProducts={() => {
          setCurrentView('home');
          setSearchQuery('');
        }}
      />

      {/* Multi-step Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutModalOpen}
        onClose={() => setIsCheckoutModalOpen(false)}
        onOrderSuccess={handleOrderSuccess}
      />

      {/* Notifications Drawer Modal */}
      <NotificationsModal
        isOpen={isNotificationsModalOpen}
        onClose={() => setIsNotificationsModalOpen(false)}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialTab={authModalTab}
      />

      {/* Mobile Responsive Bottom Navigation Bar */}
      <BottomNav
        currentView={currentView}
        setCurrentView={(view) => {
          if (view === 'categories') {
            setCurrentView('home');
          } else {
            setCurrentView(view);
          }
        }}
        onOpenAuthModal={() => handleOpenAuth('login')}
        isAuthenticated={!!user}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          <NotificationProvider>
            <MainApp />
          </NotificationProvider>
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  );
}
