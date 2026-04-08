'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import toast from 'react-hot-toast';

export interface CartItem {
  id: string | number;
  name: string;
  price: number;
  quantity: number;
  image_url: string;
  is_veg: boolean;
  category_name?: string;
  unit?: string; // piece, kg, litre
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
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [flyItem, setFlyItem] = useState<CartItem | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('qc_cart');
    if (saved) setItems(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('qc_cart', JSON.stringify(items));
  }, [items]);

  const addItem = (item: CartItem) => {
    const newItem = { ...item, quantity: item.quantity || 1, unit: item.unit || 'piece' };
    setItems(prev => {
      // For manual items, we might have multiple entries with same name but different units
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

  const total = items.reduce((acc, i) => acc + (parseFloat(i.price as any) || 0) * (i.quantity || 1), 0);
  const itemCount = items.reduce((acc, i) => acc + i.quantity, 0);

  return (
    <CartContext.Provider value={{
      items, addItem, removeItem, updateQuantity, clearCart,
      total, itemCount, isOpen, setIsOpen, flyItem, setFlyItem
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
