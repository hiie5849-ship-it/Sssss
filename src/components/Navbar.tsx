import React, { useState } from 'react';
import {
  ShoppingBag,
  Heart,
  User as UserIcon,
  Search,
  Bell,
  MapPin,
  Store,
  ShieldCheck,
  Download,
  LogOut,
  ChevronDown,
  Sparkles,
  Package,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useNotifications } from '../context/NotificationContext';

interface NavbarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onOpenAuthModal: () => void;
  onOpenNotifications: () => void;
  selectedStoreId?: string | null;
  setSelectedStoreId?: (id: string | null) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  setCurrentView,
  searchQuery,
  setSearchQuery,
  onOpenAuthModal,
  onOpenNotifications,
}) => {
  const { user, sellerProfile, logout, switchDemoAccount } = useAuth();
  const { cartCount, setIsCartOpen } = useCart();
  const { wishlistIds } = useWishlist();
  const { unreadCount } = useNotifications();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isDemoSwitchOpen, setIsDemoSwitchOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleDownloadZip = () => {
    setDownloading(true);
    const link = document.createElement('a');
    link.href = '/api/download-project-zip';
    link.download = 'zappkart-marketplace-source.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => setDownloading(false), 2000);
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      {/* Top Utility Persona & Notice Bar */}
      <div className="bg-slate-900 text-slate-300 text-xs px-4 py-1.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-amber-400 font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Multi-Vendor E-Commerce Platform</span>
          </span>
          <span className="hidden md:inline text-slate-500">|</span>
          <span className="hidden md:flex items-center gap-1 text-slate-300">
            <MapPin className="w-3 h-3 text-blue-400" />
            <span>Deliver to: <strong>Bengaluru 560038</strong></span>
          </span>
        </div>

        {/* Persona Switcher for Quick Evaluation */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setIsDemoSwitchOpen(!isDemoSwitchOpen)}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded text-xs transition border border-slate-700"
            >
              <span>Persona:</span>
              <span className="text-blue-400 font-semibold">
                {user ? `${user.name} (${user.role.toUpperCase()})` : 'Guest'}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isDemoSwitchOpen && (
              <div
                className="absolute right-0 mt-1.5 w-64 bg-slate-800 border border-slate-700 rounded-lg shadow-xl p-2 z-50 text-xs"
                onMouseLeave={() => setIsDemoSwitchOpen(false)}
              >
                <div className="text-slate-400 px-2 py-1 font-semibold border-b border-slate-700 mb-1">
                  Switch Active Role:
                </div>
                <button
                  onClick={() => { switchDemoAccount('customer'); setIsDemoSwitchOpen(false); }}
                  className="w-full text-left px-2.5 py-1.5 rounded hover:bg-slate-700 text-slate-200 flex items-center justify-between"
                >
                  <span>Rahul (Customer)</span>
                  <span className="text-[10px] bg-blue-900/60 text-blue-300 px-1.5 py-0.5 rounded">Buyer</span>
                </button>
                <button
                  onClick={() => { switchDemoAccount('seller_tech'); setIsDemoSwitchOpen(false); }}
                  className="w-full text-left px-2.5 py-1.5 rounded hover:bg-slate-700 text-slate-200 flex items-center justify-between"
                >
                  <span>Nexus Tech Store</span>
                  <span className="text-[10px] bg-emerald-900/60 text-emerald-300 px-1.5 py-0.5 rounded">Seller</span>
                </button>
                <button
                  onClick={() => { switchDemoAccount('seller_fashion'); setIsDemoSwitchOpen(false); }}
                  className="w-full text-left px-2.5 py-1.5 rounded hover:bg-slate-700 text-slate-200 flex items-center justify-between"
                >
                  <span>Urban Threads Studio</span>
                  <span className="text-[10px] bg-purple-900/60 text-purple-300 px-1.5 py-0.5 rounded">Seller</span>
                </button>
                <button
                  onClick={() => { switchDemoAccount('seller_pending'); setIsDemoSwitchOpen(false); }}
                  className="w-full text-left px-2.5 py-1.5 rounded hover:bg-slate-700 text-slate-200 flex items-center justify-between"
                >
                  <span>Green Roots (Pending)</span>
                  <span className="text-[10px] bg-amber-900/60 text-amber-300 px-1.5 py-0.5 rounded">Pending</span>
                </button>
                <button
                  onClick={() => { switchDemoAccount('admin'); setIsDemoSwitchOpen(false); }}
                  className="w-full text-left px-2.5 py-1.5 rounded hover:bg-slate-700 text-amber-300 font-semibold flex items-center justify-between"
                >
                  <span>Super Admin</span>
                  <span className="text-[10px] bg-red-900/60 text-red-300 px-1.5 py-0.5 rounded">Full Admin</span>
                </button>
              </div>
            )}
          </div>

          {/* Download ZIP Button */}
          <button
            onClick={handleDownloadZip}
            disabled={downloading}
            className="flex items-center gap-1 bg-blue-600 hover:bg-blue-500 text-white px-2.5 py-1 rounded text-xs font-medium transition cursor-pointer"
            title="Download full project source code as a ZIP archive"
          >
            <Download className="w-3 h-3" />
            <span>{downloading ? 'Preparing ZIP...' : 'Download ZIP'}</span>
          </button>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <div
            onClick={() => setCurrentView('home')}
            className="flex items-center gap-2 cursor-pointer select-none group shrink-0"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition transform">
              <span className="font-extrabold text-xl tracking-tight">Z</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-2xl font-black tracking-tight text-slate-900">
                  Zapp<span className="text-orange-600">Kart</span>
                </span>
                <span className="bg-orange-100 text-orange-700 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">
                  Verified
                </span>
              </div>
              <p className="text-[10px] font-medium text-slate-500 -mt-1 hidden sm:block">
                Multi-Vendor Marketplace
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-2xl relative">
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="Search for headphones, organic shirts, electronics, brands..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-100 focus:bg-white text-slate-900 pl-10 pr-10 py-2.5 rounded-full border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm transition"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 text-slate-400 hover:text-slate-600 text-xs font-bold bg-slate-200 rounded-full w-5 h-5 flex items-center justify-center"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Notifications */}
            <button
              onClick={onOpenNotifications}
              className="relative p-2 rounded-full text-slate-600 hover:text-blue-600 hover:bg-slate-100 transition"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-orange-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Wishlist */}
            <button
              onClick={() => setCurrentView('wishlist')}
              className="relative p-2 rounded-full text-slate-600 hover:text-rose-600 hover:bg-slate-100 transition"
              title="Wishlist"
            >
              <Heart className="w-5 h-5" />
              {wishlistIds.length > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {wishlistIds.length}
                </span>
              )}
            </button>

            {/* Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 px-3.5 py-2 rounded-full transition font-semibold text-sm border border-blue-200"
              title="Shopping Cart"
            >
              <div className="relative">
                <ShoppingBag className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-orange-600 text-white text-[11px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </div>
              <span className="hidden md:inline">Cart</span>
            </button>

            {/* Account / User Menu */}
            <div className="relative">
              {user ? (
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-1.5 text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 py-1.5 px-3 rounded-full text-sm font-medium transition"
                >
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden lg:inline truncate max-w-[100px]">{user.name.split(' ')[0]}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                </button>
              ) : (
                <button
                  onClick={onOpenAuthModal}
                  className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full text-sm font-semibold transition shadow-xs"
                >
                  <UserIcon className="w-4 h-4" />
                  <span>Sign In</span>
                </button>
              )}

              {/* User Dropdown */}
              {isUserMenuOpen && user && (
                <div
                  className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50 text-sm"
                  onMouseLeave={() => setIsUserMenuOpen(false)}
                >
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="font-semibold text-slate-900">{user.name}</p>
                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    <span className="inline-block mt-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                      {user.role}
                    </span>
                  </div>

                  <button
                    onClick={() => { setCurrentView('orders'); setIsUserMenuOpen(false); }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-700 flex items-center gap-2"
                  >
                    <Package className="w-4 h-4 text-blue-600" />
                    <span>My Orders & Tracking</span>
                  </button>

                  <button
                    onClick={() => { setCurrentView('addresses'); setIsUserMenuOpen(false); }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-700 flex items-center gap-2"
                  >
                    <MapPin className="w-4 h-4 text-slate-500" />
                    <span>Saved Addresses</span>
                  </button>

                  {/* Seller link */}
                  {user.role === 'seller' ? (
                    <button
                      onClick={() => { setCurrentView('seller'); setIsUserMenuOpen(false); }}
                      className="w-full text-left px-4 py-2 hover:bg-emerald-50 text-emerald-700 font-medium flex items-center gap-2"
                    >
                      <Store className="w-4 h-4 text-emerald-600" />
                      <span>Seller Dashboard</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => { setCurrentView('become-seller'); setIsUserMenuOpen(false); }}
                      className="w-full text-left px-4 py-2 hover:bg-emerald-50 text-emerald-700 font-medium flex items-center gap-2"
                    >
                      <Store className="w-4 h-4 text-emerald-600" />
                      <span>Become a Seller</span>
                    </button>
                  )}

                  {/* Admin link */}
                  {user.role === 'admin' && (
                    <button
                      onClick={() => { setCurrentView('admin'); setIsUserMenuOpen(false); }}
                      className="w-full text-left px-4 py-2 hover:bg-amber-50 text-amber-700 font-medium flex items-center gap-2"
                    >
                      <ShieldCheck className="w-4 h-4 text-amber-600" />
                      <span>Super Admin Panel</span>
                    </button>
                  )}

                  <div className="border-t border-slate-100 mt-1 pt-1">
                    <button
                      onClick={() => { logout(); setIsUserMenuOpen(false); }}
                      className="w-full text-left px-4 py-2 hover:bg-rose-50 text-rose-600 flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-6 overflow-x-auto py-2.5 text-xs font-semibold text-slate-600 border-t border-slate-100 scrollbar-none">
          <button
            onClick={() => { setCurrentView('home'); setSearchQuery(''); }}
            className={`whitespace-nowrap hover:text-blue-600 transition ${currentView === 'home' && !searchQuery ? 'text-blue-600 font-bold' : ''}`}
          >
            All Products
          </button>
          <button
            onClick={() => { setCurrentView('home'); setSearchQuery('electronics'); }}
            className="whitespace-nowrap hover:text-blue-600 transition"
          >
            Electronics
          </button>
          <button
            onClick={() => { setCurrentView('home'); setSearchQuery('fashion'); }}
            className="whitespace-nowrap hover:text-blue-600 transition"
          >
            Fashion & Apparel
          </button>
          <button
            onClick={() => { setCurrentView('home'); setSearchQuery('home'); }}
            className="whitespace-nowrap hover:text-blue-600 transition"
          >
            Home & Kitchen
          </button>
          <button
            onClick={() => { setCurrentView('home'); setSearchQuery('beauty'); }}
            className="whitespace-nowrap hover:text-blue-600 transition"
          >
            Beauty & Personal Care
          </button>
          <button
            onClick={() => { setCurrentView('home'); setSearchQuery('sports'); }}
            className="whitespace-nowrap hover:text-blue-600 transition"
          >
            Sports & Fitness
          </button>

          <div className="ml-auto flex items-center gap-4 shrink-0">
            <button
              onClick={() => setCurrentView('seller')}
              className="text-emerald-700 hover:text-emerald-800 flex items-center gap-1 font-bold"
            >
              <Store className="w-3.5 h-3.5" />
              <span>Seller Hub</span>
            </button>
            <button
              onClick={() => setCurrentView('admin')}
              className="text-purple-700 hover:text-purple-800 flex items-center gap-1 font-bold"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Super Admin</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
