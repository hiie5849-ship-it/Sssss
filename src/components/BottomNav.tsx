import React from 'react';
import { Home, Grid, Heart, Package, ShoppingBag, User } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

interface BottomNavProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  onOpenAuthModal: () => void;
  isAuthenticated: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentView,
  setCurrentView,
  onOpenAuthModal,
  isAuthenticated,
}) => {
  const { cartCount, setIsCartOpen } = useCart();
  const { wishlistIds } = useWishlist();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 px-2 py-1.5 flex items-center justify-around shadow-lg">
      <button
        onClick={() => setCurrentView('home')}
        className={`flex flex-col items-center justify-center p-1 text-xs font-medium ${
          currentView === 'home' ? 'text-blue-600 font-bold' : 'text-slate-600'
        }`}
      >
        <Home className="w-5 h-5 mb-0.5" />
        <span>Home</span>
      </button>

      <button
        onClick={() => setCurrentView('categories')}
        className={`flex flex-col items-center justify-center p-1 text-xs font-medium ${
          currentView === 'categories' ? 'text-blue-600 font-bold' : 'text-slate-600'
        }`}
      >
        <Grid className="w-5 h-5 mb-0.5" />
        <span>Categories</span>
      </button>

      <button
        onClick={() => setCurrentView('orders')}
        className={`flex flex-col items-center justify-center p-1 text-xs font-medium ${
          currentView === 'orders' ? 'text-blue-600 font-bold' : 'text-slate-600'
        }`}
      >
        <Package className="w-5 h-5 mb-0.5" />
        <span>Orders</span>
      </button>

      <button
        onClick={() => setCurrentView('wishlist')}
        className={`relative flex flex-col items-center justify-center p-1 text-xs font-medium ${
          currentView === 'wishlist' ? 'text-blue-600 font-bold' : 'text-slate-600'
        }`}
      >
        <Heart className="w-5 h-5 mb-0.5" />
        {wishlistIds.length > 0 && (
          <span className="absolute 1 top-0 right-2 w-3.5 h-3.5 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
            {wishlistIds.length}
          </span>
        )}
        <span>Wishlist</span>
      </button>

      <button
        onClick={() => setIsCartOpen(true)}
        className="relative flex flex-col items-center justify-center p-1 text-xs font-medium text-slate-600"
      >
        <ShoppingBag className="w-5 h-5 mb-0.5" />
        {cartCount > 0 && (
          <span className="absolute top-0 right-2 w-3.5 h-3.5 bg-orange-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
            {cartCount}
          </span>
        )}
        <span>Cart</span>
      </button>
    </div>
  );
};
