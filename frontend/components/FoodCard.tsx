'use client';
import { motion } from 'framer-motion';
import { Plus, Minus, Star, Clock, Zap } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import toast from 'react-hot-toast';

interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  is_veg: boolean;
  rating: number;
  prep_time: number;
  category_name: string;
  is_featured: boolean;
  restaurant?: number | string;
  restaurant_name?: string;
}

export default function FoodCard({ item }: { item: MenuItem }) {
  const { items, addItem, removeItem } = useCart();
  
  const cartItem = items.find(i => i.id === item.id);
  const qty = cartItem ? cartItem.quantity : 0;

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    addItem({ ...item, quantity: 1, category_name: item.category_name, restaurant: item.restaurant, restaurant_name: item.restaurant_name });
    if (qty === 0) toast.success(`${item.name} added!`, { icon: '🛒', duration: 1500 });
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeItem(item.id);
  };

  return (
    <div className="flex justify-between items-start p-4 border-b border-white/5 bg-black/40 hover:bg-white/[0.02] transition-colors group">
      {/* Content Left */}
      <div className="flex-1 min-w-0 pr-4">
        <div className="flex items-center gap-2 mb-1">
          <div className={`veg-badge ${item.is_veg ? 'veg' : 'non-veg'} scale-75 -ml-1`} />
          <h3 className="font-extrabold text-[16px] text-white leading-tight group-hover:text-green-500 transition-colors">
            {item.name}
          </h3>
        </div>
        
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          <span className="font-black text-sm text-white/90 tracking-tight">₹{item.price}</span>
        </div>
        
        <p className="text-[#808080] text-[12.5px] leading-relaxed line-clamp-1 group-hover:line-clamp-none transition-all">
          {item.description || 'Deliciously prepared with fresh ingredients.'}
        </p>
      </div>

      {/* Action Right */}
      <div className="flex flex-col items-center gap-1 shrink-0 pt-0.5">
        {qty > 0 ? (
          <div className="flex items-center justify-between bg-green-500/10 border border-green-500/40 rounded-xl px-2 py-1.5 w-[90px] shadow-lg backdrop-blur-md">
            <button onClick={handleRemove} className="text-green-500 font-black px-1.5 hover:scale-125 transition-transform"><Minus size={14} strokeWidth={3} /></button>
            <span className="text-white text-sm font-bold">{qty}</span>
            <button onClick={handleAdd} className="text-green-500 font-black px-1.5 hover:scale-125 transition-transform"><Plus size={14} strokeWidth={3} /></button>
          </div>
        ) : (
          <button
            onClick={handleAdd}
            className="bg-white/5 hover:bg-green-500/10 border border-white/10 hover:border-green-500/50 text-white hover:text-green-500 font-black text-xs px-4 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 min-w-[80px]"
          >
            ADD <Plus size={14} strokeWidth={3} />
          </button>
        )}
      </div>
    </div>
  );
}
