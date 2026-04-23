'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useCart } from '@/context/CartContext';
import { Zap, Plus, Check, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://quickcombo.alwaysdata.net';

interface MenuItem {
  id: number; name: string; description: string; price: number;
  image_url: string; is_veg: boolean; category_name: string;
}

interface PredefinedCombo {
  id: number;
  name: string;
  description: string;
  items: MenuItem[];
  price: number;
  image_url: string;
}

export default function ComboBuilder() {
  const { addItem, setIsOpen } = useCart();
  const [combos, setCombos] = useState<PredefinedCombo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/api/combos/`)
      .then(r => {
        setCombos(r.data);
        setLoading(false);
      }).catch(() => setLoading(false));
  }, []);

  const handleAddPredefined = (combo: PredefinedCombo) => {
    const itemPrice = Math.floor(combo.price / combo.items.length);
    const remainder = combo.price - (itemPrice * combo.items.length);

    combo.items.forEach((item, idx) => {
      addItem({
        id: item.id,
        name: `${item.name} (${combo.name})`,
        price: idx === 0 ? itemPrice + remainder : itemPrice,
        quantity: 1,
        image_url: item.image_url,
        is_veg: item.is_veg,
        category_name: item.category_name
      });
    });

    toast.success(`${combo.name} added! 🥳`, { icon: '🎁' });
    setIsOpen(true);
  };

  return (
    <div className="page-wrapper max-w-lg mx-auto pb-32">
      <div className="bg-green-500/10 border-b border-green-500/20 px-4 pt-6 pb-5 sticky top-14 z-20 backdrop-blur-md">
        <h1 className="text-2xl font-black flex items-center gap-2 mb-2">
          <Zap className="text-green-400 fill-green-400" /> Explore Combos
        </h1>
        <p className="text-gray-400 text-sm">Hand-picked combinations for your best experience.</p>
      </div>

      <div className="px-4 py-6">
        {loading ? (
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-48 shimmer rounded-3xl" />
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {combos.length === 0 ? (
              <div className="text-center py-20 opacity-50">
                <div className="text-5xl mb-4">📦</div>
                <p className="font-bold uppercase tracking-widest text-xs">No predefined combos yet</p>
                <p className="text-[10px] mt-2">Add them from the admin panel</p>
              </div>
            ) : (
              combos.map((combo) => (
                <motion.div 
                  key={combo.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass rounded-[32px] overflow-hidden border border-white/10 hover:border-green-500/30 transition-all group"
                >
                  <div className="h-40 relative">
                    <img 
                      src={combo.image_url || combo.items[0]?.image_url} 
                      alt={combo.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                      <div>
                        <h3 className="font-black text-xl text-white">{combo.name}</h3>
                        <p className="text-gray-300 text-xs">{combo.items.length} items included</p>
                      </div>
                      <div className="bg-green-500 text-black font-black px-3 py-1 rounded-full text-lg shadow-lg">
                        ₹{combo.price}
                      </div>
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="flex flex-wrap gap-2 mb-4">
                      {combo.items.map(item => (
                        <span key={item.id} className="text-[10px] font-bold bg-white/5 border border-white/10 px-2 py-1 rounded-md text-gray-400 uppercase">
                          {item.name}
                        </span>
                      ))}
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleAddPredefined(combo)}
                      className="w-full btn-primary py-3 rounded-2xl font-black flex items-center justify-center gap-2 text-sm"
                    >
                      ADD TO CART <Plus size={18} />
                    </motion.button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
