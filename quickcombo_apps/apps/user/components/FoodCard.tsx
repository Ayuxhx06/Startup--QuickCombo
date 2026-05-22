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

const API = process.env.NEXT_PUBLIC_API_URL || 'https://quickcombo.alwaysdata.net';

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
    <div className="flex justify-between items-start p-5 border-b border-white/5 bg-black/40 hover:bg-white/[0.03] transition-all group relative">
      {/* Content Left */}
      <div className="flex-1 min-w-0 pr-6">
        <div className="flex items-center gap-2 mb-2">
          <div className={`veg-badge ${item.is_veg ? 'veg' : 'non-veg'} scale-[0.8] -ml-1`} />
          {item.is_featured && (
            <span className="flex items-center gap-1 text-[10px] font-black text-amber-500 uppercase tracking-tighter bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
              <Star size={10} fill="currentColor" /> Bestseller
            </span>
          )}
        </div>
        
        <h3 className="font-extrabold text-[17px] text-white leading-tight mb-1 group-hover:text-green-500 transition-colors">
          {item.name}
        </h3>
        
        <div className="flex items-center gap-2 mb-2">
          <span className="font-black text-[15px] text-white/90 tracking-tight italic">₹{item.price}</span>
        </div>
        
        <p className="text-[#909090] text-[13px] leading-relaxed line-clamp-2 font-medium">
          {item.description || 'Deliciously prepared with fresh ingredients and authentic flavors.'}
        </p>
      </div>

      {/* Image & Action Right */}
      <div className="relative shrink-0 flex flex-col items-center">
        {item.image_url ? (
            <div className="w-[120px] h-[120px] relative rounded-2xl overflow-hidden shadow-2xl border border-white/5 group-hover:border-green-500/30 transition-all">
                <img 
                    src={(item.image_url && item.image_url.startsWith('http')) ? item.image_url : `${API}${item.image_url || ''}`} 
                    alt={item.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
        ) : (
            <div className="w-[120px] h-[120px] rounded-2xl bg-white/5 flex items-center justify-center border border-dashed border-white/10">
                <Zap size={24} className="text-white/10" />
            </div>
        )}

        {/* Overlapping ADD Button */}
        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-[90%]">
          {qty > 0 ? (
            <div className="flex items-center justify-between bg-[#111] border border-green-500/40 rounded-xl px-2 py-2 shadow-[0_8px_16px_rgba(0,0,0,0.5)] backdrop-blur-md">
              <button onClick={handleRemove} className="text-green-500 font-black px-1.5 hover:scale-125 transition-transform"><Minus size={14} strokeWidth={4} /></button>
              <span className="text-green-500 text-sm font-black">{qty}</span>
              <button onClick={handleAdd} className="text-green-500 font-black px-1.5 hover:scale-125 transition-transform"><Plus size={14} strokeWidth={4} /></button>
            </div>
          ) : (
            <button
              onClick={handleAdd}
              className="bg-white text-green-600 hover:bg-green-50 hover:text-green-700 font-black text-sm px-4 py-2.5 rounded-xl transition-all shadow-[0_8px_16px_rgba(0,0,0,0.4)] border border-green-200/50 flex items-center justify-center gap-1.5 w-full uppercase tracking-tighter"
            >
              ADD
            </button>
          )}
        </div>
      </div>
    </div>

  );
}
