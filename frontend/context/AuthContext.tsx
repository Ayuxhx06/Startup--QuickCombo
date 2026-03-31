'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://quickcombo.alwaysdata.net';

interface User {
  id: number;
  email: string;
  name: string;
  phone: string;
}

interface AuthContextType {
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
  isLoggedIn: boolean;
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;
  sendOtp: (email: string) => Promise<{success: boolean; error?: string}>;
  verifyOtp: (email: string, otp: string, name?: string, phone?: string) => Promise<{success: boolean; error?: string}>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    const saved = Cookies.get('qc_user');
    if (saved) {
      try { setUser(JSON.parse(saved)); } catch {}
    }
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    Cookies.set('qc_user', JSON.stringify(userData), { expires: 30 });
    setShowAuthModal(false);
  };

  const logout = () => {
    setUser(null);
    Cookies.remove('qc_user');
  };

  const sendOtp = async (email: string): Promise<{success: boolean; error?: string}> => {
    try {
      await axios.post(`${API}/api/auth/send-otp/`, { email });
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.response?.data?.error || 'Failed to send OTP' };
    }
  };

  const verifyOtp = async (email: string, otp: string, name = '', phone = ''): Promise<{success: boolean; error?: string}> => {
    try {
      const res = await axios.post(`${API}/api/auth/verify-otp/`, { email, otp, name, phone });
      login(res.data.user);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.response?.data?.error || 'Invalid OTP' };
    }
  };

  return (
    <AuthContext.Provider value={{
      user, login, logout, isLoggedIn: !!user,
      showAuthModal, setShowAuthModal, sendOtp, verifyOtp
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
