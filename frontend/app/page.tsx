'use client';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import useSWR from 'swr';
import axios from 'axios';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Zap, Star, Clock, MapPin, ChevronRight, Search,
  Coffee, IceCream, Drumstick, Carrot, UtensilsCrossed, Package, 
  Soup, Pizza, Sandwich, Flame, Store, Utensils, Croissant, Wheat, Users
} from 'lucide-react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
const BannerCarousel = dynamic(() => import('@/components/BannerCarousel'), { ssr: false });
import FoodCard from '@/components/FoodCard';
import ManualAddBox from '@/components/ManualAddBox';
import MenuModal from '@/components/MenuModal';
import QiqiChatbot from '@/components/QiqiChatbot';

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
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupName, setGroupName] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('group-order=true')) {
      setShowGroupModal(true);
      window.history.replaceState(null, '', '/');
    }

    const handleOpenGroupOrder = () => setShowGroupModal(true);
    window.addEventListener('openGroupOrder', handleOpenGroupOrder);
    return () => window.removeEventListener('openGroupOrder', handleOpenGroupOrder);
  }, []);

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

  const handleCreateGroupOrder = async () => {
    if (!groupName.trim()) return;
    setCreatingGroup(true);
    try {
      const res = await axios.post(`${API}/api/group-order/create/`, {
        creator_name: groupName.trim(),
      });
      const sessionId = res.data.session_id;
      sessionStorage.setItem(`group_name_${sessionId}`, groupName.trim());
      setShowGroupModal(false);
      setGroupName('');
      router.push(`/group/${sessionId}`);
    } catch {
      alert('Failed to create group order. Please try again.');
    } finally {
      setCreatingGroup(false);
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
      {/* Banner Carousel — full-bleed hero replacement */}
      <section className="mb-4">
        <BannerCarousel />
      </section>

      {/* Search Bar */}
      <section className="px-4 pb-4">
        <div className="relative max-w-lg mx-auto group">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-green-500 transition-colors" />
          <input
            type="text"
            placeholder="Search for 'Pizza', 'Burgers', 'Milk'..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-11 pr-4 text-sm text-white outline-none focus:border-green-500/50 focus:ring-4 focus:ring-green-500/5 transition-all placeholder:text-gray-600"
          />
        </div>
      </section>

      {/* Core Verticals: Food & Daily Needs */}
      <section className="px-4 mb-5">
        <div className="grid grid-cols-2 gap-3 max-w-lg mx-auto">
          {/* Food Card */}
          <Link href="/restaurants" className="block">
            <motion.div
              whileTap={{ scale: 0.96 }}
              className="relative overflow-hidden rounded-2xl p-4 h-28 flex flex-col justify-end group transition-all"
              style={{ background: 'linear-gradient(135deg, #1f1209 0%, #111 100%)', border: '1px solid rgba(249,115,22,0.15)' }}
            >
              <div className="absolute -top-2 -right-2 w-20 h-20 bg-orange-500/10 rounded-full blur-xl group-hover:bg-orange-500/20 transition-all" />
              <div className="absolute top-3 right-3 text-orange-500/40 group-hover:scale-110 transition-transform">
                <UtensilsCrossed size={36} strokeWidth={1.5} />
              </div>
              <h3 className="font-black text-white text-lg leading-tight relative z-10">Food<br />Delivery</h3>
            </motion.div>
          </Link>

          {/* Daily Needs Card */}
          <Link href="/menu?category=essentials" className="block">
            <motion.div
              whileTap={{ scale: 0.96 }}
              className="relative overflow-hidden rounded-2xl p-4 h-28 flex flex-col justify-end group transition-all"
              style={{ background: 'linear-gradient(135deg, #022c22 0%, #111 100%)', border: '1px solid rgba(34,197,94,0.15)' }}
            >
              <div className="absolute -top-2 -right-2 w-20 h-20 bg-green-500/10 rounded-full blur-xl group-hover:bg-green-500/20 transition-all" />
              <div className="absolute top-3 right-3 text-green-500/40 group-hover:scale-110 transition-transform">
                <Package size={36} strokeWidth={1.5} />
              </div>
              <h3 className="font-black text-white text-lg leading-tight relative z-10">Daily<br />Needs</h3>
            </motion.div>
          </Link>
        </div>
      </section>

      {/* Group Order Entry Card */}
      <section className="px-4 mb-5">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          onClick={() => setShowGroupModal(true)}
          className="relative overflow-hidden cursor-pointer rounded-2xl p-4 flex items-center gap-4 active:scale-[0.98] transition-all"
          style={{ background: 'linear-gradient(135deg, #1e0a3c 0%, #0d1f3c 100%)', border: '1px solid rgba(139,92,246,0.25)' }}
        >
          {/* Glow blobs */}
          <div className="absolute -top-4 -left-4 w-20 h-20 bg-purple-600/20 rounded-full blur-xl pointer-events-none" />
          <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-blue-600/20 rounded-full blur-xl pointer-events-none" />

          <div className="w-11 h-11 bg-purple-500/20 border border-purple-400/30 rounded-2xl flex items-center justify-center shrink-0 relative z-10">
            <Users size={20} className="text-purple-300" />
          </div>
          <div className="relative z-10 flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="font-black text-white text-sm">Group Order</h3>
              <span className="text-[9px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-1.5 py-0.5 rounded-full font-black uppercase">New</span>
            </div>
            <p className="text-purple-300/60 text-[11px]">Order together · everyone picks their own</p>
          </div>
          <div className="relative z-10 bg-purple-500 hover:bg-purple-400 text-white text-[11px] font-black px-3.5 py-2 rounded-xl shrink-0 shadow-lg shadow-purple-500/25">
            Start →
          </div>
        </motion.div>
      </section>

      {/* Group Order Name Modal — sits above bottom nav */}
      {showGroupModal && (
        <div 
          className="fixed inset-0 z-[60] flex items-end justify-center"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
          onClick={() => setShowGroupModal(false)}
        >
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 60 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full max-w-md mb-20 mx-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="bg-[#111] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
              {/* Header with back button */}
              <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center justify-center">
                    <Users size={18} className="text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-black text-white text-base leading-tight">Group Order</h3>
                    <p className="text-gray-500 text-[11px]">Friends deliver to your address</p>
                  </div>
                </div>
                {/* Back / Close button */}
                <button 
                  onClick={() => setShowGroupModal(false)}
                  className="w-8 h-8 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl flex items-center justify-center transition-all"
                >
                  <span className="text-gray-400 text-lg leading-none">&times;</span>
                </button>
              </div>

              {/* Body */}
              <div className="p-5">
                <label className="text-[10px] text-gray-500 font-black uppercase tracking-wider block mb-2">Your Name</label>
                <input
                  type="text"
                  value={groupName}
                  onChange={e => setGroupName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCreateGroupOrder()}
                  placeholder="e.g. Ayush"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-white placeholder-gray-600 focus:border-purple-500/50 outline-none text-sm transition-all"
                  autoFocus
                />
                <p className="text-[10px] text-gray-600 mt-2 mb-4">A shareable link will be created — send it to your friends on WhatsApp</p>
                <button
                  onClick={handleCreateGroupOrder}
                  disabled={creatingGroup || !groupName.trim()}
                  className="w-full bg-purple-500 hover:bg-purple-400 disabled:opacity-50 text-white font-black py-4 rounded-2xl transition-all text-sm uppercase tracking-wide shadow-lg shadow-purple-500/20 active:scale-[0.98]"
                >
                  {creatingGroup ? 'Creating...' : ' Create Group Link'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Categories */}
      <section className="px-4 mb-8">
        <h2 className="font-black text-xl mb-5">Explore Categories</h2>
        <div className="flex gap-4 pb-4 pt-3 px-1 -mx-1 overflow-x-auto no-scrollbar scroll-smooth snap-x">
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
        <div className="flex items-center justify-between mb-4">
           <h2 className="font-black text-xl"> Top Restaurants</h2>
           <Link href="/restaurants" className="text-green-500 text-sm font-semibold">See all</Link>
        </div>
        <div className="flex gap-4 pb-4 overflow-x-auto no-scrollbar scroll-smooth snap-x">
          {loading ? (
            [...Array(2)].map((_, groupIndex) => (
              <div key={groupIndex} className="min-w-[85vw] sm:min-w-[320px] grid grid-cols-2 grid-rows-2 gap-3 snap-center shrink-0">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="w-full aspect-[4/3] rounded-[14px] shimmer" />
                ))}
              </div>
            ))
          ) : filteredRestaurants.length === 0 ? (
            <div className="w-full py-10 text-center flex flex-col items-center gap-3">
               <div className="text-4xl opacity-40">️</div>
               <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">No partners match your search</p>
               <button onClick={() => setSearch('')} className="text-green-500 text-xs font-black uppercase">Clear Search</button>
            </div>
          ) : (
            Array.from({ length: Math.ceil(filteredRestaurants.length / 4) }, (_, i) => 
              filteredRestaurants.slice(i * 4, i * 4 + 4)
            ).map((group, groupIndex) => (
              <div key={groupIndex} className="min-w-[85vw] sm:min-w-[320px] grid grid-cols-2 grid-rows-2 gap-3 snap-center shrink-0">
                {group.map((rest, i) => (
                  <motion.div
                    key={rest.id}
                    whileTap={{ scale: 0.96 }}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: (groupIndex * 4 + i) * 0.05 }}
                    onClick={() => router.push(`/menu?restaurant=${rest.id}`)}
                    className="w-full bg-[#1a1a1a] rounded-[14px] overflow-hidden shadow-sm transition-all cursor-pointer group flex flex-col"
                  >
                    <div className="relative h-[100px] w-full overflow-hidden">
                      <Image 
                        src={(rest.image_url && rest.image_url.startsWith('http')) ? rest.image_url : `${API}${rest.image_url || ''}`} 
                        alt={rest.name} 
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105" 
                        sizes="(max-width: 768px) 50vw, 300px"
                      />
                      {/* Overlay for readability */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#121212]/90 via-transparent to-transparent pointer-events-none" />

                      {/* Rating Badge (Bottom Left) */}
                      <div className="absolute bottom-2 left-2 bg-green-600/95 backdrop-blur-sm text-white px-1.5 py-0.5 rounded-full text-[10px] font-black flex items-center gap-0.5 shadow-sm">
                        <Star size={10} className="fill-white" /> {rest.rating}
                      </div>
                    </div>
                    
                    <div className="p-2.5 flex flex-col gap-0.5">
                      <h3 className="font-bold text-[13px] leading-tight text-white truncate">{rest.name}</h3>
                      <p className="text-[#9ca3af] text-[10px] truncate">{rest.cuisines}</p>
                      <div className="flex items-center gap-1 mt-0.5 text-[#9ca3af] text-[10px] font-medium">
                        <span>⏱ {rest.delivery_time}–{rest.delivery_time + 5} min</span>
                        <span className="mx-0.5">•</span>
                        <span>1.2 km</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
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
          <h2 className="font-black text-lg"> Popular Food</h2>
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
          <h2 className="font-black text-lg"> Quick Essentials</h2>
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
              <div className="text-3xl"></div>
              <div>
                <div className="font-bold">Chips, Drinks, Snacks</div>
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
          <p className="text-[10px] text-gray-700 font-black tracking-widest uppercase italic">QuickCombo • Made with ️ in India</p>
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
      {/* Qiqi AI Chatbot — Home page only */}
      <QiqiChatbot />
    </div>
  );
}
