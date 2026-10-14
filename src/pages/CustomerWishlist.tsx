import React from 'react';
import { Heart, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { Product } from '../types';

interface CustomerWishlistProps {
  onSelectProduct: (product: Product) => void;
  onExplore: () => void;
}

export const CustomerWishlist: React.FC<CustomerWishlistProps> = ({
  onSelectProduct,
  onExplore,
}) => {
  const { wishlistProducts, toggleWishlist, isLoading } = useWishlist();
  const { addToCart, setIsCartOpen } = useCart();

  const handleMoveToCart = async (product: Product) => {
    await addToCart(product.id, 1);
    await toggleWishlist(product.id);
    setIsCartOpen(true);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900">My Wishlist</h1>
          <p className="text-xs text-slate-500 mt-1">Saved items you love. Purchase whenever ready.</p>
        </div>
        <span className="text-xs font-bold bg-rose-100 text-rose-700 px-3 py-1 rounded-full">
          {wishlistProducts.length} Saved
        </span>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-64 bg-slate-100 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : wishlistProducts.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-xs">
          <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-slate-900 text-base mb-1">Your wishlist is empty</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-6">
            Click the heart icon on any product in our marketplace to save it here for later.
          </p>
          <button
            onClick={onExplore}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 px-6 rounded-full shadow-md transition"
          >
            Explore Catalog
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {wishlistProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between"
            >
              <div
                onClick={() => onSelectProduct(product)}
                className="cursor-pointer aspect-square bg-slate-100 overflow-hidden relative"
              >
                <img
                  src={product.images[0]}
                  alt={product.title}
                  className="w-full h-full object-cover hover:scale-105 transition duration-500"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleWishlist(product.id);
                  }}
                  className="absolute top-3 right-3 p-2 bg-white/90 hover:bg-white text-rose-500 rounded-full shadow-sm"
                  title="Remove from wishlist"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 block">{product.storeName}</span>
                  <h4
                    onClick={() => onSelectProduct(product)}
                    className="font-bold text-sm text-slate-900 line-clamp-2 hover:text-blue-600 transition cursor-pointer mb-2"
                  >
                    {product.title}
                  </h4>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-base font-black text-slate-900">
                      ₹{product.salePrice.toLocaleString()}
                    </span>
                    {product.price > product.salePrice && (
                      <span className="text-xs text-slate-400 line-through block">
                        ₹{product.price.toLocaleString()}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleMoveToCart(product)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Move to Cart</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
