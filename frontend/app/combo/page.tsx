'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useCart } from '@/context/CartContext';
import { Zap, Plus, Check, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

interface MenuItem {
  id: number; name: string; description: string; price: number;
  image_url: string; is_veg: boolean; category_name: string;
}

export default function ComboBuilder() {
  const { addItem, setIsOpen } = useCart();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    axios.get(`${API}/api/menu/?combo=1`)
      .then(r => { setItems(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const toggleSelect = (id: number) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const selectedItems = items.filter(i => selectedIds.has(i.id));
  const subtotal = selectedItems.reduce((acc, i) => acc + i.price, 0);

  // Apply 15% discount for 3+ items
  const discount = selectedItems.length >= 3 ? Math.floor(subtotal * 0.15) : 0;
  const total = subtotal - discount;

  const handleAddCombo = () => {
    if (selectedItems.length < 2) {
      toast.error('Select at least 2 items for a combo');
      return;
    }
    
    // Add items individually but with combo context
    selectedItems.forEach(item => {
      addItem({
        id: item.id,
        name: `${item.name} (Combo Part)`,
        price: Math.floor(item.price * (1 - (discount / (subtotal || 1)))), // Distribute discount
        quantity: 1,
        image_url: item.image_url,
        is_veg: item.is_veg,
        category_name: item.category_name
      });
    });
    
    toast.success('Awesome combo added! ✨', { icon: '⚡' });
    setSelectedIds(new Set());
    setIsOpen(true);
  };

  // Group items by category for the builder
  const groupedItems = items.reduce((acc, item) => {
    const cat = item.category_name || 'Other';
    acc[cat] = acc[cat] ? [...acc[cat], item] : [item];
    return acc;
  }, {} as Record<string, MenuItem[]>);

  return (
    <div className="page-wrapper max-w-lg mx-auto pb-32">
      <div className="bg-green-500/10 border-b border-green-500/20 px-4 pt-6 pb-5 sticky top-14 z-20 backdrop-blur-md">
        <h1 className="text-2xl font-black flex items-center gap-2 mb-2">
          <Zap className="text-green-400 fill-green-400" /> Combo Builder
        </h1>
        <p className="text-gray-400 text-sm">Select 3+ items to unlock a 15% discount instantly.</p>
        
        {/* Progress Bar */}
        <div className="h-1.5 bg-black/50 rounded-full mt-4 overflow-hidden">
          <motion.div 
            className="h-full bg-green-500"
            animate={{ width: `${Math.min((selectedIds.size / 3) * 100, 100)}%` }}
            transition={{ type: 'spring' }}
          />
        </div>
      </div>

      <div className="px-4 py-6 space-y-8">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <div key={i}>
              <div className="h-6 w-32 shimmer rounded-md mb-3" />
              <div className="grid grid-cols-2 gap-3">
                <div className="h-40 shimmer rounded-xl" />
                <div className="h-40 shimmer rounded-xl" />
              </div>
            </div>
          ))
        ) : (
          Object.entries(groupedItems).map(([cat, catItems]) => (
            <div key={cat}>
              <h2 className="font-bold text-lg mb-3">{cat}</h2>
              <div className="grid grid-cols-2 gap-3">
                {catItems.map(item => {
                  const isSelected = selectedIds.has(item.id);
                  return (
                    <motion.div
                      key={item.id}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => toggleSelect(item.id)}
                      className={`relative flex flex-col p-2.5 rounded-2xl border-2 transition-all cursor-pointer overflow-hidden ${
                        isSelected ? 'border-green-500 bg-green-500/10' : 'border-white/5 glass hover:border-white/20'
                      }`}
                    >
                      <div className="w-full h-24 rounded-xl overflow-hidden mb-2 bg-black/50 relative">
                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                        <AnimatePresence>
                          {isSelected && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.5 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.5 }}
                              className="absolute inset-0 bg-green-500/30 backdrop-blur-[2px] flex items-center justify-center"
                            >
                              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-black shadow-lg">
                                <Check size={18} strokeWidth={3} />
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      <h3 className="font-bold text-sm leading-tight flex-1 mb-1">{item.name}</h3>
                      <div className="flex items-center justify-between mt-auto">
                        <span className="font-bold text-green-400">₹{item.price}</span>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          isSelected ? 'bg-green-500 text-black' : 'bg-white/10'
                        }`}>
                          {isSelected ? <Check size={12} strokeWidth={3} /> : <Plus size={12} />}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Floating Combo Summary Action */}
      <AnimatePresence>
        {selectedItems.length > 0 && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-16 left-0 right-0 p-4 z-40 max-w-lg mx-auto"
          >
            <div className="glass-green border border-green-500/30 rounded-2xl p-4 shadow-2xl shadow-green-500/20">
              <div className="flex justify-between items-end mb-3 text-sm">
                <div>
                  <div className="text-gray-300 font-medium">
                    {selectedItems.length} items selected
                  </div>
                  {discount > 0 && (
                    <div className="text-green-400 font-bold mt-0.5 flex items-center gap-1">
                      <Zap size={14} /> ₹{discount} Combo Discount Applied
                    </div>
                  )}
                </div>
                <div className="text-right">
                  {discount > 0 && <div className="text-gray-500 line-through text-xs">₹{subtotal}</div>}
                  <div className="font-black text-2xl text-white">₹{total}</div>
                </div>
              </div>
              
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleAddCombo}
                disabled={selectedItems.length < 2}
                className={`w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                  selectedItems.length < 2 
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                    : 'bg-green-500 text-black shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:bg-green-400'
                }`}
              >
                {selectedItems.length < 2 ? 'Select 1 more item' : 'Add Combo to Cart'}
                {selectedItems.length >= 2 && <ArrowRight size={18} />}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
