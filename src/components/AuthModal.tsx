import React, { useState } from 'react';
import { X, Lock, Mail, User, Store, ShieldCheck, AlertCircle, ArrowRight, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'login' | 'register-customer' | 'register-seller';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'login',
}) => {
  if (!isOpen) return null;

  const { login, register, switchDemoAccount } = useAuth();

  const [tab, setTab] = useState<'login' | 'register-customer' | 'register-seller' | 'recover'>(initialTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  // Seller specific
  const [storeName, setStoreName] = useState('');
  const [storeDescription, setStoreDescription] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [gstin, setGstin] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [recoveryNotice, setRecoveryNotice] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    setRecoveryNotice(null);

    if (tab === 'login') {
      const res = await login(email, password);
      setIsLoading(false);
      if (res.success) {
        onClose();
      } else {
        setErrorMessage(res.error || 'Login failed');
      }
    } else if (tab === 'recover') {
      try {
        const res = await fetch('/api/auth/recover-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        const data = await res.json();
        setIsLoading(false);
        setRecoveryNotice(data.message || 'Recovery email sent');
      } catch (err: any) {
        setIsLoading(false);
        setErrorMessage(err.message || 'Network error');
      }
    } else {
      // Register
      const isSeller = tab === 'register-seller';
      const payload: any = {
        name,
        email,
        password,
        phone,
        role: isSeller ? 'seller' : 'customer',
      };
      if (isSeller) {
        payload.sellerInfo = {
          storeName,
          storeDescription,
          businessAddress,
          gstin,
        };
      }

      const res = await register(payload);
      setIsLoading(false);
      if (res.success) {
        onClose();
      } else {
        setErrorMessage(res.error || 'Registration failed');
      }
    }
  };

  const handleQuickLogin = async (role: any) => {
    setIsLoading(true);
    await switchDemoAccount(role);
    setIsLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="relative bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="font-extrabold text-slate-900 text-lg">
              {tab === 'login' && 'Sign in to ZappKart'}
              {tab === 'register-customer' && 'Create Customer Account'}
              {tab === 'register-seller' && 'Register Merchant Store'}
              {tab === 'recover' && 'Password Recovery'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {tab === 'login' && 'Access your orders, addresses, and wishlist'}
              {tab === 'register-customer' && 'Shop across thousands of verified multi-vendor brands'}
              {tab === 'register-seller' && 'Sell your products to millions of active buyers'}
              {tab === 'recover' && 'Enter your email to receive self-service instructions'}
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200/70 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Buttons */}
        {tab !== 'recover' && (
          <div className="flex border-b border-slate-100 bg-slate-100/60 p-1 text-xs font-bold text-slate-600">
            <button
              onClick={() => { setTab('login'); setErrorMessage(null); }}
              className={`flex-1 py-2 rounded-xl transition ${tab === 'login' ? 'bg-white text-blue-600 shadow-xs' : 'hover:text-slate-900'}`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setTab('register-customer'); setErrorMessage(null); }}
              className={`flex-1 py-2 rounded-xl transition ${tab === 'register-customer' ? 'bg-white text-blue-600 shadow-xs' : 'hover:text-slate-900'}`}
            >
              Customer Signup
            </button>
            <button
              onClick={() => { setTab('register-seller'); setErrorMessage(null); }}
              className={`flex-1 py-2 rounded-xl transition ${tab === 'register-seller' ? 'bg-white text-emerald-600 shadow-xs' : 'hover:text-slate-900'}`}
            >
              Seller Signup
            </button>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-3.5 text-xs">
          {tab !== 'login' && tab !== 'recover' && (
            <div>
              <label className="block text-slate-700 font-bold mb-1">Your Full Name</label>
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus-within:border-blue-500 focus-within:bg-white transition">
                <User className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Arun Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-transparent outline-none text-slate-900 text-xs font-medium"
                />
              </div>
            </div>
          )}

          {tab === 'register-seller' && (
            <>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Store / Business Name</label>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus-within:border-emerald-500 focus-within:bg-white transition">
                  <Store className="w-4 h-4 text-emerald-600" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Royal Heritage Handicrafts"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    className="w-full bg-transparent outline-none text-slate-900 text-xs font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Business Description</label>
                <textarea
                  rows={2}
                  placeholder="Tell customers about the products your store crafts or distributes..."
                  value={storeDescription}
                  onChange={(e) => setStoreDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 outline-none focus:border-emerald-500 focus:bg-white text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">GSTIN (Optional)</label>
                  <input
                    type="text"
                    placeholder="29ABCDE1234F1Z5"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value.toUpperCase())}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 outline-none focus:border-emerald-500 text-xs uppercase"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">City / Region</label>
                  <input
                    type="text"
                    placeholder="Mumbai, MH"
                    value={businessAddress}
                    onChange={(e) => setBusinessAddress(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 outline-none focus:border-emerald-500 text-xs"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-slate-700 font-bold mb-1">Email Address</label>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus-within:border-blue-500 focus-within:bg-white transition">
              <Mail className="w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent outline-none text-slate-900 text-xs font-medium"
              />
            </div>
          </div>

          {tab !== 'recover' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-slate-700 font-bold">Password</label>
                {tab === 'login' && (
                  <button
                    type="button"
                    onClick={() => { setTab('recover'); setErrorMessage(null); }}
                    className="text-[11px] text-blue-600 hover:underline font-semibold"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus-within:border-blue-500 focus-within:bg-white transition">
                <Lock className="w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent outline-none text-slate-900 text-xs font-medium"
                />
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {recoveryNotice && (
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{recoveryNotice}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full font-bold text-xs py-3 rounded-xl text-white transition flex items-center justify-center gap-1.5 shadow-md active:scale-98 cursor-pointer ${
              tab === 'register-seller' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            <span>{isLoading ? 'Processing...' : (tab === 'login' ? 'Sign In' : (tab === 'recover' ? 'Send Reset Link' : 'Create Account'))}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          {tab === 'recover' && (
            <button
              type="button"
              onClick={() => setTab('login')}
              className="w-full text-center text-xs font-semibold text-slate-600 hover:underline"
            >
              Back to Sign In
            </button>
          )}
        </form>

        {/* 1-Click Quick Persona Demo Logins for Fast Verification */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            Instant 1-Click Persona Testing:
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleQuickLogin('customer')}
              className="text-left p-2 rounded-xl border border-slate-200 bg-white hover:border-blue-400 transition"
            >
              <span className="font-bold text-slate-900 block">Rahul Sharma</span>
              <span className="text-[10px] text-blue-600 font-semibold">Customer (Buyer)</span>
            </button>

            <button
              onClick={() => handleQuickLogin('seller_tech')}
              className="text-left p-2 rounded-xl border border-slate-200 bg-white hover:border-emerald-400 transition"
            >
              <span className="font-bold text-slate-900 block truncate">Nexus Tech</span>
              <span className="text-[10px] text-emerald-600 font-semibold">Approved Seller</span>
            </button>

            <button
              onClick={() => handleQuickLogin('seller_fashion')}
              className="text-left p-2 rounded-xl border border-slate-200 bg-white hover:border-purple-400 transition"
            >
              <span className="font-bold text-slate-900 block truncate">Urban Threads</span>
              <span className="text-[10px] text-purple-600 font-semibold">Fashion Seller</span>
            </button>

            <button
              onClick={() => handleQuickLogin('admin')}
              className="text-left p-2 rounded-xl border border-amber-300 bg-amber-50/50 hover:bg-amber-50 transition"
            >
              <span className="font-bold text-slate-900 block">Super Admin</span>
              <span className="text-[10px] text-amber-700 font-semibold">Full Marketplace Admin</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
