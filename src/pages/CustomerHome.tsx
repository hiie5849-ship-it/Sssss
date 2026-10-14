import React, { useState, useEffect } from 'react';
import {
  SlidersHorizontal,
  Star,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Tag,
  Zap,
} from 'lucide-react';
import { Product, Category } from '../types';
import { ProductCard } from '../components/ProductCard';

interface CustomerHomeProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onSelectProduct: (product: Product) => void;
  onSelectStore: (sellerId: string) => void;
}

export const CustomerHome: React.FC<CustomerHomeProps> = ({
  searchQuery,
  setSearchQuery,
  onSelectProduct,
  onSelectStore,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(50000);
  const [minRating, setMinRating] = useState<number>(0);
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<string>('newest');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Hero banner index
  const [activeBanner, setActiveBanner] = useState(0);

  const banners = [
    {
      id: 'b1',
      title: 'Mega Multi-Vendor Electronics Festival',
      subtitle: 'Up to 40% Off on Sony, Apple, and Anker Audio & Gear',
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1400&q=80',
      tag: 'Verified Merchant Deals',
      category: 'electronics',
    },
    {
      id: 'b2',
      title: 'Urban Threads Linen & Streetwear Collection',
      subtitle: 'Artisanal organic linen and raw selvedge denim straight from independent ateliers',
      image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1400&q=80',
      tag: 'Trending Direct-To-Consumer',
      category: 'fashion',
    }
  ];

  // Fetch Categories
  useEffect(() => {
    fetch('/api/products/categories')
      .then(res => res.json())
      .then(data => setCategories(data.categories || []))
      .catch(err => console.error('Error fetching categories:', err));
  }, []);

  // Fetch Products based on search & filters
  useEffect(() => {
    const fetchFilteredProducts = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (searchQuery) params.append('q', searchQuery);
        if (selectedCategory && selectedCategory !== 'all') params.append('category', selectedCategory);
        if (minPrice > 0) params.append('minPrice', minPrice.toString());
        if (maxPrice < 50000) params.append('maxPrice', maxPrice.toString());
        if (minRating > 0) params.append('minRating', minRating.toString());
        if (inStockOnly) params.append('inStock', 'true');
        if (sortBy) params.append('sortBy', sortBy);

        const res = await fetch(`/api/products?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setProducts(data.products || []);
        }
      } catch (err) {
        console.error('Error loading products:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFilteredProducts();
  }, [searchQuery, selectedCategory, minPrice, maxPrice, minRating, inStockOnly, sortBy]);

  const resetFilters = () => {
    setSelectedCategory('all');
    setMinPrice(0);
    setMaxPrice(50000);
    setMinRating(0);
    setInStockOnly(false);
    setSortBy('newest');
    setSearchQuery('');
  };

  return (
    <div className="pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pt-4">
      {/* Hero Promotional Banner Slider */}
      {!searchQuery && selectedCategory === 'all' && (
        <div className="relative rounded-3xl overflow-hidden shadow-xl bg-slate-900 h-64 sm:h-80 md:h-96">
          <img
            src={banners[activeBanner].image}
            alt={banners[activeBanner].title}
            className="w-full h-full object-cover object-center opacity-70 transition-opacity duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent flex flex-col justify-end p-6 sm:p-10">
            <div className="max-w-xl">
              <span className="inline-flex items-center gap-1.5 bg-orange-600 text-white font-extrabold text-[11px] px-3 py-1 rounded-full uppercase tracking-wider mb-2">
                <Zap className="w-3.5 h-3.5" />
                <span>{banners[activeBanner].tag}</span>
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white leading-tight mb-2">
                {banners[activeBanner].title}
              </h2>
              <p className="text-slate-200 text-xs sm:text-sm line-clamp-2 mb-4 font-medium">
                {banners[activeBanner].subtitle}
              </p>
              <button
                onClick={() => setSelectedCategory(banners[activeBanner].category)}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm py-2.5 px-6 rounded-full flex items-center gap-2 shadow-lg transition cursor-pointer"
              >
                <span>Shop Deals</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Banner Navigation Dots */}
          <div className="absolute bottom-4 right-6 flex items-center gap-2">
            {banners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveBanner(idx)}
                className={`w-2.5 h-2.5 rounded-full transition ${
                  activeBanner === idx ? 'bg-orange-500 w-6' : 'bg-white/60'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Category Pills Slider */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <span>Popular Categories</span>
          </h3>
          {selectedCategory !== 'all' && (
            <button
              onClick={() => setSelectedCategory('all')}
              className="text-xs font-bold text-blue-600 hover:underline"
            >
              Clear Category Filter
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(selectedCategory === cat.slug ? 'all' : cat.slug)}
              className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition cursor-pointer ${
                selectedCategory === cat.slug
                  ? 'border-blue-600 bg-blue-50/70 shadow-md ring-2 ring-blue-100'
                  : 'border-slate-200 hover:border-slate-300 bg-white shadow-xs'
              }`}
            >
              <img
                src={cat.image}
                alt={cat.name}
                className="w-11 h-11 rounded-xl object-cover bg-slate-100 shrink-0"
              />
              <div className="truncate">
                <span className="font-bold text-xs text-slate-900 block truncate">{cat.name}</span>
                <span className="text-[10px] text-slate-500 truncate block">{cat.description}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Catalog with Responsive Sidebar Filter Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 pt-2">
        {/* Desktop Filter Sidebar */}
        <aside className="hidden lg:block lg:col-span-1 space-y-6 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs h-fit sticky top-28">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-blue-600" />
              <span>Filter Catalog</span>
            </h4>
            <button
              onClick={resetFilters}
              className="text-[11px] text-slate-500 hover:text-blue-600 font-semibold"
            >
              Reset
            </button>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">Sort Results</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500"
            >
              <option value="newest">Newest Arrivals</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
              <option value="popular">Most Popular</option>
            </select>
          </div>

          {/* Price Range Slider */}
          <div>
            <div className="flex justify-between items-center text-xs font-bold text-slate-700 mb-2">
              <span>Max Price</span>
              <span className="text-blue-600">₹{maxPrice.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min="500"
              max="50000"
              step="500"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-medium mt-1">
              <span>₹500</span>
              <span>₹50,000</span>
            </div>
          </div>

          {/* Rating Filter */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">Customer Rating</label>
            <div className="space-y-1.5 text-xs">
              {[4, 3, 2].map((r) => (
                <label
                  key={r}
                  className="flex items-center gap-2 text-slate-700 cursor-pointer hover:text-blue-600"
                >
                  <input
                    type="radio"
                    name="rating_filter"
                    checked={minRating === r}
                    onChange={() => setMinRating(minRating === r ? 0 : r)}
                    className="accent-blue-600"
                  />
                  <div className="flex items-center gap-1">
                    <span className="font-semibold">{r}★ & above</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* In Stock Toggle */}
          <div className="pt-2 border-t border-slate-100">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 accent-blue-600"
              />
              <span>In Stock Only</span>
            </label>
          </div>

          {/* Security Guarantee Badge */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-[11px] text-slate-500 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>ZappKart Assurance</span>
            </div>
            <p className="leading-tight">All products are shipped from Super-Admin approved merchants with genuine warranty.</p>
          </div>
        </aside>

        {/* Product Grid Area */}
        <main className="lg:col-span-3">
          {/* Active Search & Filter Chips Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-500">
                {products.length} {products.length === 1 ? 'Product found' : 'Products found'}
              </span>

              {searchQuery && (
                <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                  Query: "{searchQuery}"
                  <button onClick={() => setSearchQuery('')} className="hover:text-blue-900 ml-1">✕</button>
                </span>
              )}

              {selectedCategory !== 'all' && (
                <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-800 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                  Category: {selectedCategory}
                  <button onClick={() => setSelectedCategory('all')} className="hover:text-slate-900 ml-1">✕</button>
                </span>
              )}
            </div>

            {/* Mobile Filter Button */}
            <button
              onClick={() => setIsMobileFilterOpen(true)}
              className="lg:hidden flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-3 py-1.5 rounded-xl transition"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
              <span>Filters</span>
            </button>
          </div>

          {/* Loading Indicator */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-80 bg-slate-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : products.length === 0 ? (
            /* Empty State */
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-xs">
              <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
                <Tag className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-1">No products match your criteria</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mb-6">
                Try widening your search keywords, increasing the max price, or exploring our popular categories.
              </p>
              <button
                onClick={resetFilters}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 px-6 rounded-full transition shadow-md"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            /* Real Product Grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onSelectProduct={onSelectProduct}
                  onSelectStore={onSelectStore}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Mobile Filter Drawer / Bottom Sheet */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden lg:hidden animate-fadeIn">
          <div onClick={() => setIsMobileFilterOpen(false)} className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs" />
          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-xs bg-white shadow-2xl p-6 flex flex-col justify-between">
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <h4 className="font-bold text-slate-900 text-sm">Filters & Sorting</h4>
                  <button onClick={() => setIsMobileFilterOpen(false)} className="text-slate-500 font-bold">✕</button>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Sort</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full bg-slate-100 rounded-xl p-2.5 text-xs font-semibold"
                  >
                    <option value="newest">Newest</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                    <option value="rating">Highest Rated</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Max Price: ₹{maxPrice}</label>
                  <input
                    type="range"
                    min="500"
                    max="50000"
                    step="500"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    className="w-full accent-blue-600"
                  />
                </div>

                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={(e) => setInStockOnly(e.target.checked)}
                    className="w-4 h-4 accent-blue-600"
                  />
                  <span>In Stock Only</span>
                </label>
              </div>

              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-3 rounded-xl shadow-md"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
