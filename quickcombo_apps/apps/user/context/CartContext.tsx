'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface CartItem {
  id: string | number;
  name: string;
  price: number;
  quantity: number;
  image_url: string;
  is_veg: boolean;
  category_name?: string;
  unit?: string; // piece, kg, litre
  restaurant?: number | string;
  restaurant_name?: string;
}

export interface SpecialRequest {
  id: string;
  name: string;
  quantity: number;
  unit: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem, triggerAnim?: boolean) => void;
  removeItem: (id: string | number) => void;
  updateQuantity: (id: string | number, quantity: number) => void;
  clearCart: () => void;
  total: number;
  itemCount: number;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  flyItem: CartItem | null;
  setFlyItem: (item: CartItem | null) => void;
  // Special Requests
  specialRequests: SpecialRequest[];
  addSpecialRequest: (req: SpecialRequest) => void;
  removeSpecialRequest: (id: string) => void;
  clearSpecialRequests: () => void;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [flyItem, setFlyItem] = useState<CartItem | null>(null);
  const [specialRequests, setSpecialRequests] = useState<SpecialRequest[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('qc_cart');
    if (saved) setItems(JSON.parse(saved));
    const savedReqs = localStorage.getItem('qc_special_requests');
    if (savedReqs) setSpecialRequests(JSON.parse(savedReqs));
  }, []);

  useEffect(() => {
    localStorage.setItem('qc_cart', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem('qc_special_requests', JSON.stringify(specialRequests));
  }, [specialRequests]);

  const addItem = (item: CartItem) => {
    const newItem = { ...item, quantity: item.quantity || 1, unit: item.unit || 'piece' };
    setItems(prev => {
      const existing = prev.find(i => i.id === newItem.id);
      if (existing) {
        return prev.map(i => i.id === newItem.id
          ? { ...i, quantity: i.quantity + (newItem.quantity || 1) }
          : i
        );
      }
      return [...prev, newItem];
    });
    setFlyItem(newItem);
    setTimeout(() => setFlyItem(null), 700);
  };

  const removeItem = (id: string | number) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const updateQuantity = (id: string | number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }
    setItems(prev => prev.map(i => i.id === id ? { ...i, quantity } : i));
  };

  const clearCart = () => setItems([]);

  const addSpecialRequest = (req: SpecialRequest) => {
    setSpecialRequests(prev => [...prev, req]);
  };

  const removeSpecialRequest = (id: string) => {
    setSpecialRequests(prev => prev.filter(r => r.id !== id));
  };

  const clearSpecialRequests = () => setSpecialRequests([]);

  const total = items.reduce((acc, i) => acc + (parseFloat(i.price as any) || 0) * (i.quantity || 1), 0);
  const itemCount = items.reduce((acc, i) => acc + i.quantity, 0);

  return (
    <CartContext.Provider value={{
      items, addItem, removeItem, updateQuantity, clearCart,
      total, itemCount, isOpen, setIsOpen, flyItem, setFlyItem,
      specialRequests, addSpecialRequest, removeSpecialRequest, clearSpecialRequests,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
