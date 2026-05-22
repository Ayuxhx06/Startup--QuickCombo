'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, ChevronRight, Zap, Star } from 'lucide-react';
import { useEffect, useState } from 'react';
import FoodCard from './FoodCard';

interface MenuItem {
  id: number; name: string; description: string; price: number;
  image_url: string; is_veg: boolean; rating: number; prep_time: number;
  category_name: string; is_featured: boolean;
}

interface MenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurantName: string;
  items: MenuItem[];
}

export default function MenuModal({ isOpen, onClose, restaurantName, items }: MenuModalProps) {
  const [activeCategory, setActiveCategory] = useState('All');
  
  // Group items by category
  const categories = ['All', ...Array.from(new Set(items.map(i => i.category_name)))];
  
  const filteredItems = activeCategory === 'All' 
    ? items 
    : items.filter(i => i.category_name === activeCategory);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between sticky top-0 bg-black/50 z-10">
          <div>
            <h2 className="text-2xl font-black italic uppercase tracking-tighter text-green-500">{restaurantName}</h2>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1">Digital Menu Card</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-3 px-6 py-4 overflow-x-auto no-scrollbar border-b border-white/5 sticky top-[88px] bg-black/50 z-10">
          {categories.map(cat => (
            <button 
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap border ${
                activeCategory === cat ? 'bg-green-500 text-black border-green-500' : 'bg-white/5 text-gray-400 border-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Menu Items */}
        <div className="flex-1 overflow-y-auto px-4 pb-20 custom-scrollbar">
          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 opacity-30">
               <Zap size={48} className="mb-4" />
               <p className="font-black uppercase tracking-widest text-sm">No items in this category</p>
            </div>
          ) : (
            <div className="space-y-4 py-6">
              {filteredItems.map(item => (
                <FoodCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-4 text-center border-t border-white/5 bg-black/50">
           <p className="text-[10px] text-gray-600 font-black tracking-[0.3em] uppercase">QuickCombo • Digital Experience</p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
