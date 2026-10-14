import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem } from '../types';
import { useAuth } from './AuthContext';

interface CartContextType {
  items: CartItem[];
  cartCount: number;
  cartSubtotal: number;
  isLoading: boolean;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  addToCart: (productId: string, quantity?: number) => Promise<{ success: boolean; error?: string }>;
  updateQuantity: (productId: string, quantity: number) => Promise<{ success: boolean; error?: string }>;
  removeItem: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, token } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const fetchCart = async () => {
    if (!token) {
      setItems([]);
      return;
    }
    try {
      setIsLoading(true);
      const res = await fetch('/api/cart', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      }
    } catch (err) {
      console.error('Error fetching cart:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [token, user]);

  const addToCart = async (productId: string, quantity: number = 1) => {
    if (!token) {
      return { success: false, error: 'Please sign in or select a demo customer to add items to your cart.' };
    }
    try {
      const res = await fetch('/api/cart/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId, quantity }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to add item to cart' };
      }
      await fetchCart();
      setIsCartOpen(true);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    if (!token) return { success: false, error: 'Not authenticated' };
    try {
      const res = await fetch('/api/cart/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId, quantity }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to update quantity' };
      }
      await fetchCart();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const removeItem = async (productId: string) => {
    if (!token) return;
    try {
      await fetch(`/api/cart/item/${productId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchCart();
    } catch (err) {
      console.error('Failed to remove cart item:', err);
    }
  };

  const clearCart = async () => {
    if (!token) return;
    try {
      await fetch('/api/cart/clear', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setItems([]);
    } catch (err) {
      console.error('Failed to clear cart:', err);
    }
  };

  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = items.reduce((sum, item) => sum + item.salePrice * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        cartCount,
        cartSubtotal,
        isLoading,
        isCartOpen,
        setIsCartOpen,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        refreshCart: fetchCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
