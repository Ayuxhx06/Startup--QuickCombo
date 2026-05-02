'use client';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import useSWR from 'swr';
import axios from 'axios';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowRight, Zap, Star, Clock, MapPin, ChevronRight, Search,
  Coffee, IceCream, Drumstick, Carrot, UtensilsCrossed, Package, 
  Soup, Pizza, Sandwich, Flame, Store, Utensils, Croissant, Wheat
} from 'lucide-react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
const WeatherWidget = dynamic(() => import('@/components/WeatherWidget'), { ssr: false });
import FoodCard from '@/components/FoodCard';
import ManualAddBox from '@/components/ManualAddBox';
import MenuModal from '@/components/MenuModal';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://quickcombo.alwaysdata.net';

interface MenuItem {
  id: number; name: string; description: string; price: number;
  image_url: string; is_veg: boolean; rating: number; prep_time: number;
  category_name: string; is_featured: boolean; restaurant_name?: string;
}

interface Category {
  slug: string;
  icon: string;
  name: string;
}

interface Restaurant {
  id: number; name: string; rating: number; delivery_time: number;
  cuisines: string; image_url: string; is_featured: boolean;
}

export default function HomePage() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState('');
  const [search, setSearch] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedRest, setSelectedRest] = useState<{id: number, name: string} | null>(null);
  const [restMenu, setRestMenu] = useState<MenuItem[]>([]);
  const [loadingMenu, setLoadingMenu] = useState(false);

  const handleOpenMenu = async (e: React.MouseEvent, rest: Restaurant) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedRest({ id: rest.id, name: rest.name });
    setIsMenuOpen(true);
    setLoadingMenu(true);
    try {
      const res = await axios.get(`${API}/api/menu/?restaurant=${rest.id}`);
      setRestMenu(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMenu(false);
    }
  };


  const fetcher = (url: string) => axios.get(url).then(res => res.data);

  const { data: featured = [], isLoading: loadingFeatured } = useSWR<MenuItem[]>(`${API}/api/menu/?featured=1`, fetcher);
  const { data: restaurants = [], isLoading: loadingRestaurants } = useSWR<Restaurant[]>(`${API}/api/restaurants/`, fetcher);
  const { data: categories = [], isLoading: loadingCategories } = useSWR<Category[]>(`${API}/api/categories/`, fetcher);

  const loading = loadingFeatured || loadingRestaurants || loadingCategories;

  useEffect(() => {
    if (categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0].slug);
    }
  }, [categories, activeCategory]);

  const filteredRestaurants = restaurants.filter(r => 
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.cuisines.toLowerCase().includes(search.toLowerCase())
  );

  const getCategoryIcon = (slug: string, isActive: boolean) => {
    const s = slug.toLowerCase();
    const color = isActive ? "#22c55e" : "#9ca3af";
    const props = { strokeWidth: 1.5, size: 28, color };

    if (s.includes('beverage')) return <Coffee {...props} />;
    if (s.includes('dessert')) return <IceCream {...props} />;
    if (s.includes('non-veg') || s.includes('chicken') || s.includes('meat')) return <Drumstick {...props} />;
    if (s.includes('veg') && !s.includes('non-veg')) return <Carrot {...props} />;
    if (s.includes('biryani') || s.includes('rice') || s.includes('pulao')) return <Wheat {...props} />;
    if (s.includes('essential')) return <Package {...props} />;
    if (s.includes('indian')) return <UtensilsCrossed {...props} />;
    if (s.includes('chinese')) return <Soup {...props} />;
    if (s.includes('fast-food') || s.includes('burger')) return <Sandwich {...props} />;
    if (s.includes('italian') || s.includes('pizza')) return <Pizza {...props} />;
    if (s.includes('combo')) return <Flame {...props} />;
    if (s.includes('snack')) return <Croissant {...props} />;
    return <Utensils {...props} />;
  };

  return (
    <div className="page-wrapper">
      {/* Hero */}
      <section className="relative overflow-hidden px-4 pt-6 pb-10">

        {/* Ambient glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-64 bg-green-500/8 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-lg mx-auto">
          <WeatherWidget />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-6"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-green-400 pulse-green" />
              <span className="text-green-400 text-sm font-semibold">Delivering Now · 20-35 min</span>
            </div>
            <h1 className="text-4xl font-black leading-tight mb-2">
              Food + Essentials,<br />
              <span className="gradient-text">Delivered Fast ⚡</span>
            </h1>
            <p className="text-gray-400 text-base mb-6">
              Combos, snacks, drinks & daily essentials — all in one order.
            </p>
            <div className="flex flex-col gap-5">
              <div className="flex gap-3">
                <Link href="/menu">
                  <motion.button whileTap={{ scale: 0.96 }} className="btn-primary px-6 py-3 flex items-center gap-2 font-bold">
                    Order Now <ArrowRight size={18} />
                  </motion.button>
                </Link>
                <Link href="/combo">
                  <motion.button whileTap={{ scale: 0.96 }} className="btn-ghost px-6 py-3 flex items-center gap-2 font-bold">
                    <Zap size={18} />Explore Combos
                  </motion.button>
                </Link>
              </div>

              {/* Home Page Search Bar */}
              <div className="relative max-w-md group">
                <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-green-500 transition-colors" />
                <input 
                  type="text"
                  placeholder="Search for 'Pizza', 'Cigarettes', 'Milk'..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm text-white outline-none focus:border-green-500/50 focus:ring-4 focus:ring-green-500/5 transition-all font-medium placeholder:text-gray-600 shadow-xl"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      <section className="px-4 mb-8">
        <h2 className="font-black text-xl mb-5">Explore Categories</h2>
        <div className="flex gap-4 pb-4 overflow-x-auto no-scrollbar scroll-smooth snap-x">
          {categories.slice(0, 8).map((cat, i) => {
            const isRestaurantsCard = i === 1;
            const isActive = activeCategory === cat.slug;
            
            return (
              <div key={cat.slug} className="flex gap-4 snap-center">
                {isRestaurantsCard && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                  >
                    <Link href="/restaurants" className="snap-center">
                      <motion.div whileTap={{ scale: 0.95 }} className="flex flex-col items-center gap-3 cursor-pointer min-w-[72px]">
                        <div className="w-[64px] h-[64px] rounded-[22px] flex items-center justify-center transition-all duration-300 bg-[#121212] border border-transparent shadow-sm hover:bg-[#1a1a1a]">
                          <Store strokeWidth={1.5} size={28} color="#9ca3af" />
                        </div>
                        <span className="text-[12px] font-medium tracking-wide whitespace-nowrap text-[#9ca3af]">
                          Restaurants
                        </span>
                      </motion.div>
                    </Link>
                  </motion.div>
                )}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link href={`/menu?category=${cat.slug}`} className="snap-center">
                    <motion.div
                      whileTap={{ scale: 0.95 }}
                      className="flex flex-col items-center gap-3 cursor-pointer min-w-[72px] relative"
                      onClick={() => setActiveCategory(cat.slug)}
                    >
                      <motion.div 
                        animate={isActive ? { scale: 1.05 } : { scale: 1 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        className={`w-[64px] h-[64px] rounded-[22px] flex items-center justify-center transition-all duration-300 ${
                          isActive 
                            ? 'bg-[#121212] border border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.25)]' 
                            : 'bg-[#121212] border border-transparent shadow-sm hover:bg-[#1a1a1a]'
                        }`}
                      >
                        {getCategoryIcon(cat.slug, isActive)}
                      </motion.div>
                      <span className={`text-[12px] font-medium tracking-wide whitespace-nowrap transition-colors duration-300 ${
                        isActive ? 'text-white' : 'text-[#9ca3af]'
                      }`}>
                        {cat.name}
                      </span>
                    </motion.div>
                  </Link>
                </motion.div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Top Restaurants Section */}
      <section id="restaurants-section" className="px-4 mb-8 pt-4">
        <h2 className="font-black text-xl mb-4">🌟 Top Restaurants</h2>
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
          {loading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="min-w-[260px] h-[200px] rounded-2xl shimmer snap-center" />
            ))
          ) : filteredRestaurants.length === 0 ? (
            <div className="w-full py-10 text-center flex flex-col items-center gap-3">
               <div className="text-4xl opacity-40">🍽️</div>
               <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">No partners match your search</p>
               <button onClick={() => setSearch('')} className="text-green-500 text-xs font-black uppercase">Clear Search</button>
            </div>
          ) : (
            filteredRestaurants.map((rest, i) => (
              <motion.div
                key={rest.id}
                onClick={() => router.push(`/menu?restaurant=${rest.id}`)}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="min-w-[280px] sm:min-w-[320px] rounded-3xl overflow-hidden glass hover:border-green-500/40 transition-all snap-center group cursor-pointer"
              >
                <div className="h-[140px] relative overflow-hidden">
                  <Image 
                    src={rest.image_url.startsWith('http') ? rest.image_url : `${API}${rest.image_url}`} 
                    alt={rest.name} 
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110" 
                    sizes="(max-width: 768px) 100vw, 320px"
                  />
                  <div className="absolute top-0 right-0 p-3">
                    <div className="glass px-2.5 py-1 rounded-full text-xs font-black flex items-center gap-1">
                      <Star size={12} className="text-green-400 fill-green-400" /> {rest.rating}
                    </div>
                  </div>
                </div>
                <div className="p-4 relative">
                  <h3 className="font-bold text-lg leading-tight mb-1 truncate">{rest.name}</h3>
                  <p className="text-gray-400 text-xs truncate mb-2">{rest.cuisines}</p>
                  <div className="flex items-center gap-3 text-xs font-semibold text-gray-300">
                    <span className="flex items-center gap-1"><Clock size={12} className="text-green-400" /> {rest.delivery_time} min</span>
                  </div>
                  
                  {/* Menu Button Overlay */}
                  <button 
                    onClick={(e) => handleOpenMenu(e, rest)}
                    className="absolute bottom-4 right-4 bg-green-500 text-black px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-green-400 transition-all shadow-lg z-20"
                  >
                    VIEW MENU
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="mt-4 px-2 flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest italic"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          Expanding our kitchen! More partner restaurants arriving soon based on your cravings.
        </motion.div>
      </section>

      {/* Featured Items */}
      <section className="px-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-black text-lg">🔥 Popular Food</h2>
          <Link href="/menu" className="flex items-center gap-1 text-green-400 text-sm font-semibold">
            See all <ChevronRight size={16} />
          </Link>
        </div>

        {loading ? (
          <div className="flex flex-col gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-40 rounded-2xl shimmer" />
            ))}
          </div>
        ) : (
          <motion.div
            className="flex flex-col gap-3"
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
          >
            {featured.slice(0, 5).map(item => (
              <motion.div
                key={item.id}
                variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } }}
              >
                <FoodCard item={item} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </section>

      {/* Quick Essentials */}
      <section className="px-4 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-black text-lg">🛒 Quick Essentials</h2>
          <Link href="/menu?category=essentials" className="flex items-center gap-1 text-green-400 text-sm font-semibold">
            See all <ChevronRight size={16} />
          </Link>
        </div>
        <Link href="/menu?category=essentials">
          <motion.div
            whileTap={{ scale: 0.98 }}
            className="glass rounded-2xl p-4 flex items-center justify-between hover:border-green-500/20 transition-all mb-4"
          >
            <div className="flex items-center gap-4">
              <div className="text-3xl">🛒</div>
              <div>
                <div className="font-bold">Cigarettes, Chips, Drinks</div>
                <div className="text-gray-500 text-sm">Daily essentials delivered fast</div>
              </div>
            </div>
            <ChevronRight size={20} className="text-gray-500" />
          </motion.div>
        </Link>
        
        {/* Special Request Box on Home Page */}
        <ManualAddBox />
      </section>
      <section className="px-4 mb-20">
        <div className="glass rounded-[32px] overflow-hidden border border-white/10 shadow-2xl">
          <div className="p-6 bg-gradient-to-br from-green-500/5 to-transparent flex flex-col items-center text-center">
            <div className="w-full max-w-[280px] h-[100px] relative rounded-xl overflow-hidden mb-4 bg-white/5 p-2">
              <Image 
                src="/msme_logo.png" 
                alt="MSME Udyam Registration" 
                fill
                className="object-contain"
              />
            </div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 pulse-green" />
              <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Verified MSME Enterprise</span>
            </div>
            <p className="text-[11px] text-gray-500 font-medium leading-relaxed max-w-[240px] mb-4">
              QuickCombo is a registered enterprise under India's Ministry of MSME.
            </p>
            <Link href="/about">
              <motion.button 
                whileTap={{ scale: 0.95 }}
                className="text-xs font-bold text-green-400 border border-green-500/30 px-6 py-2 rounded-full hover:bg-green-500/10 transition-all font-mono tracking-tighter"
              >
                VIEW_CERTIFICATION_HUB
              </motion.button>
            </Link>
            <MenuModal 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)} 
        restaurantName={selectedRest?.name || ''} 
        items={restMenu} 
      />
    </div>

        </div>
        <div className="text-center mt-8 pb-4 space-y-2">
          <p className="text-[10px] text-gray-700 font-black tracking-widest uppercase italic">QuickCombo • Made with ❤️ in India</p>
          <div className="flex justify-center gap-4 text-[10px] text-gray-600 font-bold uppercase tracking-widest">
            <Link href="/terms" className="hover:text-green-500 transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-green-500 transition-colors">Privacy</Link>
          </div>
        </div>
      </section>
      <MenuModal 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)} 
        restaurantName={selectedRest?.name || ''} 
        items={restMenu} 
      />
    </div>
  );
}
