import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, SellerProfile } from '../types';

interface AuthContextType {
  user: User | null;
  sellerProfile: SellerProfile | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: any) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  switchDemoAccount: (role: 'customer' | 'seller_tech' | 'seller_fashion' | 'seller_pending' | 'admin') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [sellerProfile, setSellerProfile] = useState<SellerProfile | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('zk_auth_token'));
  const [isLoading, setIsLoading] = useState(true);

  const fetchCurrentUser = async (authToken: string) => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setSellerProfile(data.sellerProfile || null);
      } else {
        // Token invalid or expired
        localStorage.removeItem('zk_auth_token');
        setToken(null);
        setUser(null);
        setSellerProfile(null);
      }
    } catch (err) {
      console.error('Failed to authenticate session:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchCurrentUser(token);
    } else {
      setIsLoading(false);
    }
  }, [token]);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Login failed' };
      }
      localStorage.setItem('zk_auth_token', data.token);
      setToken(data.token);
      setUser(data.user);
      setSellerProfile(data.sellerProfile || null);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  };

  const register = async (payload: any) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Registration failed' };
      }
      localStorage.setItem('zk_auth_token', data.token);
      setToken(data.token);
      setUser(data.user);
      setSellerProfile(data.sellerProfile || null);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  };

  const logout = () => {
    localStorage.removeItem('zk_auth_token');
    setToken(null);
    setUser(null);
    setSellerProfile(null);
  };

  const refreshUser = async () => {
    if (token) await fetchCurrentUser(token);
  };

  // Quick Account Switcher for Testing Different Persona Experiences
  const switchDemoAccount = async (role: 'customer' | 'seller_tech' | 'seller_fashion' | 'seller_pending' | 'admin') => {
    let email = 'customer@example.com';
    let password = 'CustomerPass123!';

    if (role === 'admin') {
      email = 'admin@zappkart.com';
      password = 'AdminSecurePassword123!';
    } else if (role === 'seller_tech') {
      email = 'nexus@techhub.in';
      password = 'SellerPass123!';
    } else if (role === 'seller_fashion') {
      email = 'care@urbanthreads.com';
      password = 'SellerPass123!';
    } else if (role === 'seller_pending') {
      email = 'organic@greenroots.in';
      password = 'SellerPass123!';
    }

    await login(email, password);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        sellerProfile,
        token,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
        switchDemoAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
