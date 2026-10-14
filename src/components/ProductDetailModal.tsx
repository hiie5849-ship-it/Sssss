import React, { useState } from 'react';
import {
  X,
  Star,
  Heart,
  ShoppingBag,
  Store,
  ShieldCheck,
  Truck,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Send,
} from 'lucide-react';
import { Product, Review } from '../types';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onSelectStore: (sellerId: string) => void;
  onProceedToCheckout?: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onSelectStore,
  onProceedToCheckout,
}) => {
  if (!product) return null;

  const { addToCart, setIsCartOpen } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { user, token } = useAuth();

  const [selectedImage, setSelectedImage] = useState(product.images[0] || '');
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'details' | 'reviews'>('details');
  const [pincode, setPincode] = useState('560038');
  const [pincodeChecked, setPincodeChecked] = useState(true);

  // Review state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newReviewTitle, setNewReviewTitle] = useState('');
  const [newReviewComment, setNewReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewMsg, setReviewMsg] = useState<string | null>(null);

  const [isAdding, setIsAdding] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const discountPercent = product.price > product.salePrice
    ? Math.round(((product.price - product.salePrice) / product.price) * 100)
    : 0;

  const isFav = isWishlisted(product.id);
  const isOutOfStock = product.stock <= 0;

  // Load reviews when tab clicked
  const handleTabChange = async (tab: 'details' | 'reviews') => {
    setActiveTab(tab);
    if (tab === 'reviews' && reviews.length === 0) {
      setIsLoadingReviews(true);
      try {
        const res = await fetch(`/api/products/${product.id}`);
        if (res.ok) {
          const data = await res.json();
          setReviews(data.reviews || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoadingReviews(false);
      }
    }
  };

  const handleAddToCart = async () => {
    if (isOutOfStock) return;
    setIsAdding(true);
    setErrorMsg(null);
    const res = await addToCart(product.id, quantity);
    setIsAdding(false);
    if (res.success) {
      setIsCartOpen(true);
    } else {
      setErrorMsg(res.error || 'Failed');
    }
  };

  const handleBuyNow = async () => {
    if (isOutOfStock) return;
    await addToCart(product.id, quantity);
    onClose();
    if (onProceedToCheckout) {
      onProceedToCheckout();
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setReviewMsg('Please sign in as a customer to submit a review.');
      return;
    }
    if (!newReviewComment.trim()) {
      setReviewMsg('Please write a review comment.');
      return;
    }

    setIsSubmittingReview(true);
    setReviewMsg(null);

    try {
      const res = await fetch(`/api/products/${product.id}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          rating: newRating,
          title: newReviewTitle || 'Verified Customer Review',
          comment: newReviewComment,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setReviews([data.review, ...reviews]);
        setNewReviewTitle('');
        setNewReviewComment('');
        setReviewMsg('Review posted successfully!');
        setTimeout(() => setReviewMsg(null), 3000);
      } else {
        setReviewMsg(data.error || 'Failed to post review.');
      }
    } catch (err: any) {
      setReviewMsg(err.message || 'Network error');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="relative bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col border border-slate-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Scroll Content */}
        <div className="overflow-y-auto flex-1 p-6 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left: Image Gallery */}
            <div>
              <div className="aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 relative mb-4">
                <img
                  src={selectedImage || product.images[0]}
                  alt={product.title}
                  className="w-full h-full object-cover object-center"
                />
                {discountPercent > 0 && (
                  <span className="absolute top-3 left-3 bg-rose-600 text-white font-extrabold text-xs px-2.5 py-1 rounded-full shadow-md">
                    {discountPercent}% OFF
                  </span>
                )}
              </div>

              {/* Thumbnails */}
              {product.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {product.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(img)}
                      className={`w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition ${
                        selectedImage === img ? 'border-blue-600 ring-2 ring-blue-100' : 'border-slate-200 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Seller Information Card */}
              <div
                onClick={() => {
                  onClose();
                  onSelectStore(product.sellerId);
                }}
                className="mt-6 p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-blue-300 transition cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                    <Store className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-slate-900">{product.storeName}</span>
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    </div>
                    <p className="text-xs text-slate-500">Verified Marketplace Seller</p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-blue-600 hover:underline">
                  Visit Store →
                </span>
              </div>
            </div>

            {/* Right: Details & Purchase */}
            <div className="flex flex-col">
              {/* Category & SKU */}
              <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                <span className="bg-slate-100 px-2.5 py-1 rounded-full font-medium">
                  {product.categoryName}
                </span>
                <span>SKU: {product.sku}</span>
              </div>

              {/* Title */}
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 mb-3 leading-snug">
                {product.title}
              </h1>

              {/* Rating */}
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center gap-1 bg-amber-50 text-amber-800 px-2 py-0.5 rounded-md text-xs font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{product.rating.toFixed(1)}</span>
                </div>
                <span className="text-xs text-slate-500">({product.numReviews} customer ratings)</span>
                <span className="text-slate-300">|</span>
                <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> In Stock & Ready to Ship
                </span>
              </div>

              {/* Price */}
              <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 mb-6">
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-black text-slate-900">
                    ₹{product.salePrice.toLocaleString()}
                  </span>
                  {product.price > product.salePrice && (
                    <span className="text-base text-slate-400 line-through">
                      ₹{product.price.toLocaleString()}
                    </span>
                  )}
                  {discountPercent > 0 && (
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                      Save ₹{(product.price - product.salePrice).toLocaleString()}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1">Inclusive of all taxes & marketplace warranties.</p>
              </div>

              {/* Stock Status & Quantity Selector */}
              <div className="flex items-center gap-4 mb-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Quantity</label>
                  <div className="flex items-center border border-slate-300 rounded-xl overflow-hidden bg-white">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1 || isOutOfStock}
                      className="px-3 py-1.5 hover:bg-slate-100 text-slate-600 font-bold disabled:opacity-40"
                    >
                      -
                    </button>
                    <span className="px-4 py-1.5 font-bold text-sm text-slate-900">{quantity}</span>
                    <button
                      onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                      disabled={quantity >= product.stock || isOutOfStock}
                      className="px-3 py-1.5 hover:bg-slate-100 text-slate-600 font-bold disabled:opacity-40"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="text-xs">
                  <label className="block font-semibold text-slate-600 mb-1">Availability</label>
                  {isOutOfStock ? (
                    <span className="text-rose-600 font-bold">Currently Sold Out</span>
                  ) : product.stock <= 5 ? (
                    <span className="text-amber-600 font-bold">Hurry, only {product.stock} units left!</span>
                  ) : (
                    <span className="text-emerald-600 font-semibold">{product.stock} units in warehouse</span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 mb-6">
                <button
                  onClick={handleAddToCart}
                  disabled={isOutOfStock || isAdding}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition active:scale-98"
                >
                  <ShoppingBag className="w-5 h-5" />
                  <span>{isAdding ? 'Adding...' : 'Add to Cart'}</span>
                </button>

                <button
                  onClick={handleBuyNow}
                  disabled={isOutOfStock}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 disabled:bg-slate-200 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-orange-600/20 transition active:scale-98"
                >
                  <span>Buy Now</span>
                </button>

                <button
                  onClick={() => toggleWishlist(product.id)}
                  className="p-3 rounded-xl border border-slate-300 hover:border-rose-400 text-slate-700 hover:text-rose-600 transition"
                  title="Save to Wishlist"
                >
                  <Heart className={`w-5 h-5 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`} />
                </button>
              </div>

              {errorMsg && (
                <div className="mb-4 p-2.5 rounded-lg bg-rose-50 text-rose-700 text-xs flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Delivery Estimation Box */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-medium text-slate-800">
                    <Truck className="w-4 h-4 text-blue-600" />
                    <span>Estimated Delivery to {pincode}:</span>
                  </div>
                  <span className="font-bold text-emerald-700">2 - 4 Business Days</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <RotateCcw className="w-4 h-4 text-orange-600" />
                  <span>7 Days Return Window for unused items</span>
                </div>
              </div>

              {/* Tab Selector: Description vs Reviews */}
              <div className="flex border-b border-slate-200 mb-4">
                <button
                  onClick={() => handleTabChange('details')}
                  className={`pb-2 px-3 text-sm font-semibold transition ${
                    activeTab === 'details'
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Description & Specs
                </button>
                <button
                  onClick={() => handleTabChange('reviews')}
                  className={`pb-2 px-3 text-sm font-semibold transition flex items-center gap-1 ${
                    activeTab === 'reviews'
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <span>Customer Reviews</span>
                  <span className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full">
                    {product.numReviews}
                  </span>
                </button>
              </div>

              {/* Tab Content: Details */}
              {activeTab === 'details' && (
                <div className="space-y-4 text-sm text-slate-700">
                  <p className="leading-relaxed whitespace-pre-line">{product.description}</p>
                  {product.attributes && Object.keys(product.attributes).length > 0 && (
                    <div className="pt-2">
                      <h4 className="font-semibold text-slate-900 mb-2">Specifications</h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {Object.entries(product.attributes).map(([key, val]) => (
                          <div key={key} className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                            <span className="text-slate-400 block">{key}</span>
                            <span className="font-medium text-slate-800">{val}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab Content: Reviews */}
              {activeTab === 'reviews' && (
                <div className="space-y-6">
                  {/* Write a Review */}
                  <form onSubmit={handleSubmitReview} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                    <h4 className="font-bold text-slate-900 text-sm mb-2 flex items-center gap-1">
                      <MessageSquare className="w-4 h-4 text-blue-600" />
                      <span>Write a Verified Customer Review</span>
                    </h4>

                    {/* Star selector */}
                    <div className="flex items-center gap-1 mb-3">
                      <span className="text-slate-600 font-medium mr-2">Your Rating:</span>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          type="button"
                          key={star}
                          onClick={() => setNewRating(star)}
                          className="p-1 hover:scale-110 transition"
                        >
                          <Star
                            className={`w-5 h-5 ${
                              star <= newRating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                            }`}
                          />
                        </button>
                      ))}
                    </div>

                    <input
                      type="text"
                      placeholder="Headline or summary (e.g., Outstanding quality!)"
                      value={newReviewTitle}
                      onChange={(e) => setNewReviewTitle(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs mb-2 outline-none focus:border-blue-500"
                    />

                    <textarea
                      placeholder="Share your detailed experience with this product and delivery..."
                      rows={3}
                      value={newReviewComment}
                      onChange={(e) => setNewReviewComment(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs mb-3 outline-none focus:border-blue-500"
                    />

                    {reviewMsg && (
                      <div className="mb-2 text-xs font-semibold text-blue-700">
                        {reviewMsg}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isSubmittingReview}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-1.5 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isSubmittingReview ? 'Submitting...' : 'Post Review'}</span>
                    </button>
                  </form>

                  {/* Reviews List */}
                  {isLoadingReviews ? (
                    <div className="py-6 text-center text-xs text-slate-500">Loading verified reviews...</div>
                  ) : reviews.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-500">
                      No customer reviews yet. Be the first to share your experience!
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {reviews.map((rev) => (
                        <div key={rev.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-slate-900">{rev.customerName}</span>
                            <div className="flex items-center gap-0.5">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-3 h-3 ${
                                    i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <p className="font-semibold text-slate-800 mb-1">{rev.title}</p>
                          <p className="text-slate-600 leading-relaxed">{rev.comment}</p>
                          <span className="text-[10px] text-slate-400 mt-2 block">
                            {new Date(rev.createdAt).toLocaleDateString()} • Verified Buyer
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
