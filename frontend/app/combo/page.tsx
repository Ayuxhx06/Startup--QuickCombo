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
  restaurant_name: string;
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
        <h1 className="text-3xl font-black flex items-center gap-3 mb-2 italic">
          <Zap className="text-green-400 fill-green-400 w-8 h-8" /> CURATED BUNDLES
        </h1>
        <p className="text-gray-400 text-sm font-medium uppercase tracking-widest">Hand-picked combinations for your best experience.</p>
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
                  className="bg-[#0a0a0a] rounded-[32px] overflow-hidden border border-white/5 hover:border-green-500/20 transition-all group relative"
                >
                  <div className="h-56 relative overflow-hidden">
                    <img 
                      src={combo.image_url || combo.items[0]?.image_url} 
                      alt={combo.name} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-80" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/40 to-transparent" />
                    
                    <div className="absolute top-4 right-4">
                      <div className="bg-green-500 text-black font-black px-4 py-2 rounded-2xl text-xl shadow-[0_10px_20px_rgba(34,197,94,0.3)] rotate-2">
                        ₹{combo.price}
                      </div>
                    </div>

                    <div className="absolute bottom-4 left-6 right-6">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-black bg-green-500/20 text-green-400 px-2 py-0.5 rounded-md uppercase tracking-widest border border-green-500/20">
                          {combo.restaurant_name || 'QuickCombo Exclusive'}
                        </span>
                      </div>
                      <h3 className="font-black text-3xl text-white uppercase italic tracking-tighter leading-none mb-2">{combo.name}</h3>
                      <p className="text-gray-400 text-sm font-medium line-clamp-2 leading-tight">
                        {combo.description || 'A perfectly balanced meal bundle designed for your satisfaction.'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="flex flex-wrap gap-2 mb-6">
                      {combo.items.map(item => (
                        <div key={item.id} className="flex items-center gap-1.5 bg-white/5 border border-white/5 px-3 py-1.5 rounded-xl">
                          <div className={`w-1.5 h-1.5 rounded-full ${item.is_veg ? 'bg-green-500' : 'bg-red-500'}`} />
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">{item.name}</span>
                        </div>
                      ))}
                    </div>
                    
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleAddPredefined(combo)}
                      className="w-full bg-green-500 hover:bg-green-400 text-black py-4 rounded-[20px] font-black flex items-center justify-center gap-3 text-sm shadow-lg shadow-green-500/10 transition-all uppercase italic tracking-widest"
                    >
                      CLAIM THIS BUNDLE <ArrowRight size={18} />
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
