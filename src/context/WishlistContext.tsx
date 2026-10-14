import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product } from '../types';
import { useAuth } from './AuthContext';

interface WishlistContextType {
  wishlistIds: string[];
  wishlistProducts: Product[];
  isWishlisted: (productId: string) => boolean;
  toggleWishlist: (productId: string) => Promise<void>;
  isLoading: boolean;
  refreshWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, user } = useAuth();
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [wishlistProducts, setWishlistProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchWishlist = async () => {
    if (!token) {
      setWishlistIds([]);
      setWishlistProducts([]);
      return;
    }
    try {
      setIsLoading(true);
      const res = await fetch('/api/wishlist', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setWishlistIds(data.productIds || []);
        setWishlistProducts(data.wishlist || []);
      }
    } catch (err) {
      console.error('Error fetching wishlist:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, [token, user]);

  const toggleWishlist = async (productId: string) => {
    if (!token) {
      alert('Please sign in to save items to your wishlist.');
      return;
    }
    try {
      const res = await fetch('/api/wishlist/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId }),
      });
      if (res.ok) {
        const data = await res.json();
        setWishlistIds(data.productIds || []);
        await fetchWishlist();
      }
    } catch (err) {
      console.error('Error toggling wishlist:', err);
    }
  };

  const isWishlisted = (productId: string) => wishlistIds.includes(productId);

  return (
    <WishlistContext.Provider
      value={{
        wishlistIds,
        wishlistProducts,
        isWishlisted,
        toggleWishlist,
        isLoading,
        refreshWishlist: fetchWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) throw new Error('useWishlist must be used within a WishlistProvider');
  return context;
};
