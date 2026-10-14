import React, { useState, useEffect } from 'react';
import { Store, Star, ShieldCheck, MapPin, Package, ArrowLeft } from 'lucide-react';
import { Product } from '../types';
import { ProductCard } from '../components/ProductCard';

interface SellerStorePageProps {
  sellerId: string;
  onBack: () => void;
  onSelectProduct: (product: Product) => void;
}

export const SellerStorePage: React.FC<SellerStorePageProps> = ({
  sellerId,
  onBack,
  onSelectProduct,
}) => {
  const [storeData, setStoreData] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    fetch(`/api/sellers/store/${sellerId}`)
      .then(res => res.json())
      .then(data => {
        setStoreData(data.store);
        setProducts(data.products || []);
      })
      .catch(err => console.error(err))
      .finally(() => setIsLoading(false));
  }, [sellerId]);

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 text-center text-xs text-slate-500">
        Loading merchant storefront...
      </div>
    );
  }

  if (!storeData) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <h3 className="font-bold text-slate-900 text-lg mb-2">Store Not Found</h3>
        <p className="text-xs text-slate-500 mb-4">This merchant store may have been deactivated or renamed.</p>
        <button onClick={onBack} className="text-blue-600 font-bold text-xs hover:underline">
          ← Return to Marketplace
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-8">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-blue-600 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to All Products</span>
      </button>

      {/* Store Banner & Brand Header */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        {/* Banner */}
        <div className="h-44 sm:h-64 bg-slate-900 relative">
          <img
            src={storeData.storeBanner || 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80'}
            alt=""
            className="w-full h-full object-cover opacity-80"
          />
        </div>

        {/* Store Profile Card */}
        <div className="p-6 relative -mt-12 sm:-mt-16 flex flex-wrap items-end justify-between gap-4">
          <div className="flex items-end gap-4">
            <img
              src={storeData.storeLogo || 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=200&q=80'}
              alt={storeData.storeName}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover bg-white p-1 border-4 border-white shadow-xl"
            />
            <div className="mb-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900">{storeData.storeName}</h1>
                <span title="Verified Super-Admin Merchant">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                </span>
              </div>
              <p className="text-xs text-slate-500 max-w-lg mt-1 line-clamp-2">{storeData.storeDescription}</p>
            </div>
          </div>

          {/* Stats Badges */}
          <div className="flex items-center gap-3 text-xs">
            <div className="bg-amber-50 text-amber-800 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1 border border-amber-200">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span>{storeData.rating.toFixed(1)} / 5.0 Rating</span>
            </div>
            <div className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1 border border-blue-200">
              <Package className="w-4 h-4" />
              <span>{products.length} Products</span>
            </div>
          </div>
        </div>
      </div>

      {/* Merchant Products Catalog */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black text-slate-900">
            Products from {storeData.storeName}
          </h2>
          <span className="text-xs text-slate-500">{products.length} Items Listed</span>
        </div>

        {products.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
            <p className="text-xs text-slate-500">This seller has not published products yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onSelectProduct={onSelectProduct}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
