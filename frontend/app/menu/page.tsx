'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState, Suspense, useRef } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { Search, ArrowLeft } from 'lucide-react';
import FoodCard from '@/components/FoodCard';
import { useSearchParams, useRouter } from 'next/navigation';
import ManualAddBox from '@/components/ManualAddBox';
import CategoryMenu, { MenuFAB } from '@/components/CategoryMenu';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://quickcombo.alwaysdata.net';

interface Category {
  slug: string;
  icon: string;
  name: string;
}

interface MenuItem {
  id: number; name: string; description: string; price: number;
  image_url: string; is_veg: boolean; rating: number; prep_time: number;
  category_name: string; is_featured: boolean; 
  restaurant?: number | string;
  restaurant_name?: string;
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
  const [isCatMenuOpen, setIsCatMenuOpen] = useState(false);
  const [activeNavCategory, setActiveNavCategory] = useState('');
  
  const observer = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const url = restaurantId ? `${API}/api/categories/?restaurant=${restaurantId}` : `${API}/api/categories/`;
    axios.get(url).then(r => {
      setCategories([{ slug: '', icon: '🍽️', name: 'All' }, ...r.data]);
    });
  }, [restaurantId]);

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

  // Group items by category
  const groupedItems = items.reduce((acc: any, item) => {
    const catName = item.category_name || 'Other';
    if (!acc[catName]) acc[catName] = [];
    acc[catName].push(item);
    return acc;
  }, {});

  const filteredGrouped: any = {};
  Object.keys(groupedItems).forEach(cat => {
    const list = vegOnly ? groupedItems[cat].filter((i: any) => i.is_veg) : groupedItems[cat];
    if (list.length > 0) filteredGrouped[cat] = list;
  });

  const categoryList = Object.keys(filteredGrouped).map(name => ({
    name,
    slug: name.toLowerCase().replace(/\s+/g, '-'),
    count: filteredGrouped[name].length
  }));

  useEffect(() => {
    if (loading) return;
    
    // Intersection Observer to track active category
    observer.current = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveNavCategory(entry.target.id.replace('category-', ''));
        }
      });
    }, { rootMargin: '-10% 0px -80% 0px' });

    categoryList.forEach(cat => {
      const el = document.getElementById(`category-${cat.slug}`);
      if (el) observer.current?.observe(el);
    });

    return () => observer.current?.disconnect();
  }, [loading, categoryList]);

  const scrollToCategory = (slug: string) => {
    const element = document.getElementById(`category-${slug}`);
    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
      // Compensate for sticky header
      const offset = 180;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="page-wrapper max-w-lg mx-auto pb-24">
      {/* Search & Header */}
      <div className="sticky top-14 z-[90] bg-black/95 backdrop-blur-xl px-4 pt-4 pb-3 border-b border-white/5 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {restaurantId && (
              <button onClick={() => router.back()} className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center text-white bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                <ArrowLeft size={20} />
              </button>
            )}
            <h1 className="text-xl font-black text-white italic tracking-tighter">
              {restaurantId && items.length > 0 ? items[0].restaurant_name : 'Explore Menu'}
            </h1>
          </div>
          <div className="flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
             <span className="text-[10px] font-bold text-green-500 uppercase tracking-wider">Live Menu</span>
          </div>
        </div>
        
        <div className="relative group">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-green-500 transition-colors z-10" />
          <input
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-11 pr-4 text-white outline-none focus:border-green-500/50 transition-all font-medium text-sm"
            placeholder={`Search in ${restaurantId && items.length > 0 ? items[0].restaurant_name : 'all dishes'}...`}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="px-4 py-4 flex items-center justify-between">
        <button
          onClick={() => setVegOnly(!vegOnly)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
            vegOnly ? 'bg-green-500/20 border-green-500 text-green-400' : 'border-white/10 text-gray-500'
          }`}
        >
          <div className={`w-2.5 h-2.5 rounded-full border border-black/20 ${vegOnly ? 'bg-green-500' : 'bg-gray-700'}`} />
          Veg Only
        </button>
        <span className="text-gray-600 text-[10px] font-bold uppercase tracking-widest">{items.length} dishes</span>
      </div>

      {/* Items Grouped by Category */}
      <div className="px-4 pb-32">
        {category === 'essentials' && <ManualAddBox />}
        {loading ? (
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => <div key={i} className="shimmer rounded-[32px] h-36" />)}
          </div>
        ) : Object.keys(filteredGrouped).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center opacity-30">
            <div className="text-6xl mb-4">🍽️</div>
            <p className="font-black uppercase tracking-[0.2em] text-xs">Menu is empty</p>
          </div>
        ) : (
          <div className="space-y-12">
            {Object.keys(filteredGrouped).map(catName => (
              <div 
                key={catName} 
                id={`category-${catName.toLowerCase().replace(/\s+/g, '-')}`} 
                className="scroll-mt-[200px]"
              >
                <div className="flex items-center gap-4 mb-5">
                  <h2 className="text-xl font-black uppercase tracking-tighter text-white/90 italic">{catName}</h2>
                  <div className="h-[1px] flex-1 bg-gradient-to-r from-white/10 to-transparent" />
                  <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">{filteredGrouped[catName].length} Items</span>
                </div>
                <div className="space-y-4">
                  {filteredGrouped[catName].map((item: any) => (
                    <FoodCard key={item.id} item={item} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <MenuFAB onClick={() => setIsCatMenuOpen(true)} />
      
      <CategoryMenu 
        isOpen={isCatMenuOpen} 
        onClose={() => setIsCatMenuOpen(false)} 
        categories={categoryList}
        activeCategory={activeNavCategory}
        onCategorySelect={scrollToCategory}
      />

      <div className="text-center mt-12 pb-8 space-y-2 opacity-50">
        <p className="text-[10px] text-gray-700 font-black tracking-widest uppercase italic">QuickCombo • Made with ❤️ in India</p>
        <div className="flex justify-center gap-4 text-[10px] text-gray-600 font-bold uppercase tracking-widest">
          <Link href="/terms" className="hover:text-green-500 transition-colors">Terms</Link>
          <Link href="/privacy" className="hover:text-green-500 transition-colors">Privacy</Link>
        </div>
      </div>
    </div>
  );
}

export default function MenuPage() {
  return (
    <Suspense fallback={<div className="p-4 space-y-4">{[...Array(6)].map((_, i) => <div key={i} className="shimmer rounded-[32px] h-36" />)}</div>}>
      <MenuContent />
    </Suspense>
  );
}
