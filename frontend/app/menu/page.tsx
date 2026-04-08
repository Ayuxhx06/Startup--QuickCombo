'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState, Suspense } from 'react';
import axios from 'axios';
import { Search, LayoutGrid, AlignJustify, Filter, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import FoodCard from '@/components/FoodCard';
import { useSearchParams, useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import toast from 'react-hot-toast';
import { Plus, Minus, Package, ShoppingCart } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://quickcombo.alwaysdata.net';

interface Category {
  slug: string;
  icon: string;
  name: string;
}

interface MenuItem {
  id: number; name: string; description: string; price: number;
  image_url: string; is_veg: boolean; rating: number; prep_time: number;
  category_name: string; is_featured: boolean; restaurant_name?: string;
}

function ManualAddBox() {
    const { addItem } = useCart();
    const [name, setName] = useState('');
    const [qty, setQty] = useState(1);
    const [unit, setUnit] = useState('piece');

    const handleAdd = () => {
        if (!name.trim()) {
            toast.error('Please enter item name');
            return;
        }
        addItem({
            id: `manual-${Date.now()}`,
            name: name.trim(),
            price: 0,
            quantity: qty,
            unit: unit,
            image_url: '',
            is_veg: true,
            category_name: 'Essentials'
        });
        setName('');
        setQty(1);
        toast.success(`Added ${name} to cart`);
    };

    return (
        <div className="bg-[#111] border border-green-500/20 rounded-3xl p-6 mb-8 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                    <Package size={20} />
                </div>
                <div>
                    <h3 className="font-black uppercase italic text-sm tracking-wider">Didn't find what you need?</h3>
                    <p className="text-[10px] text-gray-500 font-bold uppercase">Add it manually below!</p>
                </div>
            </div>

            <div className="space-y-4">
                <input 
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="E.g. 555 Cigarette, 1L Milk..."
                    className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-sm outline-none focus:border-green-500/50 transition-all font-medium"
                />

                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center bg-black/40 border border-white/5 rounded-2xl p-1.5">
                        <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:bg-white/5"><Minus size={16}/></button>
                        <span className="w-10 text-center font-black text-sm">{qty}</span>
                        <button onClick={() => setQty(qty + 1)} className="w-8 h-8 rounded-xl flex items-center justify-center text-green-500 hover:bg-white/5"><Plus size={16}/></button>
                    </div>

                    <div className="flex bg-black/40 border border-white/5 rounded-2xl p-1">
                        {['piece', 'kg', 'litre'].map(u => (
                            <button 
                                key={u}
                                onClick={() => setUnit(u)}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${unit === u ? 'bg-green-500 text-black' : 'text-gray-500 hover:text-white'}`}
                            >
                                {u === 'piece' ? 'Pc' : u === 'kg' ? 'Kg' : 'Lt'}
                            </button>
                        ))}
                    </div>

                    <button 
                        onClick={handleAdd}
                        className="flex-grow bg-green-500 text-black font-black uppercase py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-green-400 transition-all text-xs tracking-widest shadow-lg shadow-green-500/10"
                    >
                        <ShoppingCart size={16} /> Add to Cart
                    </button>
                </div>
            </div>
        </div>
    );
}

function MenuContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [restaurantId, setRestaurantId] = useState(searchParams.get('restaurant') || '');
  const [vegOnly, setVegOnly] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    axios.get(`${API}/api/categories/`).then(r => {
      setCategories([{ slug: '', icon: '🍽️', name: 'All' }, ...r.data]);
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (restaurantId) params.set('restaurant', restaurantId);
    
    axios.get(`${API}/api/menu/?${params.toString()}`)
      .then(r => { 
        setItems(r.data); 
        setLoading(false); 
      })
      .catch(() => setLoading(false));
  }, [category, debouncedSearch, restaurantId]);

  const filtered = vegOnly ? items.filter(i => i.is_veg) : items;

  return (
    <div className="page-wrapper max-w-lg mx-auto">
      {/* Search bar */}
      <div className="sticky top-14 z-[90] bg-black/90 backdrop-blur-xl px-4 pt-4 pb-3 border-b border-white/5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {restaurantId && (
              <button 
                onClick={() => router.back()}
                className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center text-white bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                title="Go Back"
              >
                <ArrowLeft size={20} />
              </button>
            )}
            <h1 className="text-xl font-black text-white">
              {restaurantId && items.length > 0 ? items[0].restaurant_name : 'Explore Menu'}
            </h1>
          </div>
          <div className="flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
             <span className="text-[10px] font-bold text-green-500 uppercase tracking-wider">Live Menu</span>
          </div>
        </div>
        
        <div className="relative mb-3 group">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-green-500 transition-colors z-10" />
          <input
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-11 pr-4 text-white outline-none focus:border-green-500/50 transition-all font-medium text-sm"
            placeholder={`Search in ${restaurantId && items.length > 0 ? items[0].restaurant_name : 'all dishes'}...`}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Category filter chips */}
        <div className="flex gap-2 pb-1 mt-2 overflow-x-auto no-scrollbar scroll-smooth snap-x">
          {categories.map(cat => (
            <button
              key={cat.slug}
              onClick={() => setCategory(cat.slug)}
              className="w-full flex flex-col items-center gap-1.5 cursor-pointer relative"
            >
              <div className={`w-[48px] h-[48px] rounded-full flex items-center justify-center text-xl shadow-[0_4px_12px_rgba(0,0,0,0.5)] transition-colors ${
                category === cat.slug ? 'bg-green-500/20 border border-green-500/50' : 'bg-[#1c1c1c] border border-transparent'
              }`}>
                {cat.icon}
              </div>
              <div className={`flex flex-col items-center border-b-[3px] pb-1.5 w-full mx-auto ${
                category === cat.slug
                  ? 'border-green-500'
                  : 'border-transparent'
              }`}>
                <span className={`text-[10px] font-bold tracking-tight whitespace-nowrap ${category === cat.slug ? 'text-white' : 'text-gray-400'}`}>
                  {cat.name}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setVegOnly(!vegOnly)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                vegOnly ? 'bg-green-500/20 border-green-500 text-green-400' : 'border-white/10 text-gray-500'
              }`}
            >
              <div className={`veg-badge veg`} />
              Veg Only
            </button>
            <span className="text-gray-600 text-xs">{filtered.length} items</span>
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="px-4 pb-8">
        {category === 'essentials' && <ManualAddBox />}
        {loading ? (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="shimmer rounded-2xl h-36" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-gray-400 font-medium">No items found</p>
            <p className="text-gray-600 text-sm mt-1">Try a different search or category</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={category}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-2.5"
            >
              {filtered.map(item => (
                <FoodCard key={item.id} item={item} />
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

export default function MenuPage() {
  return (
    <Suspense fallback={
      <div className="p-4 space-y-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="shimmer rounded-2xl h-36" />
        ))}
      </div>
    }>
      <MenuContent />
    </Suspense>
  );
}
