import React, { useState } from 'react';
import { Star, Heart, ShoppingBag, Store, Check, AlertCircle } from 'lucide-react';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

interface ProductCardProps {
  product: Product;
  onSelectProduct: (product: Product) => void;
  onSelectStore?: (sellerId: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onSelectProduct,
  onSelectStore,
}) => {
  const { addToCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const discountPercent = product.price > product.salePrice
    ? Math.round(((product.price - product.salePrice) / product.price) * 100)
    : 0;

  const isFav = isWishlisted(product.id);
  const isOutOfStock = product.stock <= 0;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock) return;
    setIsAdding(true);
    setErrorMsg(null);
    const res = await addToCart(product.id, 1);
    setIsAdding(false);
    if (res.success) {
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 1800);
    } else {
      setErrorMsg(res.error || 'Failed');
      setTimeout(() => setErrorMsg(null), 2500);
    }
  };

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleWishlist(product.id);
  };

  return (
    <div
      onClick={() => onSelectProduct(product)}
      className="group bg-white rounded-2xl border border-slate-200/80 hover:border-blue-400 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col cursor-pointer relative"
    >
      {/* Product Image Frame */}
      <div className="relative aspect-square w-full overflow-hidden bg-slate-100">
        <img
          src={product.images[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80'}
          alt={product.title}
          loading="lazy"
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
        />

        {/* Discount Badge */}
        {discountPercent > 0 && (
          <div className="absolute top-2.5 left-2.5 bg-rose-600 text-white font-extrabold text-[11px] px-2 py-0.5 rounded-full shadow-xs">
            {discountPercent}% OFF
          </div>
        )}

        {/* Wishlist Button */}
        <button
          onClick={handleWishlistClick}
          className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-slate-700 hover:text-rose-600 flex items-center justify-center shadow-md transition"
          title={isFav ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart className={`w-4 h-4 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`} />
        </button>

        {/* Out of Stock Overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center">
            <span className="bg-rose-600 text-white font-bold text-xs px-3 py-1.5 rounded-full uppercase tracking-wider shadow-lg">
              Out of Stock
            </span>
          </div>
        )}

        {/* Low Stock Warning */}
        {!isOutOfStock && product.stock <= 5 && (
          <div className="absolute bottom-2 left-2 bg-amber-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-xs">
            Only {product.stock} left!
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Seller Store Tag */}
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
            <span
              onClick={(e) => {
                if (onSelectStore) {
                  e.stopPropagation();
                  onSelectStore(product.sellerId);
                }
              }}
              className="flex items-center gap-1 hover:text-blue-600 font-medium truncate max-w-[160px]"
            >
              <Store className="w-3 h-3 text-slate-400" />
              <span className="truncate">{product.storeName}</span>
            </span>

            {/* Rating */}
            <div className="flex items-center gap-1 bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded text-[11px] font-bold">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span>{product.rating.toFixed(1)}</span>
              <span className="text-slate-400 font-normal">({product.numReviews})</span>
            </div>
          </div>

          {/* Title */}
          <h3 className="font-semibold text-slate-900 text-sm line-clamp-2 group-hover:text-blue-600 transition mb-2">
            {product.title}
          </h3>
        </div>

        {/* Price & Action Button */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 mt-auto">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-black text-slate-900">
                ₹{product.salePrice.toLocaleString()}
              </span>
              {product.price > product.salePrice && (
                <span className="text-xs text-slate-400 line-through">
                  ₹{product.price.toLocaleString()}
                </span>
              )}
            </div>
            <span className="text-[10px] text-emerald-600 font-semibold">Free Delivery eligible</span>
          </div>

          {/* Add to Cart */}
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock || isAdding}
            className={`p-2.5 rounded-xl transition flex items-center justify-center shrink-0 ${
              justAdded
                ? 'bg-emerald-600 text-white'
                : isOutOfStock
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 active:scale-95'
            }`}
            title="Add to Cart"
          >
            {justAdded ? (
              <Check className="w-4 h-4" />
            ) : isAdding ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <ShoppingBag className="w-4 h-4" />
            )}
          </button>
        </div>

        {errorMsg && (
          <div className="mt-2 text-[11px] text-rose-600 font-medium flex items-center gap-1">
            <AlertCircle className="w-3 h-3 shrink-0" />
            <span className="truncate">{errorMsg}</span>
          </div>
        )}
      </div>
    </div>
  );
};
