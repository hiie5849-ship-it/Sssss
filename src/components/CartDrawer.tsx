import React from 'react';
import { X, Trash2, ShoppingBag, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { useCart } from '../context/CartContext';

interface CartDrawerProps {
  onOpenCheckout: () => void;
  onExploreProducts: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  onOpenCheckout,
  onExploreProducts,
}) => {
  const { items, isCartOpen, setIsCartOpen, updateQuantity, removeItem, clearCart, cartSubtotal, cartCount } = useCart();

  if (!isCartOpen) return null;

  const freeShippingThreshold = 999;
  const progressToFreeShipping = Math.min(100, Math.round((cartSubtotal / freeShippingThreshold) * 100));
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - cartSubtotal);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-fadeIn">
      {/* Backdrop */}
      <div
        onClick={() => setIsCartOpen(false)}
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
      />

      {/* Drawer Panel */}
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 text-lg">Your Cart</h2>
                <p className="text-xs text-slate-500">{cartCount} {cartCount === 1 ? 'item' : 'items'} ready for checkout</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {items.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-xs text-slate-500 hover:text-rose-600 font-medium px-2 py-1 rounded hover:bg-slate-200/60 transition"
                >
                  Clear All
                </button>
              )}
              <button
                onClick={() => setIsCartOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-200/70 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Free Shipping Meter */}
          <div className="bg-blue-50/60 px-4 py-2.5 border-b border-blue-100 text-xs">
            {remainingForFreeShipping > 0 ? (
              <p className="text-slate-700 mb-1.5 flex items-center justify-between">
                <span>Add <strong>₹{remainingForFreeShipping.toLocaleString()}</strong> more for <strong>FREE Delivery</strong></span>
                <span className="font-bold text-blue-600">{progressToFreeShipping}%</span>
              </p>
            ) : (
              <p className="text-emerald-700 font-bold mb-1.5 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>You've unlocked FREE Delivery on this order!</span>
              </p>
            )}
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${remainingForFreeShipping === 0 ? 'bg-emerald-500' : 'bg-blue-600'}`}
                style={{ width: `${progressToFreeShipping}%` }}
              />
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6">
                <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-4">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-slate-800 text-base mb-1">Your cart is empty</h3>
                <p className="text-xs text-slate-500 mb-6 max-w-xs">
                  Discover top electronics, authentic designer apparel, and home essentials from verified merchants.
                </p>
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    onExploreProducts();
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 px-6 rounded-full transition shadow-md"
                >
                  Explore Catalog
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.productId}
                  className="flex gap-3.5 p-3.5 rounded-2xl border border-slate-200 bg-white shadow-xs hover:border-slate-300 transition"
                >
                  <img
                    src={item.images[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=200&q=80'}
                    alt={item.title}
                    className="w-20 h-20 rounded-xl object-cover bg-slate-100 shrink-0 border border-slate-100"
                  />

                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-1">
                        <h4 className="font-semibold text-slate-900 text-xs line-clamp-2">
                          {item.title}
                        </h4>
                        <button
                          onClick={() => removeItem(item.productId)}
                          className="text-slate-400 hover:text-rose-600 p-1 transition"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">Sold by: {item.storeName}</p>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-bold text-sm text-slate-900">
                          ₹{(item.salePrice * item.quantity).toLocaleString()}
                        </span>
                        {item.quantity > 1 && (
                          <span className="text-[10px] text-slate-400">
                            (₹{item.salePrice.toLocaleString()} each)
                          </span>
                        )}
                      </div>

                      {/* Quantity Controller */}
                      <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden bg-white text-xs">
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="px-2 py-0.5 hover:bg-slate-100 text-slate-700 font-bold"
                        >
                          -
                        </button>
                        <span className="px-2.5 py-0.5 font-bold text-slate-900">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          disabled={item.quantity >= item.stock}
                          className="px-2 py-0.5 hover:bg-slate-100 text-slate-700 font-bold disabled:opacity-40"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Drawer Footer / Checkout Action */}
          {items.length > 0 && (
            <div className="p-4 sm:p-6 border-t border-slate-200 bg-slate-50 space-y-3">
              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-900">₹{cartSubtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated Shipping</span>
                  <span className="font-semibold text-emerald-600">
                    {cartSubtotal >= freeShippingThreshold ? 'FREE' : '₹79'}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
                <div>
                  <span className="text-xs text-slate-500 block">Total Payable</span>
                  <span className="text-xl font-black text-slate-900">
                    ₹{(cartSubtotal + (cartSubtotal >= freeShippingThreshold ? 0 : 79)).toLocaleString()}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 font-medium">Taxes calculated at checkout</span>
              </div>

              <button
                onClick={() => {
                  setIsCartOpen(false);
                  onOpenCheckout();
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 active:scale-98 transition cursor-pointer"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500 font-medium pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>100% Safe & Secure Transactions</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
